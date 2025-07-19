import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  ChevronUp
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch exercises
  const { data: exercises = [], isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  // Fetch training stats
  const { data: trainingStats, isLoading: statsLoading } = useQuery<TrainingStats>({
    queryKey: ["/api/training/stats", userId],
  });

  // Fetch recent workout sessions
  const { data: recentSessions = [], isLoading: sessionsLoading } = useQuery<WorkoutSession[]>({
    queryKey: ["/api/training/sessions", userId],
  });

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

  if (exercisesLoading || statsLoading || sessionsLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
    <div className="space-y-6 p-6">
      {/* Training Stats Cards - 3:1 Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingStats?.totalSessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              workouts completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingStats?.totalVolume || 0}</div>
            <p className="text-xs text-muted-foreground">
              kg lifted this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingStats?.averageSessionLength || 0}</div>
            <p className="text-xs text-muted-foreground">
              minutes per workout
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section Selector - Expandable */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Training Sections</CardTitle>
                  <CardDescription>
                    {activeTab === "exercises" && "Exercise Library"}
                    {activeTab === "workouts" && "Workout Sessions"}
                    {activeTab === "templates" && "Training Templates"}
                    {activeTab === "mesocycles" && "Periodization"}
                    {activeTab === "progression" && "Load Progression"}
                    {activeTab === "volume" && "Volume Landmarks"}
                    {activeTab === "auto-regulation" && "Auto-Regulation"}
                  </CardDescription>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: "exercises", label: "Exercise Library", icon: Dumbbell },
                  { value: "workouts", label: "Workout Sessions", icon: Play },
                  { value: "templates", label: "Training Templates", icon: Target },
                  { value: "mesocycles", label: "Periodization", icon: Calendar },
                  { value: "progression", label: "Load Progression", icon: TrendingUp },
                  { value: "volume", label: "Volume Landmarks", icon: BarChart3 },
                  { value: "auto-regulation", label: "Auto-Regulation", icon: Clock },
                ].map((section) => {
                  const Icon = section.icon;
                  return (
                    <Button
                      key={section.value}
                      variant={activeTab === section.value ? "default" : "outline"}
                      className="justify-start h-auto p-3"
                      onClick={() => {
                        setActiveTab(section.value);
                        setIsExpanded(false);
                      }}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="text-sm">{section.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Content Sections */}
      <div className="w-full">
        {activeTab === "exercises" && (
          <div className="space-y-6">
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
              <Card>
                <CardContent className="p-4">
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
                </CardContent>
              </Card>
            )}

            {/* Category Filters */}
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

            {/* Exercise Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          </div>
        )}

        {activeTab === "workouts" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Workout Sessions</h3>
              <Button onClick={() => setActiveTab("exercises")}>
                <Plus className="h-4 w-4 mr-2" />
                New Workout
              </Button>
            </div>
            
            {recentSessions.length === 0 ? (
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentSessions.map((session) => (
                  <Card key={session.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{session.name}</CardTitle>
                          <CardDescription>
                            {new Date(session.date).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge variant={session.isCompleted ? "default" : "secondary"}>
                          {session.isCompleted ? "Completed" : "In Progress"}
                        </Badge>
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
                      
                      <div className="flex gap-2">
                        {!session.isCompleted ? (
                          <Button 
                            onClick={() => setExecutingSessionId(session.id)}
                            className="flex-1"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Continue Workout
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => setViewingSessionId(session.id)}
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "templates" && (
          <div className="space-y-6">
            <TrainingTemplates userId={userId} />
          </div>
        )}

        {activeTab === "mesocycles" && (
          <div className="space-y-6">
            <MesocycleDashboard userId={userId} />
          </div>
        )}

        {activeTab === "progression" && (
          <div className="space-y-6">
            <LoadProgressionTracker userId={userId} />
          </div>
        )}

        {activeTab === "volume" && (
          <div className="space-y-6">
            <VolumeLandmarks />
          </div>
        )}

        {activeTab === "auto-regulation" && (
          <div className="space-y-6">
            <AutoRegulationDashboard userId={1} />
          </div>
        )}
      </div>

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