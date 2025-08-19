import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedTabs, AnimatedTabsContent, AnimatedTabsList, AnimatedTabsTrigger } from "@/components/ui/animated-tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useIOSNotifications } from "@/components/ui/ios-notification-manager";
import { 
  Plus, 
  Play, 
  Clock, 
  Target, 
  TrendingUp, 
  Dumbbell,
  BarChart3,
  Calendar,
  CheckCircle2,
  MoreVertical,
  Trash2,
  RotateCcw,
  Copy,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Settings,
  BookOpen,
  Activity,
  FileText,
  Repeat,
  ChartBar,
  MapPin,
  Zap,
  Brain,
  Sparkles
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ExerciseManagement, CreateExerciseButton } from "./exercise-management";
import { WorkoutExecutionWrapper } from "./WorkoutExecutionWrapper";
import { WorkoutDetails } from "./workout-details";
import { VolumeLandmarks } from "./volume-landmarks";
import { AutoRegulationDashboard } from "./auto-regulation-dashboard";
import MesocycleDashboard from "./mesocycle-dashboard";

import LoadProgressionTracker from "./load-progression-tracker";
import { FeatureFlagManager } from "./FeatureFlagManager";
import { FeatureShowcase } from "./enhanced/FeatureShowcase";
import { LoadingState, WorkoutSessionSkeleton, DashboardCardSkeleton } from "@/components/ui/loading";
import { SavedWorkoutTemplatesTab } from "./SavedWorkoutTemplatesTab";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Edit session schema
const editSessionSchema = z.object({
  name: z.string().min(1, "Session name is required").max(100, "Session name must be less than 100 characters"),
});

type EditSessionForm = z.infer<typeof editSessionSchema>;

interface Exercise {
  id: number;
  name: string;
  category: string;
  muscleGroups: string[];
  primaryMuscle: string;
  equipment: string;
  movementPattern: string;
  difficulty: string;
  instructions: string;
  translations: Record<string, string>;
}

interface WorkoutSession {
  id: number;
  userId: number;
  programId: number | null;
  mesocycleId: number | null;
  date: string;
  name: string;
  isCompleted: boolean;
  totalVolume: number;
  duration: number;
}

interface TrainingStats {
  totalSessions: number;
  totalVolume: number;
  averageSessionLength: number;
  favoriteExercises: string[];
  weeklyProgress: Array<{
    week: string;
    sessions: number;
    volume: number;
  }>;
}

// WorkoutSessionsWithBulkActions Component
interface WorkoutSessionsWithBulkActionsProps {
  sessions: WorkoutSession[];
  mesocycleLookup: Record<number, string>;
  onStartSession: (sessionId: number) => void;
  onViewSession: (sessionId: number) => void;
  userId: number;
}

function WorkoutSessionsWithBulkActions({ 
  sessions, 
  mesocycleLookup,
  onStartSession, 
  onViewSession, 
  userId 
}: WorkoutSessionsWithBulkActionsProps) {
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useIOSNotifications();

  // Edit session mutation
  const editSessionMutation = useMutation({
    mutationFn: async ({ sessionId, updates }: { sessionId: number; updates: { name: string } }) => {
      const response = await apiRequest('PUT', `/api/training/sessions/${sessionId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training/sessions", userId] });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (sessionIds: number[]) => {
      const response = await apiRequest('DELETE', '/api/training/sessions/bulk', {
        sessionIds,
        userId
      });
      return response.json();
    },
    onSuccess: () => {
      showSuccess("Sessions Deleted", `${selectedSessions.length} workout sessions have been deleted`);
      setSelectedSessions([]);
      setBulkDeleteMode(false);
      queryClient.invalidateQueries({ queryKey: ["/api/training/sessions", userId] });
    },
  });

  // Restart session mutation
  const restartSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest('POST', `/api/training/sessions/${sessionId}/restart`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training/sessions", userId] });
    },
  });

  // Save as template mutation
  const saveAsTemplateMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest('POST', `/api/training/sessions/${sessionId}/save-as-template`);
      return response.json();
    },
    onSuccess: (data) => {
      showSuccess("Template Saved", `Workout session has been saved as "${data.templateName}" template`);
      queryClient.invalidateQueries({ queryKey: ["/api/training/saved-workout-templates"] });
    },
    onError: (error: any) => {
      showError("Failed to save template", error.message || "Failed to save template");
    },
  });

  const handleSelectAll = () => {
    if (selectedSessions.length === sessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(sessions.map(s => s.id));
    }
  };

  const handleSessionSelect = (sessionId: number) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleBulkDelete = () => {
    if (selectedSessions.length > 0) {
      bulkDeleteMutation.mutate(selectedSessions);
    }
  };

  return (
    <div className="space-y-3">
      {/* Compact Bulk Actions Header */}
      <div className="flex items-center gap-2 p-2 bg-muted/50 ">
        <Button
          variant={bulkDeleteMode ? "destructive" : "outline"}
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={() => {
            setBulkDeleteMode(!bulkDeleteMode);
            setSelectedSessions([]);
          }}
        >
          {bulkDeleteMode ? (
            <>
              <X className="h-3 w-3 mr-1" />
              Cancel
            </>
          ) : (
            <>
              <Trash2 className="h-3 w-3 mr-1" />
              Bulk Delete
            </>
          )}
        </Button>

        {bulkDeleteMode && (
          <div className="flex items-center gap-2 flex-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={handleSelectAll}
            >
              {selectedSessions.length === sessions.length ? "Deselect All" : "Select All"}
            </Button>
            
            {selectedSessions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                Delete ({selectedSessions.length})
              </Button>
            )}
            
            <span className="text-xs text-muted-foreground ml-auto">
              {selectedSessions.length}/{sessions.length}
            </span>
          </div>
        )}
      </div>

      {/* Sessions Grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 overflow-hidden">
        {sessions.map((session) => (
          <WorkoutSessionCard
            key={session.id}
            session={session}
            mesocycleName={session.mesocycleId ? mesocycleLookup[session.mesocycleId] : undefined}
            onStart={() => onStartSession(session.id)}
            onView={() => onViewSession(session.id)}
            onDelete={() => bulkDeleteMutation.mutate([session.id])}
            onRestart={() => restartSessionMutation.mutate(session.id)}
            onEdit={(sessionId, updates) => editSessionMutation.mutate({ sessionId, updates })}
            onSaveAsTemplate={(sessionId) => saveAsTemplateMutation.mutate(sessionId)}
            onDuplicate={() => {
              // TODO: Implement duplicate functionality
              showSuccess("Feature Coming Soon", "Session duplication will be available in a future update");
            }}
            showCheckbox={bulkDeleteMode}
            isSelected={selectedSessions.includes(session.id)}
            onSelect={() => handleSessionSelect(session.id)}
          />
        ))}
      </div>
    </div>
  );
}

// WorkoutSessionCard Component
interface WorkoutSessionCardProps {
  session: WorkoutSession;
  mesocycleName?: string;
  onStart: () => void;
  onView: () => void;
  onDelete: () => void;
  onRestart: () => void;
  onDuplicate: () => void;
  onEdit: (sessionId: number, updates: { name: string }) => void;
  onSaveAsTemplate?: (sessionId: number) => void;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

function WorkoutSessionCard({ 
  session, 
  mesocycleName,
  onStart, 
  onView, 
  onDelete, 
  onRestart, 
  onDuplicate,
  onEdit,
  onSaveAsTemplate,
  showCheckbox = false,
  isSelected = false,
  onSelect
}: WorkoutSessionCardProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { showSuccess } = useIOSNotifications();

  const editForm = useForm<EditSessionForm>({
    resolver: zodResolver(editSessionSchema),
    defaultValues: {
      name: session.name,
    },
  });

  // Reset form when session changes or dialog opens
  useEffect(() => {
    if (editDialogOpen) {
      editForm.reset({
        name: session.name,
      });
    }
  }, [editDialogOpen, session.name, editForm]);

  const handleEditSubmit = (data: EditSessionForm) => {
    onEdit(session.id, data);
    setEditDialogOpen(false);
    showSuccess("Session Updated", "Session name has been updated successfully");
  };

  return (
    <Card className="p-3 overflow-hidden">
      {/* Compact Header Section */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {showCheckbox && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="mt-0.5 flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="mb-1">
              <h3 className="text-foreground truncate text-[12px] font-bold">{session.name}</h3>
              {mesocycleName && (
                <span className="inline-block px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 whitespace-nowrap mt-1">
                  {mesocycleName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {new Date(session.date).toLocaleDateString()}
              </p>
              <div className="px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 shrink-0">
                {session.isCompleted ? "Done" : "Active"}
              </div>
            </div>
          </div>
        </div>
        
        {/* Compact Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {session.isCompleted && (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Settings className="h-3.5 w-3.5 mr-2" />
                Edit Session
              </DropdownMenuItem>
              {!session.isCompleted && (
                <DropdownMenuItem onClick={onRestart}>
                  <RotateCcw className="h-3.5 w-3.5 mr-2" />
                  Restart Session
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-3.5 w-3.5 mr-2" />
                Duplicate Session
              </DropdownMenuItem>
              {onSaveAsTemplate && (
                <DropdownMenuItem onClick={() => onSaveAsTemplate(session.id)}>
                  <BookOpen className="h-3.5 w-3.5 mr-2" />
                  Save as Template
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Compact Stats Row */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 pb-2 border-b border-border/50">
        <div className="flex items-center gap-3">
          <span>{session.duration || 0}min</span>
          <span>•</span>
          <span>{session.totalVolume || 0}kg</span>
        </div>
        <div className="text-xs font-medium">
          {session.isCompleted ? "Completed" : "In Progress"}
        </div>
      </div>
      {/* Compact Action Button */}
      {!session.isCompleted ? (
        <Button 
          onClick={onStart}
          className="w-full h-8 text-xs"
          size="sm"
        >
          <Play className="h-3 w-3 mr-1.5" />
          Continue Workout
        </Button>
      ) : (
        <Button 
          variant="outline" 
          className="w-full h-8 text-xs"
          size="sm"
          onClick={onView}
        >
          <BarChart3 className="h-3 w-3 mr-1.5" />
          View Details
        </Button>
      )}
      {/* Edit Session Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter session name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface TrainingDashboardProps {
  userId: number;
  activeTab?: string;
  onViewStateChange?: (isViewingDetails: boolean) => void;
}

export function TrainingDashboard({ userId, activeTab = "dashboard", onViewStateChange }: TrainingDashboardProps) {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all");
  const [selectedPrimaryMuscle, setSelectedPrimaryMuscle] = useState<string>("all");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("all");
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const exercisesPerPage = 24;

  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [executingSessionId, setExecutingSessionId] = useState<number | null>(null);
  const [viewingSessionId, setViewingSessionId] = useState<number | null>(null);

  // Notify parent when view state changes
  useEffect(() => {
    onViewStateChange?.(!!viewingSessionId);
  }, [viewingSessionId, onViewStateChange]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'custom'>('all');
  const [showFeatureManager, setShowFeatureManager] = useState(false);
  const [showFeatureShowcase, setShowFeatureShowcase] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<'active' | 'completed' | 'all' | 'templates'>('active');
  const [isAICardExpanded, setIsAICardExpanded] = useState(false);
  const [expandedExerciseCards, setExpandedExerciseCards] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  // Fetch user data to check developer settings
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/auth/user`);
      return response.json();
    }
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedEquipment, selectedPrimaryMuscle, selectedMuscleGroup]);

  // Handle URL parameters for auto-starting workout sessions
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionIdParam = params.get('sessionId');
    
    if (sessionIdParam && !executingSessionId) {
      const sessionId = parseInt(sessionIdParam);
      if (!isNaN(sessionId)) {
        setExecutingSessionId(sessionId);
        // Clear the URL parameter after capturing it
        const url = new URL(window.location.href);
        url.searchParams.delete('sessionId');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [executingSessionId]);

  // Session management mutations
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest('DELETE', `/api/training/sessions/${sessionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training/sessions", userId] });
    },
  });

  const restartSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest('POST', `/api/training/sessions/${sessionId}/restart`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training/sessions", userId] });
    },
  });

  const duplicateSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest('POST', `/api/training/sessions/${sessionId}/duplicate`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training/sessions", userId] });
    },
  });

  // Fetch exercises
  const { data: exercises = [], isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/training/exercises"],
  });

  // Helper function to get date based on filter
  const getFilteredDate = () => {
    switch (dateFilter) {
      case 'today':
        return new Date();
      case 'yesterday':
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday;
      case 'custom':
        return selectedDate;
      case 'all':
      default:
        return null; // No date filter
    }
  };

  const currentDate = getFilteredDate();
  const dateQueryParam = currentDate ? currentDate.toISOString().split('T')[0] : null;

  // Debug effect to log date changes
  useEffect(() => {
    console.log('Date change triggered:', currentDate);
  }, [dateFilter, selectedDate]);

  // Fetch training stats
  const { data: trainingStats, isLoading: statsLoading } = useQuery<TrainingStats>({
    queryKey: ["/api/training/stats", userId, dateQueryParam],
    queryFn: async () => {
      const url = dateQueryParam 
        ? `/api/training/stats?date=${dateQueryParam}`
        : `/api/training/stats`;
      
      console.log('Fetching stats for date:', dateQueryParam || 'all dates');
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`Stats for ${dateQueryParam || 'all dates'}:`, data);
      
      return data;
    }
  });

  // Fetch recent workout sessions with date filtering
  const { data: recentSessions = [], isLoading: sessionsLoading } = useQuery<WorkoutSession[]>({
    queryKey: ["/api/training/sessions", userId, dateQueryParam],
    queryFn: async () => {
      const url = dateQueryParam 
        ? `/api/training/sessions?date=${dateQueryParam}`
        : `/api/training/sessions`;
      
      // Debug logging
      console.log('Fetching sessions for date:', dateQueryParam || 'all dates');
      
      const response = await fetch(url);
      const data = await response.json();
      
      // Ensure we always return an array
      const sessions = Array.isArray(data) ? data : [];
      console.log(`Received ${sessions.length} sessions for ${dateQueryParam || 'all dates'}:`, sessions);
      
      return sessions;
    }
  });

  // Fetch all mesocycles for creating lookup map
  const { data: mesocycles = [] } = useQuery({
    queryKey: ["/api/training/mesocycles", userId],
    queryFn: async () => {
      const response = await fetch(`/api/training/mesocycles`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
  });

  // Create mesocycle lookup map for session cards
  const mesocycleLookup = mesocycles.reduce((acc, mesocycle) => {
    acc[mesocycle.id] = mesocycle.name;
    return acc;
  }, {} as Record<number, string>);

  // Get current mesocycle for status display - only show if there's an active mesocycle
  const currentMesocycle = mesocycles.find(m => m.isActive) || null;

  // Memoized: Group exercises by category
  const exercisesByCategory = useMemo(() => {
    return exercises.reduce((acc, exercise) => {
      if (!acc[exercise.category]) {
        acc[exercise.category] = [];
      }
      acc[exercise.category].push(exercise);
      return acc;
    }, {} as Record<string, Exercise[]>);
  }, [exercises]);

  // Extract unique filter options from exercises data
  const equipmentOptions = useMemo(() => {
    const equipment = exercises
      .map((ex: Exercise) => ex.equipment)
      .filter(Boolean)
      .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index)
      .sort();
    return ['all', ...equipment];
  }, [exercises]);
  
  const primaryMuscleOptions = useMemo(() => {
    const muscles = exercises
      .map((ex: Exercise) => ex.primaryMuscle)
      .filter(Boolean)
      .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index)
      .sort();
    return ['all', ...muscles];
  }, [exercises]);
  
  const muscleGroupOptions = useMemo(() => {
    const muscleGroups = exercises
      .flatMap((ex: Exercise) => ex.muscleGroups || [])
      .filter(Boolean)
      .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index)
      .sort();
    return ['all', ...muscleGroups];
  }, [exercises]);

  // Enhanced filter function with all filter criteria
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      // Category filter
      const matchesCategory = selectedCategory === "all" || exercise.category === selectedCategory;
      
      // Equipment filter
      const matchesEquipment = selectedEquipment === "all" || exercise.equipment === selectedEquipment;
      
      // Primary muscle filter
      const matchesPrimaryMuscle = selectedPrimaryMuscle === "all" || exercise.primaryMuscle === selectedPrimaryMuscle;
      
      // Muscle group filter
      const matchesMuscleGroup = selectedMuscleGroup === "all" || 
        exercise.muscleGroups?.some(mg => mg && mg.toLowerCase() === selectedMuscleGroup.toLowerCase());
      
      // Search filter
      const matchesSearch = debouncedSearchQuery === "" || 
        exercise.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        exercise.primaryMuscle.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        exercise.muscleGroups.some(muscle => muscle.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
        exercise.equipment?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        exercise.movementPattern?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      return matchesCategory && matchesEquipment && matchesPrimaryMuscle && matchesMuscleGroup && matchesSearch;
    });
  }, [exercises, selectedCategory, selectedEquipment, selectedPrimaryMuscle, selectedMuscleGroup, debouncedSearchQuery]);

  // Memoized: Paginated exercises
  const paginatedExercises = useMemo(() => {
    const startIndex = (currentPage - 1) * exercisesPerPage;
    const endIndex = startIndex + exercisesPerPage;
    return filteredExercises.slice(startIndex, endIndex);
  }, [filteredExercises, currentPage, exercisesPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredExercises.length / exercisesPerPage);

  // Memoized: Exercise difficulty colors
  const getDifficultyColor = useCallback((difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "advanced": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  }, []);

  // Memoized: Movement pattern colors
  const getPatternColor = useCallback((pattern: string) => {
    switch (pattern) {
      case "compound": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "isolation": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "unilateral": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "isometric": return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200";
      case "rotation": return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  }, []);

  // Memoized: Helper function to format database strings to user-friendly text
  const formatDisplayText = useCallback((text: string | undefined | null): string => {
    if (!text) return "";
    return text
      .replace(/_/g, ' ') // Replace all underscores with spaces
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }, []);

  // Toggle exercise card expansion
  const toggleExerciseCard = useCallback((exerciseId: number) => {
    setExpandedExerciseCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  }, []);

  // Memoized Exercise Card Component for performance
  const ExerciseCard = useCallback(({ exercise }: { exercise: Exercise }) => {
    const isExpanded = expandedExerciseCards.has(exercise.id);
    
    return (
      <Card key={exercise.id} className="hover:shadow-md transition-shadow overflow-hidden">
        <CardHeader 
          className="pb-1.5 px-3 pt-3 cursor-pointer collapsible-trigger hover:bg-accent/50 transition-colors"
          onClick={() => toggleExerciseCard(exercise.id)}
        >
          <div className="flex justify-between items-center gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm leading-tight truncate">
                {exercise.name}
              </CardTitle>
              <Badge variant="outline" className="text-xs capitalize mt-1 h-4">
                {exercise.category}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-primary/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation('/create-workout-session');
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <ChevronDown className="h-3 w-3 chevron-rotate text-muted-foreground" data-state={isExpanded ? 'open' : 'closed'} />
            </div>
          </div>
        </CardHeader>
        <div 
          className={`collapsible-content overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded 
              ? 'max-h-[300px] opacity-100 animate-collapsible-down' 
              : 'max-h-0 opacity-0 animate-collapsible-up'
          }`}
        >
          <div className="px-3 pb-2">
            <div className="flex gap-1 flex-wrap">
              <Badge className={`${getDifficultyColor(exercise.difficulty)} text-xs h-4 px-1.5`}>
                {formatDisplayText(exercise.difficulty).slice(0, 3)}
              </Badge>
              <Badge className={`${getPatternColor(exercise.movementPattern)} text-xs h-4 px-1.5`}>
                {formatDisplayText(exercise.movementPattern) === 'compound' ? 'comp' : 'iso'}
              </Badge>
            </div>
          </div>
          <CardContent className="px-3 pb-3 pt-0">
            <div className="space-y-1.5">
              {/* Ultra-compact info grid */}
              <div className="text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Primary:</span>
                  <span className="font-medium truncate ml-1 text-right flex-1 min-w-0">
                    {formatDisplayText(exercise.primaryMuscle).slice(0, 8)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Equipment:</span>
                  <span className="truncate ml-1 text-right flex-1 min-w-0">
                    {(formatDisplayText(exercise.equipment) || "Bodyweight").slice(0, 10)}
                  </span>
                </div>
              </div>
              
              {/* Muscle groups - more compact */}
              <div className="flex flex-wrap gap-0.5 justify-center">
                {exercise.muscleGroups.slice(0, 2).map((muscle) => (
                  <Badge key={muscle} variant="secondary" className="text-xs h-3.5 px-1 leading-none">
                    {formatDisplayText(muscle).slice(0, 4)}
                  </Badge>
                ))}
                {exercise.muscleGroups.length > 2 && (
                  <Badge variant="secondary" className="text-xs h-3.5 px-1 leading-none">
                    +{exercise.muscleGroups.length - 2}
                  </Badge>
                )}
              </div>
              
              {/* Exercise Management */}
              <div className="flex justify-center pt-1">
                <ExerciseManagement exercise={exercise} />
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }, [expandedExerciseCards, toggleExerciseCard, getDifficultyColor, getPatternColor, formatDisplayText, setLocation]);

  // Start workout session
  const startWorkoutSession = (sessionId: number) => {
    setActiveSessionId(sessionId);
  };

  // Handle workout completion
  const handleWorkoutComplete = () => {
    setActiveSessionId(null);
  };

  if (exercisesLoading || statsLoading || sessionsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="flex items-center gap-3">
          <div className="ios-loading-dots flex items-center gap-1">
            <div className="dot w-2 h-2 bg-blue-600 rounded-full"></div>
            <div className="dot w-2 h-2 bg-blue-600 rounded-full"></div>
            <div className="dot w-2 h-2 bg-blue-600 rounded-full"></div>
          </div>
          <p className="text-sm text-muted-foreground">Loading training data...</p>
        </div>
      </div>
    );
  }

  // Show workout execution if executing
  if (executingSessionId && !viewingSessionId) {
    return (
      <WorkoutExecutionWrapper
        sessionId={executingSessionId.toString()}
        onComplete={() => setExecutingSessionId(null)}
      />
    );
  }

  // Show workout details if viewing a completed session
  if (viewingSessionId) {
    return (
      <WorkoutDetails
        sessionId={viewingSessionId}
        onBack={() => {
          setViewingSessionId(null);
          setExecutingSessionId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">{/* Removed p-6 and header section */}
      {/* Training Stats Cards - iOS Control Center Inspired */}
      <div className="space-y-4 px-4">
        {/* Stats Grid - iOS Control Center Style */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total Volume - Large Tile */}
          <div className="col-span-2 relative overflow-hidden">
            <div 
              className="ios-control-center-tile bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 dark:from-blue-600 dark:via-blue-700 dark:to-blue-800 p-6 transition-all duration-300 active:scale-[0.98] ios-touch-feedback"
              style={{ borderRadius: '20px' }}
              data-ios-tile="true"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full transform rotate-12 translate-x-8 -translate-y-4"></div>
                <div className="absolute bottom-4 left-4 w-24 h-24 bg-white rounded-full transform -rotate-12 -translate-x-4 translate-y-2"></div>
              </div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-12 h-12 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
                      style={{ borderRadius: '12px' }}
                    >
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Total Volume
                      </h3>
                      <p className="text-sm text-blue-100">
                        This month's lifting
                      </p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">
                      {trainingStats?.totalVolume ? (trainingStats.totalVolume / 1000).toFixed(1) : '0.0'}
                    </span>
                    <span className="text-lg font-semibold text-blue-100">
                      tons
                    </span>
                  </div>
                  <p className="text-sm text-blue-100 mt-1">
                    {trainingStats?.totalVolume || 0} kg lifted
                  </p>
                </div>
                
                {/* Progress Ring */}
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                    <circle 
                      cx="32" cy="32" r="28" 
                      stroke="rgba(255,255,255,0.2)" 
                      strokeWidth="4" 
                      fill="transparent"
                    />
                    <circle 
                      cx="32" cy="32" r="28" 
                      stroke="white" 
                      strokeWidth="4" 
                      fill="transparent"
                      strokeDasharray={`${Math.min(100, ((trainingStats?.totalVolume || 0) / 50000) * 175.84)} 175.84`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {Math.min(100, Math.round(((trainingStats?.totalVolume || 0) / 50000) * 100))}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Total Sessions */}
          <div 
            className="ios-control-center-tile bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 dark:from-emerald-500 dark:via-emerald-600 dark:to-emerald-700 p-5 transition-all duration-300 active:scale-[0.98] ios-touch-feedback relative overflow-hidden"
            style={{ borderRadius: '20px' }}
            data-ios-tile="true"
          >
            {/* Background Accent */}
            <div className="absolute top-2 right-2 w-20 h-20 bg-white/10 rounded-full transform rotate-12"></div>
            
            <div className="relative z-10">
              <div 
                className="w-10 h-10 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white mb-4"
                style={{ borderRadius: '10px' }}
              >
                <Calendar className="w-5 h-5" />
              </div>
              
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-black text-white">
                  {trainingStats?.totalSessions || 0}
                </span>
                <div className="flex items-center gap-1 ml-1">
                  <TrendingUp className="w-3 h-3 text-emerald-100" />
                  <span className="text-xs font-medium text-emerald-100">+2</span>
                </div>
              </div>
              
              <p className="text-sm font-semibold text-emerald-100">Sessions</p>
              <p className="text-xs text-emerald-200">Completed</p>
            </div>
          </div>

          {/* Average Session Time */}
          <div 
            className="ios-control-center-tile bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 dark:from-orange-500 dark:via-orange-600 dark:to-orange-700 p-5 transition-all duration-300 active:scale-[0.98] ios-touch-feedback relative overflow-hidden"
            style={{ borderRadius: '20px' }}
            data-ios-tile="true"
          >
            {/* Background Accent */}
            <div className="absolute bottom-2 left-2 w-16 h-16 bg-white/10 rounded-full transform -rotate-12"></div>
            
            <div className="relative z-10">
              <div 
                className="w-10 h-10 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white mb-4"
                style={{ borderRadius: '10px' }}
              >
                <Clock className="w-5 h-5" />
              </div>
              
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-black text-white">
                  {trainingStats?.averageSessionLength || 0}
                </span>
                <span className="text-sm font-medium text-orange-100">min</span>
              </div>
              
              <p className="text-sm font-semibold text-orange-100">Avg Time</p>
              <p className="text-xs text-orange-200">Per session</p>
            </div>
          </div>
        </div>

        {/* Achievement Badge */}
        {trainingStats && trainingStats.totalSessions > 0 && (
          <div 
            className="ios-control-center-tile bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 dark:from-purple-600 dark:via-purple-700 dark:to-indigo-700 p-4 relative overflow-hidden"
            style={{ borderRadius: '16px' }}
            data-ios-tile="true"
          >
            {/* Sparkle Effects */}
            <div className="absolute top-2 right-4 w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="absolute top-6 right-8 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute bottom-4 left-6 w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            
            <div className="relative z-10 flex items-center justify-center gap-3">
              <div 
                className="w-8 h-8 bg-white/20 backdrop-blur-sm flex items-center justify-center"
                style={{ borderRadius: '8px' }}
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white">
                  Building Great Habits! 
                </p>
                <p className="text-xs text-purple-100">
                  Keep up the consistent training
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Header with Feature Manager Button - Only show for developer users */}
      {userData?.showDeveloperFeatures && (
        <div className="flex items-center justify-between mb-4">
          <div></div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFeatureShowcase(true)}
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              🚀 Demo V2
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFeatureManager(true)}
              className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
            >
              <Settings className="h-4 w-4 mr-2" />
              V2 Features
            </Button>
          </div>
        </div>
      )}
      <AnimatedTabs value={activeTab} className="w-full">

        <AnimatedTabsContent value="dashboard" className="space-y-6">
          {/* Today's Training Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black dark:text-white">Today's Training</CardTitle>
              <CardDescription>Continue your scheduled workout</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-gray-600 dark:text-gray-400">No scheduled workout for today</p>
                <Button 
                  className="mt-2"
                  onClick={() => setLocation('/create-workout-session')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Quick Workout
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedTabsContent>

        <AnimatedTabsContent value="sessions" className="space-y-6" >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold pl-[0px] pr-[0px] ml-[10px] mr-[10px]">Workout Sessions</h3>
              <p className="text-sm text-muted-foreground ml-[12px] mr-[12px] pl-[10px] pr-[10px]">
                {Array.isArray(recentSessions) ? recentSessions.length : 0} total sessions
              </p>
            </div>
            <Button onClick={() => setLocation('/create-workout-session')} className="inline-flex items-center justify-center gap-2 whitespace-nowrap  text-[15px] font-semibold ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] ios-touch-feedback shadow-sm hover:shadow-lg border border-primary/20 h-11 px-5 py-2.5 min-w-[80px] mt-[0px] mb-[0px] ml-[10px] mr-[10px] pl-[10px] pr-[10px] text-black dark:text-black" style={{ backgroundColor: '#479bf5' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3582e6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#479bf5'}>
              <Plus className="h-4 w-4 mr-2" />
              New Workout
            </Button>
          </div>

          {/* AI Session Creation - Collapsible */}
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800 mx-2">
            <CardHeader 
              className="flex flex-col space-y-2 p-4 cursor-pointer collapsible-trigger hover:bg-accent/50 transition-colors pt-[5px] pb-[5px]"
              onClick={() => setIsAICardExpanded(!isAICardExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-green-900 dark:text-green-100 text-[14px]">Create AI Workout Session</h4>
                </div>
                <ChevronDown className="h-4 w-4 text-green-600 chevron-rotate" data-state={isAICardExpanded ? 'open' : 'closed'} />
              </div>
            </CardHeader>
            <div 
              className={`collapsible-content overflow-hidden transition-all duration-300 ease-in-out ${
                isAICardExpanded 
                  ? 'max-h-[200px] opacity-100 animate-collapsible-down' 
                  : 'max-h-0 opacity-0 animate-collapsible-up'
              }`}
            >
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                  Generate intelligent workout sessions based on your training history and goals
                </p>
                <Button size="sm" onClick={() => setLocation('/create-ai-workout-session')} className="w-full text-black dark:text-black" style={{ backgroundColor: '#479bf5' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3582e6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#479bf5'}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create AI Session
                </Button>
              </CardContent>
            </div>
          </Card>

          {!Array.isArray(recentSessions) || recentSessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No workouts yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start your fitness journey by creating your first workout session.
                </p>
                <Button onClick={() => setLocation('/create-workout-session')} className="text-black dark:text-black" style={{ backgroundColor: '#479bf5' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3582e6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#479bf5'}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Workout
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Sticky Mesocycle Status - Only show for active mesocycles */}
              {currentMesocycle && currentMesocycle.isActive && (
                <div className="sticky top-0 z-10 bg-card/95 dark:bg-card/95 border border-border/50  p-3 mx-2 shadow-sm backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="relative">
                        <div className="w-2.5 h-2.5 bg-blue-500 dark:bg-blue-400  animate-pulse"></div>
                        <div className="absolute inset-0 w-2.5 h-2.5 bg-blue-500 dark:bg-blue-400  animate-ping opacity-75"></div>
                      </div>
                      <span className="text-sm font-medium text-foreground truncate">
                        {currentMesocycle.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs flex-shrink-0">
                      <span className="bg-muted dark:bg-muted px-2 py-1  font-medium text-muted-foreground">
                        {currentMesocycle.currentWeek}/{currentMesocycle.totalWeeks}
                      </span>
                      <span className="bg-blue-500 dark:bg-blue-600 px-2 py-1  font-medium text-white uppercase">
                        {currentMesocycle.phase || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Session Filter Tabs */}
              <div className="px-1">
                <div className="flex gap-0.5 bg-gray-100/80 dark:bg-gray-800/60 p-0.5  backdrop-blur-sm">
                  <button
                    onClick={() => setSessionFilter('active')}
                    className={`flex-1 px-2 py-1.5 text-xs font-medium  transition-all duration-200 ${
                      sessionFilter === 'active'
                        ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-700/60'
                    }`}
                  >
                    Active ({Array.isArray(recentSessions) ? recentSessions.filter(s => !s.isCompleted).length : 0})
                  </button>
                  <button
                    onClick={() => setSessionFilter('completed')}
                    className={`flex-1 px-2 py-1.5 text-xs font-medium  transition-all duration-200 ${
                      sessionFilter === 'completed'
                        ? 'bg-emerald-500 dark:bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-700/60'
                    }`}
                  >
                    Done ({Array.isArray(recentSessions) ? recentSessions.filter(s => s.isCompleted).length : 0})
                  </button>
                  <button
                    onClick={() => setSessionFilter('all')}
                    className={`flex-1 px-2 py-1.5 text-xs font-medium  transition-all duration-200 ${
                      sessionFilter === 'all'
                        ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-700/60'
                    }`}
                  >
                    All ({Array.isArray(recentSessions) ? recentSessions.length : 0})
                  </button>
                  <button
                    onClick={() => setSessionFilter('templates')}
                    className={`flex-1 px-2 py-1.5 text-xs font-medium  transition-all duration-200 ${
                      sessionFilter === 'templates'
                        ? 'bg-purple-500 dark:bg-purple-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-700/60'
                    }`}
                  >
                    Templates
                  </button>
                </div>
              </div>

              {/* Sessions with Edit/Delete Functionality */}
              <div className="px-1">
                {(() => {
                  // Handle templates view separately
                  if (sessionFilter === 'templates') {
                    return <SavedWorkoutTemplatesTab />;
                  }

                  const filteredSessions = Array.isArray(recentSessions) ? recentSessions.filter(session => {
                    if (sessionFilter === 'active') return !session.isCompleted;
                    if (sessionFilter === 'completed') return session.isCompleted;
                    return true; // 'all'
                  }).sort((a, b) => {
                    // Sort active sessions by date (earliest first), completed by date (newest first)
                    if (!a.isCompleted && !b.isCompleted) {
                      return new Date(a.date).getTime() - new Date(b.date).getTime();
                    }
                    if (a.isCompleted && b.isCompleted) {
                      return new Date(b.date).getTime() - new Date(a.date).getTime();
                    }
                    return a.isCompleted ? 1 : -1; // Active sessions first
                  }) : [];

                  if (filteredSessions.length === 0) {
                    return (
                      <div className="text-center py-6">
                        <div className="text-gray-500 dark:text-gray-400 text-sm">
                          {sessionFilter === 'active' && 'No active sessions'}
                          {sessionFilter === 'completed' && 'No completed sessions'}
                          {sessionFilter === 'all' && 'No sessions found'}
                        </div>
                        <Button 
                          onClick={() => setLocation('/create-workout-session')} 
                          size="sm" 
                          className="mt-2 text-black dark:text-black"
                          style={{ backgroundColor: '#479bf5' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3582e6'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#479bf5'}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Start Workout
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <WorkoutSessionsWithBulkActions
                      sessions={filteredSessions}
                      mesocycleLookup={mesocycleLookup}
                      onStartSession={(sessionId) => setExecutingSessionId(sessionId)}
                      onViewSession={(sessionId) => setViewingSessionId(sessionId)}
                      userId={userId}
                    />
                  );
                })()}
              </div>
            </div>
          )}
        </AnimatedTabsContent>

        <AnimatedTabsContent value="exercise-library" className="space-y-6" >
          {/* Header with Search and Create Button */}
          <div className="space-y-4">
            {/* Search Bar and Create Button Row */}
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search exercises by name, muscle group, equipment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <CreateExerciseButton onSuccess={() => {
                // Refresh exercises after creating a new one
                queryClient.invalidateQueries({ queryKey: ["/api/training/exercises"] });
              }} />
            </div>
          </div>

          {/* Enhanced Filter System */}
          <div className="bg-card border ">
            {/* Collapsible Header */}
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            >
              <h3 className="text-sm font-medium">Exercise Filters</h3>
              <div className="flex items-center gap-2">
                {/* Active Filters Count */}
                {(selectedCategory !== 'all' || selectedEquipment !== 'all' || selectedPrimaryMuscle !== 'all' || selectedMuscleGroup !== 'all') && (
                  <Badge variant="secondary" className="text-xs h-5 px-2">
                    {[selectedCategory, selectedEquipment, selectedPrimaryMuscle, selectedMuscleGroup].filter(f => f !== 'all').length} active
                  </Badge>
                )}
                <ChevronDown className="h-4 w-4 text-muted-foreground chevron-rotate" data-state={isFiltersExpanded ? 'open' : 'closed'} />
              </div>
            </div>
            
            {/* Collapsible Content */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isFiltersExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="p-4 pt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="appearance-none bg-background border border-border  px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent w-full"
                  >
                    <option value="all">All Categories</option>
                    {Object.entries(exercisesByCategory).map(([category, categoryExercises]) => (
                      <option key={category} value={category} className="capitalize">
                        {category} ({categoryExercises.length})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Equipment Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Equipment</label>
                <div className="relative">
                  <select
                    value={selectedEquipment}
                    onChange={(e) => setSelectedEquipment(e.target.value)}
                    className="appearance-none bg-background border border-border  px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent w-full"
                  >
                    {equipmentOptions.map(equipment => (
                      <option key={equipment} value={equipment}>
                        {equipment === 'all' ? 'All Equipment' : equipment}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Primary Muscle Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Primary Muscle</label>
                <div className="relative">
                  <select
                    value={selectedPrimaryMuscle}
                    onChange={(e) => setSelectedPrimaryMuscle(e.target.value)}
                    className="appearance-none bg-background border border-border  px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent w-full"
                  >
                    {primaryMuscleOptions.map(muscle => (
                      <option key={muscle} value={muscle}>
                        {muscle === 'all' ? 'All Muscles' : muscle}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Muscle Group Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Muscle Group</label>
                <div className="relative">
                  <select
                    value={selectedMuscleGroup}
                    onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                    className="appearance-none bg-background border border-border  px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent w-full"
                  >
                    {muscleGroupOptions.map(muscleGroup => (
                      <option key={muscleGroup} value={muscleGroup}>
                        {muscleGroup === 'all' ? 'All Muscle Groups' : muscleGroup}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                </div>
              </div>
                </div>

                {/* Clear Filters & Create Exercise */}
                <div className="flex items-center justify-between gap-3">
                  {/* Clear Filters Button */}
                  {(selectedCategory !== 'all' || selectedEquipment !== 'all' || selectedPrimaryMuscle !== 'all' || selectedMuscleGroup !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategory('all');
                        setSelectedEquipment('all');
                        setSelectedPrimaryMuscle('all');
                        setSelectedMuscleGroup('all');
                      }}
                      className="text-xs h-8"
                    >
                      Clear All Filters
                    </Button>
                  )}

                  {/* Active Filter Badges */}
                  <div className="flex items-center gap-2 flex-1">
                    {selectedCategory !== "all" && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs h-6 px-2 capitalize cursor-pointer hover:bg-secondary/80 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCategory("all");
                        }}
                      >
                        {selectedCategory} ×
                      </Badge>
                    )}
                    {selectedEquipment !== "all" && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs h-6 px-2 cursor-pointer hover:bg-secondary/80 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEquipment("all");
                        }}
                      >
                        {selectedEquipment} ×
                      </Badge>
                    )}
                    {selectedPrimaryMuscle !== "all" && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs h-6 px-2 cursor-pointer hover:bg-secondary/80 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPrimaryMuscle("all");
                        }}
                      >
                        {selectedPrimaryMuscle} ×
                      </Badge>
                    )}
                    {selectedMuscleGroup !== "all" && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs h-6 px-2 cursor-pointer hover:bg-secondary/80 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMuscleGroup("all");
                        }}
                      >
                        {selectedMuscleGroup} ×
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {/* Results Counter and Pagination Info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
              <span className="font-medium">
                {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
                {totalPages > 1 && (
                  <span className="ml-2 text-xs opacity-75">
                    (Page {currentPage} of {totalPages})
                  </span>
                )}
              </span>
              {totalPages > 1 && (
                <span className="text-xs opacity-75">
                  Showing {Math.min((currentPage - 1) * exercisesPerPage + 1, filteredExercises.length)}-{Math.min(currentPage * exercisesPerPage, filteredExercises.length)} of {filteredExercises.length}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {paginatedExercises.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="h-8 w-8 p-0 text-xs"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-3"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </AnimatedTabsContent>



        <AnimatedTabsContent value="volume" className="space-y-4" >
          <VolumeLandmarks />
        </AnimatedTabsContent>

        <AnimatedTabsContent value="auto-regulation" className="space-y-4" >
          <AutoRegulationDashboard userId={1} />
        </AnimatedTabsContent>

        <AnimatedTabsContent value="programs" className="space-y-4" >
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold">Training Programs</h3>
            <Button size="sm" className="text-black dark:text-black" style={{ backgroundColor: '#479bf5' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3582e6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#479bf5'}>
              <Plus className="h-4 w-4 mr-1" />
              Create Program
            </Button>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Target className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="text-base font-semibold mb-2">No training programs yet</h3>
              <p className="text-sm text-muted-foreground text-center mb-3">
                Create structured training programs with RP methodology.
              </p>
              <Button size="sm" className="text-black dark:text-black" style={{ backgroundColor: '#479bf5' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3582e6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#479bf5'}>
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Program
              </Button>
            </CardContent>
          </Card>
        </AnimatedTabsContent>

        <AnimatedTabsContent value="progress" className="space-y-4" >
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold">Progress Tracking</h3>
            <Button variant="outline" size="sm" onClick={() => setLocation('/training-analytics')}>
              <BarChart3 className="h-4 w-4 mr-1" />
              AI Analytics
            </Button>
          </div>

          {/* AI Features Section */}
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">AI Training Analytics</h4>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                Advanced training analysis with AI insights and RP methodology tracking
              </p>
              <Button size="sm" onClick={() => setLocation('/training-analytics')} className="w-full">
                View Analytics
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <TrendingUp className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="text-base font-semibold mb-2">Track Your Progress</h3>
              <p className="text-sm text-muted-foreground text-center mb-3">
                Complete workouts to see your strength and volume progression.
              </p>
              <Button size="sm">
                <Play className="h-4 w-4 mr-1" />
                Start First Workout
              </Button>
            </CardContent>
          </Card>
        </AnimatedTabsContent>

        <AnimatedTabsContent value="mesocycles" className="space-y-4" >
          <MesocycleDashboard userId={userId} />
        </AnimatedTabsContent>

        <AnimatedTabsContent value="progression" className="space-y-4" >
          <LoadProgressionTracker userId={userId} />
        </AnimatedTabsContent>
      </AnimatedTabs>
      {/* Workout Execution Modal */}
      {executingSessionId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Active Workout Session</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setExecutingSessionId(null)}
                    >
                      ×
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <WorkoutExecutionWrapper 
                    sessionId={executingSessionId.toString()} 
                    onComplete={() => {
                      setExecutingSessionId(null);
                      queryClient.invalidateQueries({ queryKey: ["/api/training/sessions", userId] });
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
      {/* Feature Flag Manager Modal */}
      <FeatureFlagManager 
        isOpen={showFeatureManager}
        onClose={() => setShowFeatureManager(false)}
      />
      {/* Feature Showcase Modal */}
      <FeatureShowcase
        isVisible={showFeatureShowcase}
        onClose={() => setShowFeatureShowcase(false)}
      />
    </div>
  );
}