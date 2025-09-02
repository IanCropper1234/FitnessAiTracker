import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Calendar, 
  TrendingUp, 
  Target, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  Plus,
  Trash2,
  Edit3,
  Settings,
  Pause,
  Play,
  RotateCcw,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
// import MesocycleProgramBuilder from "./mesocycle-program-builder"; // Replaced with standalone page
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface Mesocycle {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  currentWeek: number;
  totalWeeks: number;
  phase: 'accumulation' | 'intensification' | 'deload';
  isActive: boolean;
  isPaused?: boolean;
  pauseReason?: string;
  pausedAt?: string;
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
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Get current mesocycles
  const { data: mesocycles = [], isLoading: mesocyclesLoading } = useQuery({
    queryKey: ['/api/training/mesocycles', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/training/mesocycles`);
      const data = await response.json();
      return Array.isArray(data) ? data : [data];
    },
  });

  // Get mesocycle recommendations
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery<MesocycleRecommendation>({
    queryKey: ['/api/training/mesocycle-recommendations', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/training/mesocycle-recommendations`);
      return response.json();
    },
  });

  // Get workout sessions to check completion status
  const { data: sessions = [] } = useQuery({
    queryKey: ['/api/training/sessions', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/training/sessions`);
      return response.json();
    },
  });

  // Update mesocycle mutation (pause/restart/modify)
  const updateMesocycleMutation = useMutation({
    mutationFn: async ({ id, updateData }: { id: number; updateData: any }) => {
      const response = await apiRequest('PUT', `/api/training/mesocycles/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/training/mesocycles', userId] });
      toast({
        title: "Mesocycle Updated",
        description: "Changes applied successfully.",
      });
    },
  });

  // Delete mesocycle mutation
  const deleteMesocycleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/training/mesocycles/${id}`);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both mesocycles and sessions cache since sessions are deleted
      queryClient.invalidateQueries({ queryKey: ['/api/training/mesocycles', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/training/sessions', userId] });
      toast({
        title: "Mesocycle Deleted",
        description: "The mesocycle has been removed successfully.",
      });
    },
  });

  // Advance week mutation
  const advanceWeekMutation = useMutation({
    mutationFn: async (mesocycleId: number) => {
      const response = await apiRequest('POST', `/api/training/mesocycles/${mesocycleId}/advance-week`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/training/mesocycles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/training/sessions'] });
      toast({
        title: data.mesocycleComplete ? "Mesocycle Complete!" : "Week Advanced",
        description: data.message || data.recommendation,
      });
    },
  });

  // Ensure mesocycles is always an array and find active one
  const mesocycleArray = Array.isArray(mesocycles) ? mesocycles : [mesocycles].filter(Boolean);
  const activeMesocycle = mesocycleArray.find((m: Mesocycle) => m?.isActive === true);

  // Check if all current week sessions are completed
  const canAdvanceWeek = (mesocycle: Mesocycle | undefined) => {
    if (!mesocycle || !Array.isArray(sessions) || sessions.length === 0) return false;
    
    // Get sessions for the current mesocycle and current week
    const currentWeekSessions = sessions.filter((session: any) => 
      session.mesocycleId === mesocycle.id && 
      session.name.includes(`Week ${mesocycle.currentWeek}`)
    );
    
    // Return true only if all current week sessions are completed
    return currentWeekSessions.length > 0 && currentWeekSessions.every((session: any) => session.isCompleted);
  };

  // Get current week session completion status
  const getCurrentWeekStatus = (mesocycle: Mesocycle | undefined) => {
    if (!mesocycle || !Array.isArray(sessions) || sessions.length === 0) return { completed: 0, total: 0 };
    
    const currentWeekSessions = sessions.filter((session: any) => 
      session.mesocycleId === mesocycle.id && 
      session.name.includes(`Week ${mesocycle.currentWeek}`)
    );
    
    const completed = currentWeekSessions.filter((session: any) => session.isCompleted).length;
    const total = currentWeekSessions.length;
    
    return { completed, total };
  };

  const handlePauseMesocycle = (mesocycleId: number) => {
    const pauseReason = window.prompt("Pause reason (optional):", "");
    updateMesocycleMutation.mutate({
      id: mesocycleId,
      updateData: { 
        isPaused: true,
        pauseReason: pauseReason || null,
        pausedAt: new Date()
      }
    });
  };

  const handleRestartMesocycle = (mesocycleId: number) => {
    // Resume paused mesocycle
    updateMesocycleMutation.mutate({
      id: mesocycleId,
      updateData: { 
        isPaused: false,
        pauseReason: null,
        pausedAt: null
      }
    });
  };

  const handleAdvanceWeek = (mesocycleId: number) => {
    advanceWeekMutation.mutate(mesocycleId);
  };

  const handleDeleteMesocycle = (mesocycleId: number) => {
    deleteMesocycleMutation.mutate(mesocycleId);
  };

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

  // Collapsible History Card Component
  const CollapsibleHistoryCard = ({ mesocycles, getPhaseColor }: { mesocycles: Mesocycle[], getPhaseColor: (phase: string) => string }) => {
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    
    return (
      <Card>
        <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Mesocycle History
                    <Badge variant="secondary" className="text-xs">
                      {mesocycles.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>Previous and current training blocks</CardDescription>
                </div>
                {isHistoryOpen ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent className="collapsible-content data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
            <CardContent className="pt-0">
              <div className="space-y-2">
                {mesocycles.map((mesocycle: Mesocycle) => (
                  <div 
                    key={mesocycle.id}
                    className={`flex items-center justify-between p-3 border ${
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
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  if (mesocyclesLoading || recommendationsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-100 dark:bg-gray-800  animate-pulse" />
        <div className="h-48 bg-gray-100 dark:bg-gray-800  animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Mesocycle Overview */}
      {activeMesocycle ? (
        <Card className="pt-[10px] pb-[10px]">
          <CardHeader className="flex flex-col space-y-3 p-6 pl-[10px] pr-[10px] pt-[4px] pb-[4px] mt-[0px] mb-[0px] ml-[-5px] mr-[-5px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeMesocycle.isPaused ? (
                  <PauseCircle className="h-6 w-6 text-orange-500 flex-shrink-0" />
                ) : (
                  <PlayCircle className="h-6 w-6 text-blue-500 flex-shrink-0" />
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="tracking-tight text-lg font-semibold">
                      {activeMesocycle.name}
                    </CardTitle>
                    {activeMesocycle.isPaused && (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        Paused
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Week {activeMesocycle.currentWeek} of {activeMesocycle.totalWeeks}
                    {activeMesocycle.isPaused && activeMesocycle.pauseReason && (
                      <span className="text-orange-600 block mt-1">• {activeMesocycle.pauseReason}</span>
                    )}
                  </CardDescription>
                </div>
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

              {/* Week Completion Status */}
              {activeMesocycle && (
                <div className="flex items-center justify-between p-3 dark:bg-gray-800  text-[17px] bg-[#3c81f6]">
                  <div>
                    <p className="text-sm font-medium text-[#cccaca]">
                      Week {activeMesocycle.currentWeek} Progress
                    </p>
                    <p className="text-xs dark:text-gray-400 text-[#fafbff]">
                      {getCurrentWeekStatus(activeMesocycle).completed} of {getCurrentWeekStatus(activeMesocycle).total} sessions completed
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canAdvanceWeek(activeMesocycle) ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Ready to advance</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-orange-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium text-[#cccaca]">Complete remaining sessions</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mesocycle Controls */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <Button
                  size="sm"
                  onClick={() => handleAdvanceWeek(activeMesocycle.id)}
                  disabled={advanceWeekMutation.isPending || !canAdvanceWeek(activeMesocycle) || activeMesocycle.isPaused}
                  className="flex items-center justify-center gap-1.5 text-xs"
                  title={
                    activeMesocycle.isPaused 
                      ? "Resume mesocycle to advance week" 
                      : !canAdvanceWeek(activeMesocycle) 
                        ? "Complete all current week sessions to advance" 
                        : ""
                  }
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  {advanceWeekMutation.isPending ? "Advancing..." : "Advance"}
                </Button>
                
                {activeMesocycle.isPaused ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestartMesocycle(activeMesocycle.id)}
                    disabled={updateMesocycleMutation.isPending}
                    className="flex items-center justify-center gap-1.5 text-xs text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950/30 dark:hover:text-green-300"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Resume
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePauseMesocycle(activeMesocycle.id)}
                    disabled={updateMesocycleMutation.isPending}
                    className="flex items-center justify-center gap-1.5 text-xs"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    Pause
                  </Button>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center justify-center gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Mesocycle</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{activeMesocycle.name}" and all associated workout data. 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteMesocycle(activeMesocycle.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
              onClick={() => setLocation('/create-mesocycle')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New Mesocycle
            </Button>
          </CardContent>
        </Card>
      )}
      {/* Recommendations */}
      {recommendations && (
        <Tabs defaultValue="volume" className="w-full">
          <TabsList className="flex w-full overflow-x-auto scrollbar-hide bg-gray-100 dark:bg-gray-800 p-1 relative rounded-lg shadow-inner">
            <TabsTrigger 
              value="volume" 
              className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap relative z-10 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] data-[state=active]:bg-white data-[state=active]:dark:bg-gray-700 data-[state=active]:shadow-md data-[state=active]:scale-[1.02] data-[state=active]:text-blue-600 data-[state=active]:dark:text-blue-400 data-[state=active]:font-medium hover:bg-gray-200/70 dark:hover:bg-gray-700/70 hover:scale-[1.01] data-[state=inactive]:hover:text-gray-700 data-[state=inactive]:dark:hover:text-gray-300 before:absolute before:inset-0 before:rounded-md before:transition-all before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)] data-[state=active]:before:bg-gradient-to-b data-[state=active]:before:from-white/50 data-[state=active]:before:to-transparent data-[state=active]:dark:before:from-gray-600/50"
            >
              <span className="relative z-10 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">Volume Progression</span>
            </TabsTrigger>
            <TabsTrigger 
              value="fatigue" 
              className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap relative z-10 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] data-[state=active]:bg-white data-[state=active]:dark:bg-gray-700 data-[state=active]:shadow-md data-[state=active]:scale-[1.02] data-[state=active]:text-blue-600 data-[state=active]:dark:text-blue-400 data-[state=active]:font-medium hover:bg-gray-200/70 dark:hover:bg-gray-700/70 hover:scale-[1.01] data-[state=inactive]:hover:text-gray-700 data-[state=inactive]:dark:hover:text-gray-300 before:absolute before:inset-0 before:rounded-md before:transition-all before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)] data-[state=active]:before:bg-gradient-to-b data-[state=active]:before:from-white/50 data-[state=active]:before:to-transparent data-[state=active]:dark:before:from-gray-600/50"
            >
              <span className="relative z-10 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">Fatigue Analysis</span>
            </TabsTrigger>
            <TabsTrigger 
              value="phase" 
              className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap relative z-10 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] data-[state=active]:bg-white data-[state=active]:dark:bg-gray-700 data-[state=active]:shadow-md data-[state=active]:scale-[1.02] data-[state=active]:text-blue-600 data-[state=active]:dark:text-blue-400 data-[state=active]:font-medium hover:bg-gray-200/70 dark:hover:bg-gray-700/70 hover:scale-[1.01] data-[state=inactive]:hover:text-gray-700 data-[state=inactive]:dark:hover:text-gray-300 before:absolute before:inset-0 before:rounded-md before:transition-all before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)] data-[state=active]:before:bg-gradient-to-b data-[state=active]:before:from-white/50 data-[state=active]:before:to-transparent data-[state=active]:dark:before:from-gray-600/50"
            >
              <span className="relative z-10 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">Phase Management</span>
            </TabsTrigger>
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
                {recommendations.nextWeekVolume && recommendations.nextWeekVolume.length > 0 ? (
                  <div className="space-y-3">
                    {recommendations.nextWeekVolume.map((volume: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 ">
                        <div>
                          <p className="font-medium">{volume.muscleGroupName || `Muscle Group ${volume.muscleGroupId}`}</p>
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
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">No Active Mesocycle</p>
                    <p className="text-sm">Create a mesocycle to view volume progression targets</p>
                  </div>
                )}
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
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 ">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Overall Fatigue</p>
                      <p className={`text-2xl font-bold ${getFatigueColor(recommendations.fatigueFeedback.overallFatigue)}`}>
                        {recommendations.fatigueFeedback.overallFatigue.toFixed(1)}/10
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 ">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Recovery Level</p>
                      <p className={`text-2xl font-bold ${getFatigueColor(10 - recommendations.fatigueFeedback.recoveryLevel)}`}>
                        {recommendations.fatigueFeedback.recoveryLevel.toFixed(1)}/10
                      </p>
                    </div>
                  </div>

                  {/* Deload Warning */}
                  {recommendations.shouldDeload && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 ">
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
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 ">
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
      {/* Mesocycle History - Collapsible */}
      {Array.isArray(mesocycles) && mesocycles.length > 0 && (
        <CollapsibleHistoryCard mesocycles={mesocycles} getPhaseColor={getPhaseColor} />
      )}
      {/* Global Action Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={() => setLocation('/create-mesocycle')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New Mesocycle
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Program Builder moved to standalone page: /create-mesocycle */}
    </div>
  );
}