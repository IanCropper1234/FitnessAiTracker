import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Play, 
  Clock, 
  Target, 
  TrendingUp, 
  Dumbbell,
  BarChart3,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ExerciseManagement, CreateExerciseButton } from "./exercise-management";
import { WorkoutSessionCreator } from "./workout-session-creator";
import { WorkoutExecution } from "./workout-execution";
import { VolumeLandmarks } from "./volume-landmarks";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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

export function TrainingDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [showSessionCreator, setShowSessionCreator] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [executingSessionId, setExecutingSessionId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch exercises
  const { data: exercises = [], isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  // Fetch training stats
  const { data: trainingStats, isLoading: statsLoading } = useQuery<TrainingStats>({
    queryKey: ["/api/training/stats", 1], // user ID 1 for now
  });

  // Fetch recent workout sessions
  const { data: recentSessions = [], isLoading: sessionsLoading } = useQuery<WorkoutSession[]>({
    queryKey: ["/api/training/sessions", 1],
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

  return (
    <div className="space-y-6 p-6">
      {/* Training Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exercises</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exercises.length}</div>
            <p className="text-xs text-muted-foreground">
              in exercise database
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="exercises" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="exercises">Exercise Library</TabsTrigger>
          <TabsTrigger value="workouts">Workout Sessions</TabsTrigger>
          <TabsTrigger value="volume">Volume Landmarks</TabsTrigger>
          <TabsTrigger value="programs">Training Programs</TabsTrigger>
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
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
            <Button 
              onClick={() => setShowSessionCreator(true)}
              disabled={selectedExercises.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Session
            </Button>
          </div>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Workout Sessions</h3>
            <Button>
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
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Workout
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
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
                      <div className="flex items-center gap-2">
                        {session.isCompleted && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                        <Badge variant={session.isCompleted ? "default" : "secondary"}>
                          {session.isCompleted ? "Completed" : "In Progress"}
                        </Badge>
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
                          onClick={() => setExecutingSessionId(session.id)}
                          className="flex-1"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Continue Workout
                        </Button>
                      ) : (
                        <Button variant="outline" className="flex-1">
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
        </TabsContent>

        <TabsContent value="volume" className="space-y-6">
          <VolumeLandmarks />
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
                      queryClient.invalidateQueries({ queryKey: ["/api/training/sessions"] });
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