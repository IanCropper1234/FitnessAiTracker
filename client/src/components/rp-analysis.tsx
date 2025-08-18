import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Brain, Activity, Heart } from "lucide-react";

interface RPAnalysisProps {
  userId: number;
}

export function RPAnalysis({ userId }: RPAnalysisProps) {
  // Get comprehensive analytics for RP analysis
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics/comprehensive', userId],
    queryFn: async () => {
      const response = await fetch('/api/analytics/comprehensive', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  // Get current week's wellness summary
  const { data: weeklyWellness } = useQuery({
    queryKey: ['/api/weekly-wellness-summary'],
    queryFn: async () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysToMonday);
      const weekStartString = weekStart.toISOString().split('T')[0];
      
      const response = await fetch(`/api/weekly-wellness-summary?weekStartDate=${weekStartString}`, {
        credentials: 'include'
      });
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Calculate current week start date (same logic as advanced-macro-management)
  const getCurrentWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    return weekStart.toISOString().split('T')[0];
  };

  const currentWeekStart = getCurrentWeekStart();

  // Get current weekly goals with specific week parameter (same as advanced-macro-management)
  const { data: weeklyGoals } = useQuery({
    queryKey: ['/api/weekly-goals', currentWeekStart],
    queryFn: async () => {
      const response = await fetch(`/api/weekly-goals?weekStartDate=${currentWeekStart}`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Get user profile for fitness goal
  const { data: userProfile } = useQuery({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            RP Analysis Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="ios-loading-dots flex items-center gap-1 mr-3">
              <div className="dot w-2 h-2 bg-blue-600 rounded-full"></div>
              <div className="dot w-2 h-2 bg-blue-600 rounded-full"></div>
              <div className="dot w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
            <span className="text-muted-foreground">Loading RP analysis...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const nutritionConsistency = analytics?.overview?.nutritionConsistency || 0;
  // Use the same data sources as Progress Metrics in advanced-macro-management
  const adherenceScore = parseFloat(weeklyGoals?.[0]?.adherencePercentage || "0");
  const weightTrend = parseFloat(weeklyGoals?.[0]?.weightChange || "0");
  const energyLevel = parseFloat(weeklyGoals?.[0]?.energyLevels || "5");
  
  // Calculate RP readiness score based on wellness metrics - use consistent data sources
  const calculateReadinessScore = () => {
    // Use energy level from weekly goals (same source as Progress Metrics)
    const energyFromGoals = parseFloat(weeklyGoals?.[0]?.energyLevels || "5");
    
    // Use other wellness metrics from weekly wellness if available, otherwise default values
    const sleepQuality = weeklyWellness?.averageSleepQuality || 5;
    const stressLevel = 10 - (weeklyWellness?.averageStressLevel || 5); // Invert stress (lower is better)
    const adherencePerception = weeklyWellness?.averageAdherencePerception || 5;
    
    return Math.round((energyFromGoals + sleepQuality + stressLevel + adherencePerception) / 4);
  };

  const readinessScore = calculateReadinessScore();

  // Determine phase based on user's fitness goal, not weight change
  const getCurrentPhase = () => {
    const fitnessGoal = userProfile?.user?.fitnessGoal;
    
    // Map fitness goals to RP phases
    switch (fitnessGoal) {
      case 'weight_loss':
      case 'fat_loss':
        return 'Fat Loss';
      case 'muscle_gain':
      case 'bulk':
      case 'gain_muscle':
        return 'Muscle Gain';
      case 'maintain':
      case 'maintenance':
      case 'body_recomposition':
      default:
        return 'Maintenance';
    }
  };

  const currentPhase = getCurrentPhase();

  // Get latest weekly goal recommendation
  const latestRecommendation = weeklyGoals?.[0]?.adjustmentRecommendation || 'maintain';

  return (
    <div className="space-y-4">
      {/* Overall RP Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            Renaissance Periodization Analysis
          </CardTitle>
          <CardDescription>
            Your nutrition performance analyzed using RP methodology
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Phase */}
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <span className="font-medium">Current Phase</span>
            <Badge 
              variant="default"
              className={`
                ${currentPhase === 'Fat Loss' ? 'bg-red-100 text-red-800' : 
                  currentPhase === 'Muscle Gain' ? 'bg-green-100 text-green-800' : 
                  'bg-blue-100 text-blue-800'}
              `}
            >
              {currentPhase}
            </Badge>
          </div>

          {/* Readiness Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Overall Readiness</span>
              <span className="text-lg font-bold">{readinessScore}/10</span>
            </div>
            <Progress value={readinessScore * 10} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Based on energy, sleep, stress, and adherence metrics
            </p>
          </div>

          {/* Adherence Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Diet Adherence</span>
              <span className="text-lg font-bold">{Math.round(adherenceScore)}%</span>
            </div>
            <Progress value={adherenceScore} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Consistency with macro and calorie targets
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Weekly Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Weight Change */}
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-center mb-2">
                {weightTrend > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : weightTrend < 0 ? (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                ) : (
                  <Target className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <div className="text-lg font-bold">
                {weightTrend > 0 ? '+' : ''}{weightTrend.toFixed(1)}kg
              </div>
              <div className="text-xs text-muted-foreground">Weight Change</div>
            </div>

            {/* Energy Level */}
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-center mb-2">
                <Heart className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-lg font-bold">
                {energyLevel.toFixed(1)}/10
              </div>
              <div className="text-xs text-muted-foreground">Energy Level</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RP Recommendations Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-600" />
            RP Methodology Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Current Recommendation */}
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            {latestRecommendation === 'increase_calories' && <TrendingUp className="w-5 h-5 text-green-600" />}
            {latestRecommendation === 'decrease_calories' && <TrendingDown className="w-5 h-5 text-red-600" />}
            {latestRecommendation === 'improve_adherence' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
            {latestRecommendation === 'maintain' && <CheckCircle className="w-5 h-5 text-blue-600" />}
            <div>
              <p className="font-medium text-sm">
                {latestRecommendation === 'increase_calories' && 'Increase Calories'}
                {latestRecommendation === 'decrease_calories' && 'Decrease Calories'}
                {latestRecommendation === 'improve_adherence' && 'Improve Adherence'}
                {latestRecommendation === 'maintain' && 'Maintain Current Plan'}
              </p>
              <p className="text-xs text-muted-foreground">Latest RP recommendation</p>
            </div>
          </div>

          {/* Key Insights */}
          <div className="space-y-2">
            <h4 className="font-medium">Key Insights</h4>
            <div className="space-y-1 text-sm">
              {readinessScore >= 8 && (
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle className="w-4 h-4" />
                  High recovery capacity - ready for progression
                </div>
              )}
              {readinessScore <= 4 && (
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <AlertTriangle className="w-4 h-4" />
                  Low recovery indicators - consider deload
                </div>
              )}
              {adherenceScore >= 90 && (
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle className="w-4 h-4" />
                  Excellent diet adherence
                </div>
              )}
              {adherenceScore < 80 && (
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                  <AlertTriangle className="w-4 h-4" />
                  Focus on improving consistency
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}