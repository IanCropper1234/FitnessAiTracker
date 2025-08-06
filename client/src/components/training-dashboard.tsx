import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedTabs, AnimatedTabsContent, AnimatedTabsList, AnimatedTabsTrigger } from "@/components/ui/animated-tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
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
  CalendarIcon,
  Settings,
  BookOpen,
  Activity,
  FileText,
  Repeat,
  ChartBar,
  MapPin,
  Zap
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
  const { toast } = useToast();

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
      toast({
        title: "Sessions Deleted",
        description: `${selectedSessions.length} workout sessions have been deleted`,
      });
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
      toast({
        title: "Template Saved",
        description: `Workout session has been saved as "${data.templateName}" template`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training/saved-workout-templates"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save template",
        variant: "destructive",
      });
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
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
              toast({
                title: "Feature Coming Soon",
                description: "Session duplication will be available in a future update",
              });
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
  const { toast } = useToast();

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
    toast({
      title: "Session Updated",
      description: "Session name has been updated successfully",
    });
  };

  return (
    <Card className="p-3 pl-[0px] pr-[0px]">
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
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-foreground truncate text-[12px] font-bold pl-[5px] pr-[5px] ml-[2px] mr-[2px]">{session.name}</h3>
              {mesocycleName && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 whitespace-nowrap pl-[0px] pr-[0px] ml-[8px] mr-[8px]">
                  {mesocycleName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 ml-[10px] mr-[10px]">
              <p className="text-xs text-muted-foreground">
                {new Date(session.date).toLocaleDateString()}
              </p>
              <div className="px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                {session.isCompleted ? "Done" : "Active"}
              </div>
            </div>
          </div>
        </div>
        
        {/* Compact Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0 pl-[0px] pr-[0px] ml-[0px] mr-[0px]">
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
        <div className="flex items-center gap-3 ml-[10px] mr-[10px]">
          <span>{session.duration || 0}min</span>
          <span>•</span>
          <span>{session.totalVolume || 0}kg</span>
        </div>
        <div className="text-xs font-medium pl-[0px] pr-[0px] ml-[10px] mr-[10px]">
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
  const [searchQuery, setSearchQuery] = useState<string>("");

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
  const queryClient = useQueryClient();

  // Fetch user data to check developer settings
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/auth/user`);
      return response.json();
    }
  });

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

  // Group exercises by category
  const exercisesByCategory = exercises.reduce((acc, exercise) => {
    if (!acc[exercise.category]) {
      acc[exercise.category] = [];
    }
    acc[exercise.category].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

  // Filter exercises based on selected category and search query
  const filteredExercises = exercises.filter(exercise => {
    const matchesCategory = selectedCategory === "all" || exercise.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.primaryMuscle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.muscleGroups.some(muscle => muscle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      exercise.equipment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.movementPattern?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Exercise difficulty colors
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "advanced": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Movement pattern colors
  const getPatternColor = (pattern: string) => {
    switch (pattern) {
      case "compound": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "isolation": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "unilateral": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "isometric": return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200";
      case "rotation": return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Helper function to format database strings to user-friendly text
  const formatDisplayText = (text: string | undefined | null): string => {
    if (!text) return "";
    return text
      .replace(/_/g, ' ') // Replace all underscores with spaces
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  };

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
        <LoadingState type="dots" />
        <p className="text-sm text-muted-foreground">Loading training data...</p>
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
      {/* Training Stats Cards */}
      <div className="grid grid-cols-3 gap-2 w-full pl-[5px] pr-[5px] ml-[0px] mr-[0px]">
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-2">
            <Calendar className="h-3 w-3 text-gray-600 dark:text-gray-400 mb-1" />
            <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <div className="text-lg font-bold text-black dark:text-white text-center">
              {trainingStats?.totalSessions || 0}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              workouts completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-2">
            <TrendingUp className="h-3 w-3 text-gray-600 dark:text-gray-400 mb-1" />
            <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">
              Total Volume
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <div className="text-lg font-bold text-black dark:text-white text-center">
              {trainingStats?.totalVolume || 0}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              kg lifted this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardHeader className="flex flex-col items-center space-y-0 pb-1 pt-2 px-2">
            <Clock className="h-3 w-3 text-gray-600 dark:text-gray-400 mb-1" />
            <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">
              Avg Session
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <div className="text-lg font-bold text-black dark:text-white text-center">
              {trainingStats?.averageSessionLength || 0}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              minutes per workout
            </p>
          </CardContent>
        </Card>
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
            <Button onClick={() => setLocation('/create-workout-session')} className="inline-flex items-center justify-center gap-2 whitespace-nowrap  text-[15px] font-semibold ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] ios-touch-feedback text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-lg border border-primary/20 h-11 px-5 py-2.5 min-w-[80px] mt-[0px] mb-[0px] ml-[10px] mr-[10px] pl-[10px] pr-[10px] bg-[#3c81f6]">
              <Plus className="h-4 w-4 mr-2" />
              New Workout
            </Button>
          </div>

          {!Array.isArray(recentSessions) || recentSessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No workouts yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start your fitness journey by creating your first workout session.
                </p>
                <Button onClick={() => setLocation('/create-workout-session')}>
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
                          className="mt-2 bg-[#3c81f6]"
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
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search exercises by name, muscle group, equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>



          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              {/* Mobile-First Filter System */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-background border border-input  px-4 py-2.5 text-sm font-medium pr-10 min-w-32 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer shadow-sm hover:bg-accent/50 transition-colors"
                    style={{ 
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      backgroundImage: 'none'
                    }}
                  >
                    <option value="all">All ({exercises.length})</option>
                    {Object.entries(exercisesByCategory).map(([category, categoryExercises]) => (
                      <option key={category} value={category} className="capitalize">
                        {category} ({categoryExercises.length})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
                
                {/* Quick Filter Chips - Hidden on smallest screens */}
                <div className="hidden md:flex items-center gap-2 flex-wrap">
                  {selectedCategory !== "all" && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs h-7 px-3 capitalize cursor-pointer hover:bg-secondary/80 transition-colors"
                      onClick={() => setSelectedCategory("all")}
                    >
                      {selectedCategory} ×
                    </Badge>
                  )}
                  
                  {/* Show popular categories as quick access */}
                  {["strength", "compound", "push", "pull"].map((quickCategory) => {
                    if (exercisesByCategory[quickCategory] && selectedCategory !== quickCategory) {
                      return (
                        <Badge 
                          key={quickCategory}
                          variant="outline" 
                          className="text-xs h-7 px-3 capitalize cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => setSelectedCategory(quickCategory)}
                        >
                          {quickCategory}
                        </Badge>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <CreateExerciseButton />
              </div>
            </div>
            
            {/* Results Counter */}
            <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
              <span className="font-medium">
                {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} 
                {selectedCategory !== "all" && (
                  <span className="hidden sm:inline"> in {selectedCategory}</span>
                )}
              </span>
              {filteredExercises.length > 12 && (
                <span className="text-xs opacity-75">
                  ~{Math.ceil(filteredExercises.length / 12)} pages
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredExercises.map((exercise) => (
              <Card key={exercise.id} className="hover:shadow-md transition-shadow overflow-hidden">
                <CardHeader className="pb-1.5 px-3 pt-3">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <CardTitle className="text-sm leading-tight truncate flex-1 min-w-0">
                      {exercise.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs capitalize shrink-0 h-5">
                      {exercise.category.slice(0, 4)}
                    </Badge>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <Badge className={`${getDifficultyColor(exercise.difficulty)} text-xs h-4 px-1.5`}>
                      {formatDisplayText(exercise.difficulty).slice(0, 3)}
                    </Badge>
                    <Badge className={`${getPatternColor(exercise.movementPattern)} text-xs h-4 px-1.5`}>
                      {formatDisplayText(exercise.movementPattern) === 'compound' ? 'comp' : 'iso'}
                    </Badge>
                  </div>
                </CardHeader>
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
                    
                    {/* Action buttons - stacked for mobile */}
                    <div className="flex flex-col gap-1 pt-1">
                      <Button 
                        size="sm" 
                        className="w-full h-7 text-xs font-medium"
                        onClick={() => setLocation('/create-workout-session')}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add to Workout
                      </Button>
                      <div className="flex justify-center">
                        <ExerciseManagement exercise={exercise} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
            <Button size="sm">
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
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Program
              </Button>
            </CardContent>
          </Card>
        </AnimatedTabsContent>

        <AnimatedTabsContent value="progress" className="space-y-4" >
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold">Progress Tracking</h3>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-1" />
              View Analytics
            </Button>
          </div>

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