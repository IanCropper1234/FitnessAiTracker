import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  TrendingUp, 
  Target, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  PlayCircle,
  PauseCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Mesocycle {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  currentWeek: number;
  totalWeeks: number;
  phase: 'accumulation' | 'intensification' | 'deload';
  isActive: boolean;
}

interface MesocycleRecommendation {
  shouldDeload: boolean;
  nextWeekVolume: Array<{
    muscleGroupId: number;
    week: number;
    targetSets: number;
    phase: string;
  }>;
  phaseTransition?: {
    currentPhase: string;
    nextPhase: string;
    reason: string;
  };
  fatigueFeedback: {
    overallFatigue: number;
    recoveryLevel: number;
    recommendations: string[];
  };
}

interface MesocycleDashboardProps {
  userId: number;
}

export default function MesocycleDashboard({ userId }: MesocycleDashboardProps) {
  const queryClient = useQueryClient();

  // Get current mesocycles
  const { data: mesocycles = [], isLoading: mesocyclesLoading } = useQuery({
    queryKey: ['/api/training/mesocycles', userId],
    queryFn: () => apiRequest(`/api/training/mesocycles/${userId}`, { method: 'GET' }),
  });

  // Get mesocycle recommendations
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery<MesocycleRecommendation>({
    queryKey: ['/api/training/mesocycle-recommendations', userId],
    queryFn: () => apiRequest(`/api/training/mesocycle-recommendations/${userId}`, { method: 'GET' }),
  });

  // Create new mesocycle mutation
  const createMesocycleMutation = useMutation({
    mutationFn: (data: { name: string; templateId?: number; totalWeeks: number }) =>
      apiRequest('/api/training/mesocycles', {
        method: 'POST',
        body: JSON.stringify({ userId, ...data }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/training/mesocycles'] });
    },
  });

  const activeMesocycle = mesocycles.find((m: Mesocycle) => m.isActive);

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'accumulation': return 'bg-blue-500 text-white';
      case 'intensification': return 'bg-orange-500 text-white';
      case 'deload': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getFatigueColor = (level: number) => {
    if (level < 3) return 'text-green-600';
    if (level < 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (mesocyclesLoading || recommendationsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Mesocycle Overview */}
      {activeMesocycle ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-blue-500" />
                  {activeMesocycle.name}
                </CardTitle>
                <CardDescription>
                  Week {activeMesocycle.currentWeek} of {activeMesocycle.totalWeeks}
                </CardDescription>
              </div>
              <Badge className={getPhaseColor(activeMesocycle.phase)}>
                {activeMesocycle.phase.charAt(0).toUpperCase() + activeMesocycle.phase.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{Math.round((activeMesocycle.currentWeek / activeMesocycle.totalWeeks) * 100)}%</span>
                </div>
                <Progress 
                  value={(activeMesocycle.currentWeek / activeMesocycle.totalWeeks) * 100} 
                  className="w-full"
                />
              </div>

              {/* Dates */}
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Started: {new Date(activeMesocycle.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span>Ends: {new Date(activeMesocycle.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Mesocycle</CardTitle>
            <CardDescription>Start a new training mesocycle to begin structured periodization</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => createMesocycleMutation.mutate({
                name: "New Mesocycle",
                totalWeeks: 6
              })}
              disabled={createMesocycleMutation.isPending}
            >
              {createMesocycleMutation.isPending ? "Creating..." : "Start New Mesocycle"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations && (
        <Tabs defaultValue="volume" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="volume">Volume Progression</TabsTrigger>
            <TabsTrigger value="fatigue">Fatigue Analysis</TabsTrigger>
            <TabsTrigger value="phase">Phase Management</TabsTrigger>
          </TabsList>

          <TabsContent value="volume" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Next Week Volume Targets
                </CardTitle>
                <CardDescription>
                  Recommended training volume for next week based on current progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.nextWeekVolume.map((volume, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">Muscle Group {volume.muscleGroupId}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Week {volume.week} • {volume.phase}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{volume.targetSets}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">sets</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fatigue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recovery & Fatigue Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Fatigue Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Overall Fatigue</p>
                      <p className={`text-2xl font-bold ${getFatigueColor(recommendations.fatigueFeedback.overallFatigue)}`}>
                        {recommendations.fatigueFeedback.overallFatigue.toFixed(1)}/10
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Recovery Level</p>
                      <p className={`text-2xl font-bold ${getFatigueColor(10 - recommendations.fatigueFeedback.recoveryLevel)}`}>
                        {recommendations.fatigueFeedback.recoveryLevel.toFixed(1)}/10
                      </p>
                    </div>
                  </div>

                  {/* Deload Warning */}
                  {recommendations.shouldDeload && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                        Deload recommended - High fatigue accumulation detected
                      </p>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {recommendations.fatigueFeedback.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phase" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Phase Transitions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recommendations.phaseTransition ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        Phase Transition Recommended
                      </h4>
                      <div className="flex items-center gap-4 mb-2">
                        <Badge className={getPhaseColor(recommendations.phaseTransition.currentPhase)}>
                          {recommendations.phaseTransition.currentPhase}
                        </Badge>
                        <span>→</span>
                        <Badge className={getPhaseColor(recommendations.phaseTransition.nextPhase)}>
                          {recommendations.phaseTransition.nextPhase}
                        </Badge>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {recommendations.phaseTransition.reason}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <PauseCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No phase transitions needed at this time</p>
                    <p className="text-sm">Continue with current phase</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Mesocycle History */}
      {mesocycles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mesocycle History</CardTitle>
            <CardDescription>Previous and current training blocks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mesocycles.map((mesocycle: Mesocycle) => (
                <div 
                  key={mesocycle.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    mesocycle.isActive 
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div>
                    <p className="font-medium">{mesocycle.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {new Date(mesocycle.startDate).toLocaleDateString()} - {new Date(mesocycle.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPhaseColor(mesocycle.phase)}>
                      {mesocycle.phase}
                    </Badge>
                    {mesocycle.isActive && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}