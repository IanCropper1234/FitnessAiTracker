import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  CalendarIcon
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ExerciseManagement, CreateExerciseButton } from "./exercise-management";
import { WorkoutSessionCreator } from "./workout-session-creator";
import { WorkoutExecution } from "./workout-execution";
import { WorkoutDetails } from "./workout-details";
import { VolumeLandmarks } from "./volume-landmarks";
import { AutoRegulationDashboard } from "./auto-regulation-dashboard";
import MesocycleDashboard from "./mesocycle-dashboard";
import TrainingTemplates from "./training-templates";
import LoadProgressionTracker from "./load-progression-tracker";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

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
  programId: number;
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
  onStartSession: (sessionId: number) => void;
  onViewSession: (sessionId: number) => void;
  userId: number;
}

function WorkoutSessionsWithBulkActions({ 
  sessions, 
  onStartSession, 
  onViewSession, 
  userId 
}: WorkoutSessionsWithBulkActionsProps) {
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      queryClient.invalidateQueries({ queryKey: ["/api/training/sessions"] });
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
    <div className="space-y-4">
      {/* Bulk Actions Header */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-4">
          <Button
            variant={bulkDeleteMode ? "destructive" : "outline"}
            size="sm"
            onClick={() => {
              setBulkDeleteMode(!bulkDeleteMode);
              setSelectedSessions([]);
            }}
          >
            {bulkDeleteMode ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Bulk Delete
              </>
            )}
          </Button>

          {bulkDeleteMode && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedSessions.length === sessions.length ? "Deselect All" : "Select All"}
              </Button>
              
              {selectedSessions.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                >
                  Delete {selectedSessions.length} Session{selectedSessions.length !== 1 ? 's' : ''}
                </Button>
              )}
            </>
          )}
        </div>

        {bulkDeleteMode && (
          <p className="text-sm text-muted-foreground">
            {selectedSessions.length} of {sessions.length} selected
          </p>
        )}
      </div>

      {/* Sessions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => (
          <WorkoutSessionCard
            key={session.id}
            session={session}
            onStart={() => onStartSession(session.id)}
            onView={() => onViewSession(session.id)}
            onDelete={() => bulkDeleteMutation.mutate([session.id])}
            onRestart={() => restartSessionMutation.mutate(session.id)}
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
  onStart: () => void;
  onView: () => void;
  onDelete: () => void;
  onRestart: () => void;
  onDuplicate: () => void;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

function WorkoutSessionCard({ 
  session, 
  onStart, 
  onView, 
  onDelete, 
  onRestart, 
  onDuplicate,
  showCheckbox = false,
  isSelected = false,
  onSelect
}: WorkoutSessionCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            {showCheckbox && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
                className="mt-1"
              />
            )}
            <div>
              <CardTitle className="text-lg">{session.name}</CardTitle>
              <CardDescription>
                {new Date(session.date).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session.isCompleted && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            <Badge variant={session.isCompleted ? "default" : "secondary"}>
              {session.isCompleted ? "Completed" : "In Progress"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!session.isCompleted && (
                  <DropdownMenuItem onClick={onRestart}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restart Session
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Session
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Duration</p>
            <p className="text-lg font-semibold">{session.duration || 0} min</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
            <p className="text-lg font-semibold">{session.totalVolume || 0} kg</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          {!session.isCompleted ? (
            <Button 
              onClick={onStart}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Continue Workout
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onView}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface TrainingDashboardProps {
  userId: number;
}

export function TrainingDashboard({ userId }: TrainingDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [showSessionCreator, setShowSessionCreator] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [executingSessionId, setExecutingSessionId] = useState<number | null>(null);
  const [viewingSessionId, setViewingSessionId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("workouts");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'custom'>('all');
  const queryClient = useQueryClient();

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
    queryKey: ["/api/exercises"],
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
        ? `/api/training/stats/${userId}?date=${dateQueryParam}`
        : `/api/training/stats/${userId}`;
      
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
        ? `/api/training/sessions/${userId}?date=${dateQueryParam}`
        : `/api/training/sessions/${userId}`;
      
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

  // Add exercise to workout function
  const addToWorkout = (exercise: Exercise) => {
    if (!selectedExercises.find(ex => ex.id === exercise.id)) {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };

  // Check if exercise is already in workout
  const isInWorkout = (exerciseId: number) => {
    return selectedExercises.some(ex => ex.id === exerciseId);
  };

  // Handle session creation success
  const handleSessionCreated = () => {
    setShowSessionCreator(false);
    setSelectedExercises([]);
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
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show workout execution if executing
  if (executingSessionId && !viewingSessionId) {
    return (
      <WorkoutExecution
        sessionId={executingSessionId}
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
      <div className="grid grid-cols-3 gap-2 w-full">
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full overflow-x-auto scrollbar-hide bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <TabsTrigger value="exercises" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Exercise Library</TabsTrigger>
          <TabsTrigger value="workouts" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Workout Sessions</TabsTrigger>
          <TabsTrigger value="templates" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Training Templates</TabsTrigger>
          <TabsTrigger value="mesocycles" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Periodization</TabsTrigger>
          <TabsTrigger value="progression" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Load Progression</TabsTrigger>
          <TabsTrigger value="volume" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Volume Landmarks</TabsTrigger>
          <TabsTrigger value="auto-regulation" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Auto-Regulation</TabsTrigger>
        </TabsList>

        <TabsContent value="exercises" className="space-y-6">
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

          {/* Selected exercises indicator */}
          {selectedExercises.length > 0 && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Selected for Workout ({selectedExercises.length})</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedExercises.map((exercise) => (
                  <Badge key={exercise.id} variant="secondary" className="flex items-center gap-1">
                    {exercise.name}
                    <button
                      onClick={() => setSelectedExercises(prev => prev.filter(ex => ex.id !== exercise.id))}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <Button 
                onClick={() => setShowSessionCreator(true)}
                disabled={selectedExercises.length === 0}
                className="w-full"
              >
                Create Workout Session ({selectedExercises.length} exercises)
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                All ({exercises.length})
              </Button>
              {Object.entries(exercisesByCategory).map(([category, categoryExercises]) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category} ({categoryExercises.length})
                </Button>
              ))}
            </div>
            
            <CreateExerciseButton />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExercises.map((exercise) => (
              <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{exercise.name}</CardTitle>
                    <Badge variant="outline" className="capitalize">
                      {exercise.category}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getDifficultyColor(exercise.difficulty)}>
                      {exercise.difficulty}
                    </Badge>
                    <Badge className={getPatternColor(exercise.movementPattern)}>
                      {exercise.movementPattern}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Primary Muscle</p>
                      <p className="text-sm capitalize font-medium">{exercise.primaryMuscle.replace('_', ' ')}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Equipment</p>
                      <p className="text-sm capitalize">{exercise.equipment?.replace('_', ' ') || "Bodyweight"}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Muscle Groups</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exercise.muscleGroups.map((muscle) => (
                          <Badge key={muscle} variant="secondary" className="text-xs capitalize">
                            {muscle.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {exercise.instructions}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        variant={isInWorkout(exercise.id) ? "secondary" : "default"}
                        onClick={() => addToWorkout(exercise)}
                        disabled={isInWorkout(exercise.id)}
                      >
                        {isInWorkout(exercise.id) ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add to Workout
                          </>
                        )}
                      </Button>
                      <ExerciseManagement exercise={exercise} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workouts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Workout Sessions</h3>
            <Button onClick={() => setActiveTab("exercises")}>
              <Plus className="h-4 w-4 mr-2" />
              New Workout
            </Button>
          </div>
          
          <WorkoutSessionsWithBulkActions 
            sessions={recentSessions}
            onStartSession={setExecutingSessionId}
            onViewSession={setViewingSessionId}
            userId={userId}
          />

          {!Array.isArray(recentSessions) || recentSessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No workouts yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start your fitness journey by creating your first workout session.
                </p>
                <Button onClick={() => setActiveTab("exercises")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Workout
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* In Progress Sessions */}
              {Array.isArray(recentSessions) && recentSessions.filter(session => !session.isCompleted).length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-blue-600 dark:text-blue-400">
                    In Progress ({recentSessions.filter(session => !session.isCompleted).length})
                  </h4>
                  {recentSessions.filter(session => !session.isCompleted).map((session) => (
                    <WorkoutSessionCard
                      key={session.id}
                      session={session}
                      onStart={() => setExecutingSessionId(session.id)}
                      onView={() => setViewingSessionId(session.id)}
                      onDelete={() => deleteSessionMutation.mutate(session.id)}
                      onRestart={() => restartSessionMutation.mutate(session.id)}
                      onDuplicate={() => duplicateSessionMutation.mutate(session.id)}
                    />
                  ))}
                </div>
              )}

              {/* Completed Sessions */}
              {Array.isArray(recentSessions) && recentSessions.filter(session => session.isCompleted).length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-green-600 dark:text-green-400">
                    Recent Completed Sessions ({recentSessions.filter(session => session.isCompleted).length})
                  </h4>
                  {recentSessions.filter(session => session.isCompleted).map((session) => (
                    <WorkoutSessionCard
                      key={session.id}
                      session={session}
                      onStart={() => setExecutingSessionId(session.id)}
                      onView={() => setViewingSessionId(session.id)}
                      onDelete={() => deleteSessionMutation.mutate(session.id)}
                      onRestart={() => restartSessionMutation.mutate(session.id)}
                      onDuplicate={() => duplicateSessionMutation.mutate(session.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="volume" className="space-y-6">
          <VolumeLandmarks />
        </TabsContent>

        <TabsContent value="auto-regulation" className="space-y-6">
          <AutoRegulationDashboard userId={1} />
        </TabsContent>

        <TabsContent value="programs" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Training Programs</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Program
            </Button>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No training programs yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create structured training programs with Renaissance Periodization methodology.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Program
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Progress Tracking</h3>
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Track Your Progress</h3>
              <p className="text-muted-foreground text-center mb-4">
                Complete workouts to see your strength and volume progression.
              </p>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Start First Workout
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <TrainingTemplates userId={userId} />
        </TabsContent>

        <TabsContent value="mesocycles" className="space-y-6">
          <MesocycleDashboard userId={userId} />
        </TabsContent>

        <TabsContent value="progression" className="space-y-6">
          <LoadProgressionTracker userId={userId} />
        </TabsContent>
      </Tabs>

      {/* Workout Session Creator Dialog */}
      <WorkoutSessionCreator
        selectedExercises={selectedExercises}
        isOpen={showSessionCreator}
        onClose={() => setShowSessionCreator(false)}
        onSuccess={handleSessionCreated}
      />

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
                <CardContent>
                  <WorkoutExecution 
                    sessionId={executingSessionId} 
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
    </div>
  );
}