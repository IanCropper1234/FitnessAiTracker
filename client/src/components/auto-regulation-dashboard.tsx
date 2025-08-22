import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TrendingUp, TrendingDown, Target, AlertTriangle, Activity, Zap, Info, ChevronDown, ChevronRight } from "lucide-react";
import { AutoRegulationExplanation } from "./auto-regulation-explanation";

interface VolumeRecommendation {
  muscleGroupId: number;
  muscleGroupName: string;
  currentVolume: number;
  recommendedAdjustment: number;
  adjustmentReason: string;
  confidenceLevel: number;
  recommendation: "increase" | "decrease" | "maintain" | "deload";
}

interface FatigueAnalysis {
  overallFatigue: number;
  recoveryTrend: "improving" | "declining" | "stable";
  deloadRecommended: boolean;
  daysToDeload?: number;
  muscleGroupFatigue: Array<{
    muscleGroupId: number;
    muscleGroupName: string;
    fatigueLevel: number;
    volumeStress: number;
  }>;
}

interface AutoRegulationDashboardProps {
  userId: number;
}

export function AutoRegulationDashboard({ userId }: AutoRegulationDashboardProps) {
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  // Fetch volume recommendations
  const { data: recommendations = [], isLoading: recommendationsLoading } = useQuery<VolumeRecommendation[]>({
    queryKey: ["/api/training/volume-recommendations"],
  });

  // Fetch fatigue analysis
  const { data: fatigueAnalysis, isLoading: fatigueLoading } = useQuery<FatigueAnalysis>({
    queryKey: ["/api/training/fatigue-analysis"],
  });

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "increase": return "text-green-600 bg-green-50 border-green-200";
      case "decrease": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "deload": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-950 dark:border-indigo-800";
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case "increase": return TrendingUp;
      case "decrease": return TrendingDown;
      case "deload": return AlertTriangle;
      default: return Target;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improving": return "text-green-600";
      case "declining": return "text-red-600";
      default: return "text-indigo-600 dark:text-indigo-400";
    }
  };

  const getFatigueColor = (level: number) => {
    if (level >= 7) return "text-red-600";
    if (level >= 5) return "text-yellow-600";
    return "text-green-600";
  };

  if (recommendationsLoading || fatigueLoading) {
    return (
      <div className="space-y-4 px-2 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted "></div>
          <div className="h-48 bg-muted "></div>
          <div className="h-64 bg-muted "></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-2 max-w-4xl mx-auto">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Auto-Regulation Dashboard
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            AI-powered training adjustments based on your feedback and evidence-based training methodology.
          </p>
        </CardHeader>
      </Card>
      {/* Fatigue Analysis */}
      {fatigueAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recovery & Fatigue Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Fatigue */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2">
                      <span className={getFatigueColor(fatigueAnalysis.overallFatigue)}>
                        {fatigueAnalysis.overallFatigue.toFixed(1)}/10
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Overall Fatigue</p>
                    <Progress 
                      value={fatigueAnalysis.overallFatigue * 10} 
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-lg font-medium mb-2">
                      <span className={getTrendColor(fatigueAnalysis.recoveryTrend)}>
                        {fatigueAnalysis.recoveryTrend.charAt(0).toUpperCase() + fatigueAnalysis.recoveryTrend.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Recovery Trend</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    {fatigueAnalysis.deloadRecommended ? (
                      <>
                        <Badge variant="destructive" className="mb-2">
                          Deload Recommended
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {fatigueAnalysis.daysToDeload} days recommended
                        </p>
                      </>
                    ) : (
                      <>
                        <Badge variant="default" className="mb-2">
                          Continue Training
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Recovery levels good
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Deload Alert */}
            {fatigueAnalysis.deloadRecommended && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  <strong>Deload Recommended:</strong> Your fatigue levels suggest taking {fatigueAnalysis.daysToDeload} days 
                  of reduced training intensity. Consider 50-60% of normal volume with lighter weights.
                </AlertDescription>
              </Alert>
            )}

            {/* Muscle Group Fatigue */}
            {fatigueAnalysis.muscleGroupFatigue.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Muscle Group Fatigue Levels</h4>
                <div className="grid gap-3">
                  {fatigueAnalysis.muscleGroupFatigue.map((mg) => (
                    <div key={mg.muscleGroupId} className="flex items-center justify-between p-3  border">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{mg.muscleGroupName}</span>
                          <span className={`text-sm font-medium ${getFatigueColor(mg.fatigueLevel || 0)}`}>
                            {(mg.fatigueLevel || 0).toFixed(1)}/10
                          </span>
                        </div>
                        <Progress value={(mg.fatigueLevel || 0) * 10} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Volume stress: {((mg.volumeStress || 0) * 100).toFixed(0)}% of MAV
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* Volume Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Volume Recommendations
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              AI-generated volume adjustments based on your recent feedback and scientific methodology.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {recommendations.map((rec) => {
                const Icon = getRecommendationIcon(rec.recommendation);
                return (
                  <Card key={rec.muscleGroupId} className={`border ${getRecommendationColor(rec.recommendation)}`}>
                    <CardContent className="p-4 bg-[#111418]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-4 w-4" />
                            <h4 className="font-medium">{rec.muscleGroupName}</h4>
                            <Badge variant="outline" className="text-xs">
                              {rec.recommendation.charAt(0).toUpperCase() + rec.recommendation.slice(1)} Volume
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Current Volume</p>
                              <p className="font-medium">{rec.currentVolume} sets/week</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Adjustment</p>
                              <p className="font-medium">
                                {rec.recommendedAdjustment > 0 ? '+' : ''}{rec.recommendedAdjustment}%
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-sm leading-relaxed">{rec.adjustmentReason}</p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">Confidence:</span>
                            <Progress value={rec.confidenceLevel * 10} className="flex-1 h-2" />
                            <span className="text-xs text-muted-foreground">{rec.confidenceLevel}/10</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      {/* How It Works Section */}
      <Card>
        <Collapsible open={isExplanationOpen} onOpenChange={setIsExplanationOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer collapsible-trigger hover:bg-accent/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  How Auto-Regulation Applies to Your Upcoming Workouts
                </div>
                <ChevronDown className="h-4 w-4 chevron-rotate" data-state={isExplanationOpen ? 'open' : 'closed'} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent className="collapsible-content data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
            <CardContent>
              <AutoRegulationExplanation />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
      {/* No Data Message */}
      {recommendations.length === 0 && !fatigueAnalysis && (
        <Card>
          <CardContent className="text-center p-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Start Training to See Recommendations</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Complete some workouts and provide auto-regulation feedback to see personalized 
              volume recommendations and fatigue analysis.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}