import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/components/language-provider";
import { BottomNavigation } from "@/components/bottom-navigation";
import { WorkoutSession } from "@/components/workout-session";
import { AutoRegulationFeedback } from "@/components/auto-regulation-feedback";
import { Play, History, Target, TrendingUp } from "lucide-react";

export default function Training() {
  const { t } = useLanguage();
  const [activeWorkout, setActiveWorkout] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem("fitai-user") || "{}");
  const userId = user.id;

  const { data: trainingStats } = useQuery({
    queryKey: ["/api/training/stats", userId],
    enabled: !!userId,
  });

  const { data: workoutSessions } = useQuery({
    queryKey: ["/api/training/sessions", userId],
    enabled: !!userId,
  });

  const { data: exercises } = useQuery({
    queryKey: ["/api/training/exercises"],
  });

  if (!userId) return null;

  // Mock workout plans for demonstration
  const workoutPlans = [
    {
      id: 1,
      name: "Upper Body - Push",
      exercises: [
        { id: 1, name: "Bench Press", sets: 3, reps: "8-12", weight: 80 },
        { id: 2, name: "Incline Dumbbell Press", sets: 3, reps: "10-15", weight: 25 },
        { id: 3, name: "Lateral Raises", sets: 4, reps: "12-20", weight: 12 },
        { id: 4, name: "Tricep Dips", sets: 3, reps: "10-15" },
      ]
    },
    {
      id: 2,
      name: "Pull Day",
      exercises: [
        { id: 5, name: "Pull-ups", sets: 3, reps: "6-10" },
        { id: 6, name: "Barbell Rows", sets: 3, reps: "8-12", weight: 70 },
        { id: 7, name: "Face Pulls", sets: 3, reps: "15-20", weight: 15 },
        { id: 8, name: "Bicep Curls", sets: 3, reps: "10-15", weight: 15 },
      ]
    },
    {
      id: 3,
      name: "Legs",
      exercises: [
        { id: 9, name: "Squats", sets: 4, reps: "8-12", weight: 100 },
        { id: 10, name: "Romanian Deadlifts", sets: 3, reps: "10-15", weight: 80 },
        { id: 11, name: "Leg Press", sets: 3, reps: "12-20", weight: 150 },
        { id: 12, name: "Calf Raises", sets: 4, reps: "15-25", weight: 40 },
      ]
    }
  ];

  const startWorkout = (plan: any) => {
    setActiveWorkout(plan);
  };

  const completeWorkout = () => {
    setActiveWorkout(null);
    setShowFeedback(true);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 safe-area-top">
        <h1 className="text-xl font-bold text-foreground">{t("training.title")}</h1>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Auto-Regulation Feedback */}
        {showFeedback && (
          <AutoRegulationFeedback
            sessionId={1} // Mock session ID
            userId={userId}
            onComplete={() => setShowFeedback(false)}
          />
        )}

        {/* Active Workout */}
        {activeWorkout && (
          <WorkoutSession
            userId={userId}
            sessionName={activeWorkout.name}
            exercises={activeWorkout.exercises}
            onComplete={completeWorkout}
          />
        )}

        {!activeWorkout && !showFeedback && (
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="current">Current</TabsTrigger>
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-6">
              {/* Training Stats */}
              <Card className="card-surface">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {t("training.mesocycle")} Progress
                    <Target className="w-5 h-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {t("training.week_of", { current: 3, total: 6 })}
                    </span>
                    <div className="w-32 h-2 bg-secondary rounded-full">
                      <div className="w-1/2 h-full bg-primary rounded-full"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-400">
                        {trainingStats?.totalSessions || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Sessions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-400">
                        {trainingStats?.totalVolume || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Volume</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Today's Workouts */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Today's Workouts</h3>
                {workoutPlans.map((plan) => (
                  <Card key={plan.id} className="card-surface">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <Button
                          onClick={() => startWorkout(plan)}
                          size="sm"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {t("training.start_workout")}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {plan.exercises.slice(0, 3).map((exercise, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">{exercise.name}</span>
                            <span className="text-foreground">
                              {exercise.sets} × {exercise.reps}
                            </span>
                          </div>
                        ))}
                        {plan.exercises.length > 3 && (
                          <div className="text-sm text-muted-foreground">
                            +{plan.exercises.length - 3} more exercises
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="library" className="space-y-6">
              {/* Exercise Library */}
              <Card className="card-surface">
                <CardHeader>
                  <CardTitle>{t("training.exercise_library")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {exercises?.slice(0, 10).map((exercise: any) => (
                      <div key={exercise.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div>
                          <div className="font-medium">{exercise.name}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {exercise.category} • {exercise.muscleGroups?.join(", ")}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              {/* Workout History */}
              <Card className="card-surface">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {t("training.workout_history")}
                    <History className="w-5 h-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {workoutSessions && workoutSessions.length > 0 ? (
                    <div className="space-y-3">
                      {workoutSessions.slice(0, 5).map((session: any) => (
                        <div key={session.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <div>
                            <div className="font-medium">{session.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(session.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{session.duration || 0}min</div>
                            <div className="text-sm text-muted-foreground">
                              {session.totalVolume || 0} volume
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No workout history yet. Start your first workout!
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
