import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { LoadingState } from "@/components/ui/loading";
import { useRef, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Zap,
  Heart,
  Moon,
  BarChart3,
  Gauge
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Enhanced interfaces for scientific training data
interface VolumeLandmark {
  muscleGroupId: number;
  muscleGroupName: string;
  mev: number;
  mav: number;
  mrv: number;
  currentVolume: number;
  targetVolume: number;
  recoveryLevel: number;
  adaptationLevel: number;
  phase: 'accumulation' | 'intensification' | 'deload';
}

interface FatigueAnalysis {
  overallFatigue: number;
  recoveryScore: number;
  adaptationScore: number;
  trainingReadiness: number;
  deloadRecommended: boolean;
  trends: {
    recovery: 'improving' | 'declining' | 'stable';
    fatigue: 'increasing' | 'decreasing' | 'stable';
  };
}

interface TrainingMetrics {
  volumeLandmarks: VolumeLandmark[];
  fatigueAnalysis: FatigueAnalysis;
  weeklyProgress: {
    week: string;
    volume: number;
    frequency: number;
    averageRpe: number;
    recoveryScore: number;
  }[];
  phaseRecommendation: {
    currentPhase: string;
    shouldAdvance: boolean;
    nextPhase?: string;
    reasoning: string;
  };
  trainingConsistency: {
    weeklyFrequency: number;
    adherencePercentage: number;
    missedSessions: number;
  };
}

interface EnhancedTrainingOverviewProps {
  userId: number;
  date?: Date;
}

export function EnhancedTrainingOverview({ userId, date }: EnhancedTrainingOverviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch enhanced training analytics
  const { data: volumeLandmarks, isLoading: landmarksLoading } = useQuery({
    queryKey: ['/api/training/volume-landmarks', userId],
    queryFn: async () => {
      const response = await fetch('/api/training/volume-landmarks', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch volume landmarks');
      return response.json();
    }
  });

  const { data: trainingAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/analytics/training', userId],
    queryFn: async () => {
      const response = await fetch('/api/analytics/training?days=30', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch training analytics');
      return response.json();
    }
  });

  const { data: feedbackAnalytics, isLoading: feedbackLoading } = useQuery({
    queryKey: ['/api/analytics/feedback', userId],
    queryFn: async () => {
      const response = await fetch('/api/analytics/feedback?days=14', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch feedback analytics');
      return response.json();
    }
  });

  const { data: comprehensiveAnalytics, isLoading: comprehensiveLoading } = useQuery({
    queryKey: ['/api/analytics/comprehensive', userId],
    queryFn: async () => {
      const response = await fetch('/api/analytics/comprehensive?days=30', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch comprehensive analytics');
      return response.json();
    }
  });

  // Entrance animation for training overview
  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.training-metric-card');
      cards.forEach((card, index) => {
        (card as HTMLElement).style.opacity = '0';
        (card as HTMLElement).style.transform = 'translateY(20px)';
        
        setTimeout(() => {
          card.animate([
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ], {
            duration: 500,
            easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
            delay: index * 100,
            fill: 'forwards'
          });
        }, 100);
      });
    }
  }, [volumeLandmarks, trainingAnalytics, feedbackAnalytics]);

  if (landmarksLoading || analyticsLoading || feedbackLoading || comprehensiveLoading) {
    return (
      <div className="text-center py-8 text-body-sm text-gray-600 dark:text-gray-400">
        <div className="ios-loading-dots flex items-center gap-1 justify-center">
          <div className="dot w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full"></div>
          <div className="dot w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full"></div>
          <div className="dot w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!volumeLandmarks && !trainingAnalytics && !feedbackAnalytics) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        No training data yet. Start your first workout to see scientific insights!
      </div>
    );
  }

  // Calculate scientific metrics
  const recoveryScore = feedbackAnalytics?.summary?.recoveryScore || 5;
  const fatigueScore = 10 - recoveryScore; // Inverse relationship
  const trainingReadiness = Math.max(1, Math.min(10, recoveryScore + (comprehensiveAnalytics?.overview?.trainingConsistency || 50) / 10));
  
  // Volume landmarks summary
  const totalMuscleGroups = volumeLandmarks?.length || 0;
  const muscleGroupsAtMEV = volumeLandmarks?.filter((lg: any) => lg.currentVolume >= lg.mev && lg.currentVolume < lg.mav)?.length || 0;
  const muscleGroupsAtMAV = volumeLandmarks?.filter((lg: any) => lg.currentVolume >= lg.mav && lg.currentVolume < lg.mrv)?.length || 0;
  const muscleGroupsAtMRV = volumeLandmarks?.filter((lg: any) => lg.currentVolume >= lg.mrv)?.length || 0;

  // Training phase determination
  const averageVolume = volumeLandmarks?.reduce((sum: number, lg: any) => sum + (lg.currentVolume / lg.mav), 0) / totalMuscleGroups || 0;
  const currentPhase = averageVolume < 0.7 ? 'Accumulation' : averageVolume < 0.9 ? 'Intensification' : 'Peak/Deload';

  // Weekly progress data for chart
  const weeklyData = trainingAnalytics?.weeklyData?.slice(0, 4).map((week: any) => ({
    week: `W${week.weekStart ? new Date(week.weekStart).getMonth() + 1 : '?'}`,
    volume: Math.round(week.totalVolume / 1000), // Convert to thousands
    sessions: week.sessions,
    avgRpe: (week.averageRpe || 5).toFixed(1)
  })) || [];

  // Volume distribution data for pie chart
  const volumeDistribution = volumeLandmarks?.slice(0, 6).map((lg: any, index: number) => ({
    name: lg.muscleGroupName || `Group ${lg.muscleGroupId}`,
    value: lg.currentVolume,
    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'][index % 6]
  })) || [];

  return (
    <div ref={containerRef} className="space-y-4">
      
      {/* Primary Scientific Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Training Readiness */}
        <Card className="training-metric-card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-800 dark:text-green-200">Readiness</span>
            </div>
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {trainingReadiness.toFixed(1)}/10
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Progress value={trainingReadiness * 10} className="h-1.5 flex-1" />
              <Badge 
                variant={trainingReadiness >= 7 ? "default" : trainingReadiness >= 5 ? "secondary" : "destructive"}
                className="text-xs px-1 py-0"
              >
                {trainingReadiness >= 7 ? "High" : trainingReadiness >= 5 ? "Med" : "Low"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recovery Score */}
        <Card className="training-metric-card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Recovery</span>
            </div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {recoveryScore.toFixed(1)}/10
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Progress value={recoveryScore * 10} className="h-1.5 flex-1" />
              {recoveryScore >= 7 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : recoveryScore <= 3 ? (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ) : (
                <Activity className="h-3 w-3 text-yellow-500" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Training Phase */}
        <Card className="training-metric-card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-purple-800 dark:text-purple-200">Phase</span>
            </div>
            <div className="text-sm font-bold text-purple-900 dark:text-purple-100">
              {currentPhase}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Badge 
                variant={currentPhase === 'Accumulation' ? "default" : currentPhase === 'Intensification' ? "secondary" : "destructive"}
                className="text-xs px-1 py-0"
              >
                {averageVolume < 0.7 ? "Build" : averageVolume < 0.9 ? "Peak" : "Deload"}
              </Badge>
              {currentPhase === 'Peak/Deload' && (
                <AlertTriangle className="h-3 w-3 text-orange-500" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Volume Status */}
        <Card className="training-metric-card bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-medium text-orange-800 dark:text-orange-200">Volume</span>
            </div>
            <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
              {muscleGroupsAtMAV + muscleGroupsAtMRV}/{totalMuscleGroups}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <div className="text-xs text-orange-700 dark:text-orange-300">
                At optimal zones
              </div>
              {muscleGroupsAtMRV > 0 && (
                <AlertTriangle className="h-3 w-3 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Volume Landmarks Progress */}
      {volumeLandmarks && volumeLandmarks.length > 0 && (
        <Card className="training-metric-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Volume Landmarks Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {volumeLandmarks.slice(0, 5).map((landmark: any) => {
              const volumePercentage = Math.min(100, (landmark.currentVolume / landmark.mav) * 100);
              const status = landmark.currentVolume < landmark.mev ? 'Below MEV' :
                           landmark.currentVolume < landmark.mav ? 'Optimal Range' :
                           landmark.currentVolume < landmark.mrv ? 'High Volume' : 'At MRV';
              
              return (
                <div key={landmark.muscleGroupId} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{landmark.muscleGroupName || `Group ${landmark.muscleGroupId}`}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {landmark.currentVolume}/{landmark.mav} sets
                      </span>
                      <Badge 
                        variant={status === 'Optimal Range' ? "default" : status === 'High Volume' ? "secondary" : status === 'At MRV' ? "destructive" : "outline"}
                        className="text-xs px-1 py-0"
                      >
                        {status === 'Below MEV' ? 'Low' : status === 'Optimal Range' ? 'Good' : status === 'High Volume' ? 'High' : 'Max'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={volumePercentage} className="h-2 flex-1" />
                    <span className="text-xs text-gray-500 w-10 text-right">
                      {Math.round(volumePercentage)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>MEV: {landmark.mev}</span>
                    <span>MAV: {landmark.mav}</span>
                    <span>MRV: {landmark.mrv}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Weekly Progress Chart & Volume Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Weekly Progress Trend */}
        {weeklyData.length > 0 && (
          <Card className="training-metric-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-black dark:text-white">
                4-Week Progress Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="week" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#3B82F6" 
                    strokeWidth={2} 
                    dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Volume Distribution */}
        {volumeDistribution.length > 0 && (
          <Card className="training-metric-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-black dark:text-white">
                Volume Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={volumeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {volumeDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Scientific Recommendations */}
      <Card className="training-metric-card bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            RP-Based Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {fatigueScore >= 7 && (
            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <span>High fatigue detected - Consider deload week</span>
            </div>
          )}
          {muscleGroupsAtMRV > 0 && (
            <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300">
              <AlertTriangle className="h-4 w-4" />
              <span>{muscleGroupsAtMRV} muscle group(s) at MRV - Reduce volume</span>
            </div>
          )}
          {recoveryScore >= 8 && currentPhase === 'Accumulation' && (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
              <CheckCircle className="h-4 w-4" />
              <span>Excellent recovery - Can increase training volume</span>
            </div>
          )}
          {trainingReadiness <= 4 && (
            <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
              <Moon className="h-4 w-4" />
              <span>Low readiness - Focus on sleep and recovery</span>
            </div>
          )}
          {!fatigueScore && !muscleGroupsAtMRV && recoveryScore < 8 && trainingReadiness > 4 && (
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <CheckCircle className="h-4 w-4" />
              <span>Training progressing well - Continue current plan</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}