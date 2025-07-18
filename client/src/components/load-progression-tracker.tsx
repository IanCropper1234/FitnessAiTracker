import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  Clock, 
  Award,
  Activity,
  AlertCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface LoadProgressionRecommendation {
  exerciseId: number;
  exerciseName: string;
  currentWeight: number;
  recommendedWeight: number;
  recommendedReps: string;
  progressionType: 'weight' | 'reps' | 'volume';
  confidence: number;
  reasoning: string[];
}

interface PerformanceAnalysis {
  trend: 'improving' | 'plateauing' | 'declining';
  strengthGain: number;
  volumeGain: number;
  consistencyScore: number;
  recommendations: string[];
}

interface LoadProgressionTrackerProps {
  userId: number;
  exerciseIds?: number[];
}

export default function LoadProgressionTracker({ userId, exerciseIds }: LoadProgressionTrackerProps) {
  const [timeframe, setTimeframe] = useState(28);

  // Get load progressions for specific exercises
  const { data: progressions = [], isLoading: progressionsLoading } = useQuery({
    queryKey: ['/api/training/load-progression', userId, exerciseIds],
    queryFn: () => apiRequest(`/api/training/load-progression/${userId}${exerciseIds ? `?exerciseIds=${exerciseIds.join(',')}` : ''}`),
    enabled: !!userId,
  });

  // Get performance analysis
  const { data: analysis, isLoading: analysisLoading } = useQuery<PerformanceAnalysis>({
    queryKey: ['/api/training/performance-analysis', userId, timeframe],
    queryFn: () => apiRequest(`/api/training/performance-analysis/${userId}?timeframeDays=${timeframe}`),
    enabled: !!userId,
  });

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 dark:text-green-400';
      case 'declining':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getProgressionTypeColor = (type: string) => {
    switch (type) {
      case 'weight':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'reps':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'volume':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (progressionsLoading || analysisLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Overview ({timeframe} days)
            </CardTitle>
            <CardDescription>
              Your training progress and performance trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Overall Trend */}
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  {getTrendIcon(analysis.trend)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Overall Trend</p>
                <p className={`font-semibold capitalize ${getTrendColor(analysis.trend)}`}>
                  {analysis.trend}
                </p>
              </div>

              {/* Strength Gain */}
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Strength Gain</p>
                <p className={`font-semibold ${analysis.strengthGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysis.strengthGain >= 0 ? '+' : ''}{analysis.strengthGain.toFixed(1)}%
                </p>
              </div>

              {/* Volume Gain */}
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Volume Gain</p>
                <p className={`font-semibold ${analysis.volumeGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysis.volumeGain >= 0 ? '+' : ''}{analysis.volumeGain.toFixed(1)}%
                </p>
              </div>

              {/* Consistency */}
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Award className="h-5 w-5 text-orange-500" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Consistency</p>
                <p className={`font-semibold ${analysis.consistencyScore >= 0.8 ? 'text-green-600' : analysis.consistencyScore >= 0.6 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {(analysis.consistencyScore * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Recommendations</h4>
                <div className="space-y-1">
                  {analysis.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Load Progression Recommendations */}
      {progressions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Next Session Recommendations
            </CardTitle>
            <CardDescription>
              AI-powered load progression based on your recent performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progressions.map((progression: LoadProgressionRecommendation, index: number) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{progression.exerciseName}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Current: {progression.currentWeight}kg
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getProgressionTypeColor(progression.progressionType)}>
                        {progression.progressionType}
                      </Badge>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${getConfidenceColor(progression.confidence)}`}>
                          {(progression.confidence * 100).toFixed(0)}% confidence
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progression Recommendation */}
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Recommended:</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {progression.recommendedWeight}kg × {progression.recommendedReps}
                      </span>
                    </div>
                    <Progress 
                      value={progression.confidence * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Reasoning */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Reasoning:</p>
                    {progression.reasoning.map((reason, i) => (
                      <p key={i} className="text-xs text-gray-600 dark:text-gray-400 pl-2 border-l-2 border-gray-300 dark:border-gray-600">
                        {reason}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {progressions.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Progression Data
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Complete some workouts to see load progression recommendations
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timeframe Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Timeframe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[7, 14, 28, 56].map((days) => (
              <Button
                key={days}
                variant={timeframe === days ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe(days)}
              >
                {days} days
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}