import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  Clock,
  Activity,
  Loader2
} from "lucide-react";

interface RPRecommendationsProps {
  userId: number;
}

export function RPRecommendations({ userId }: RPRecommendationsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);

  // Get current weekly goals for recommendations
  const { data: weeklyGoals } = useQuery({
    queryKey: ['/api/weekly-goals'],
    queryFn: async () => {
      const response = await fetch('/api/weekly-goals', {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Get current diet goals
  const { data: dietGoals } = useQuery({
    queryKey: ['/api/diet-goals'],
    queryFn: async () => {
      const response = await fetch('/api/diet-goals', {
        credentials: 'include'
      });
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Get wellness summary for recommendations
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

  // Generate new weekly adjustment
  const generateAdjustmentMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysToMonday);
      const weekStartString = weekStart.toISOString().split('T')[0];
      
      return apiRequest('/api/weekly-adjustment', {
        method: 'POST',
        body: { weekStartDate: weekStartString }
      });
    },
    onSuccess: () => {
      toast({
        title: "Recommendations Updated",
        description: "New RP-based recommendations have been generated based on your progress."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-goals'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate recommendations",
        variant: "destructive"
      });
    }
  });

  const latestGoal = weeklyGoals?.[0];
  const recommendation = latestGoal?.adjustmentRecommendation || 'maintain';

  // Calculate readiness score for context
  const calculateReadinessScore = () => {
    if (!weeklyWellness) return 5;
    
    const energyLevel = weeklyWellness.averageEnergyLevel || 5;
    const sleepQuality = weeklyWellness.averageSleepQuality || 5;
    const stressLevel = 10 - (weeklyWellness.averageStressLevel || 5);
    const adherencePerception = weeklyWellness.averageAdherencePerception || 5;
    
    return Math.round((energyLevel + sleepQuality + stressLevel + adherencePerception) / 4);
  };

  const readinessScore = calculateReadinessScore();

  // Generate contextual recommendations based on current data
  const getContextualRecommendations = () => {
    const recommendations = [];

    // Energy-based recommendations
    if (weeklyWellness?.averageEnergyLevel < 5) {
      recommendations.push({
        type: 'energy',
        priority: 'high',
        title: 'Improve Energy Levels',
        description: 'Your energy levels are below optimal. Consider increasing calories or improving sleep quality.',
        action: 'Review calorie intake and sleep habits'
      });
    }

    // Adherence recommendations
    if (latestGoal?.adherencePercentage < 80) {
      recommendations.push({
        type: 'adherence',
        priority: 'high',
        title: 'Focus on Consistency',
        description: 'Diet adherence is below 80%. Focus on meal planning and tracking accuracy.',
        action: 'Implement meal prep strategies'
      });
    }

    // Sleep recommendations
    if (weeklyWellness?.averageSleepQuality < 6) {
      recommendations.push({
        type: 'sleep',
        priority: 'medium',
        title: 'Optimize Sleep Quality',
        description: 'Poor sleep quality affects recovery and hunger hormones.',
        action: 'Establish consistent sleep schedule'
      });
    }

    // Stress management
    if (weeklyWellness?.averageStressLevel > 7) {
      recommendations.push({
        type: 'stress',
        priority: 'medium',
        title: 'Manage Stress Levels',
        description: 'High stress can impact cortisol and weight management.',
        action: 'Consider stress reduction techniques'
      });
    }

    // Calorie adjustment recommendations
    if (recommendation === 'increase_calories') {
      recommendations.push({
        type: 'calories',
        priority: 'high',
        title: 'Increase Calorie Intake',
        description: 'Your progress suggests increasing calories by 5-10% for optimal results.',
        action: 'Add 100-200 calories to daily target'
      });
    } else if (recommendation === 'decrease_calories') {
      recommendations.push({
        type: 'calories',
        priority: 'high',
        title: 'Reduce Calorie Intake',
        description: 'Consider reducing calories by 5-10% to resume progress.',
        action: 'Reduce daily calories by 100-200'
      });
    }

    return recommendations;
  };

  const contextualRecommendations = getContextualRecommendations();

  return (
    <div className="space-y-4">
      {/* Current Recommendation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI-Powered RP Recommendations
          </CardTitle>
          <CardDescription>
            Personalized adjustments based on your wellness check-ins and progress data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Recommendation */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-3">
              {recommendation === 'increase_calories' && <TrendingUp className="w-6 h-6 text-green-600" />}
              {recommendation === 'decrease_calories' && <TrendingDown className="w-6 h-6 text-red-600" />}
              {recommendation === 'improve_adherence' && <Target className="w-6 h-6 text-yellow-600" />}
              {recommendation === 'maintain' && <CheckCircle className="w-6 h-6 text-blue-600" />}
              <div>
                <h3 className="font-semibold text-lg">
                  {recommendation === 'increase_calories' && 'Increase Calories'}
                  {recommendation === 'decrease_calories' && 'Decrease Calories'}
                  {recommendation === 'improve_adherence' && 'Focus on Adherence'}
                  {recommendation === 'maintain' && 'Maintain Current Plan'}
                </h3>
                <p className="text-sm text-muted-foreground">Primary recommendation for this week</p>
              </div>
            </div>
            
            {latestGoal && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Calories:</span>
                  <span className="ml-1 font-medium">{latestGoal.dailyCalories}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Protein:</span>
                  <span className="ml-1 font-medium">{latestGoal.protein}g</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Carbs:</span>
                  <span className="ml-1 font-medium">{latestGoal.carbs}g</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fat:</span>
                  <span className="ml-1 font-medium">{latestGoal.fat}g</span>
                </div>
              </div>
            )}
          </div>

          {/* Readiness Context */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900">
            <span className="font-medium">Recovery Readiness</span>
            <Badge 
              variant={readinessScore >= 7 ? "default" : readinessScore >= 5 ? "secondary" : "destructive"}
            >
              {readinessScore}/10
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Contextual Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Actionable Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contextualRecommendations.length > 0 ? (
            <div className="space-y-3">
              {contextualRecommendations.map((rec, index) => (
                <div 
                  key={index}
                  className={`
                    p-3 border-l-4 bg-gray-50 dark:bg-gray-900
                    ${rec.priority === 'high' ? 'border-red-500' : 
                      rec.priority === 'medium' ? 'border-yellow-500' : 'border-blue-500'}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{rec.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                      <p className="text-xs font-medium mt-2 text-blue-600 dark:text-blue-400">
                        Action: {rec.action}
                      </p>
                    </div>
                    <Badge 
                      variant={rec.priority === 'high' ? "destructive" : rec.priority === 'medium' ? "secondary" : "default"}
                      className="text-xs"
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="font-medium">You're on track!</p>
              <p className="text-sm">No specific adjustments needed at this time.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate New Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Update Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Generate new recommendations based on your latest progress and wellness data.
            </p>
            <Button
              onClick={() => generateAdjustmentMutation.mutate()}
              disabled={generateAdjustmentMutation.isPending}
              className="w-full"
            >
              {generateAdjustmentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Progress...
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Generate New Recommendations
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Last updated: {latestGoal?.createdAt ? new Date(latestGoal.createdAt).toLocaleDateString() : 'Never'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}