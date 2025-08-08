import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Brain,
  Target, 
  TrendingUp,
  Zap,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  ArrowLeft,
  Loader2,
  Info,
  ShoppingCart,
  Star,
  Activity,
  Shield,
  Heart
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface MicronutrientAnalysis {
  nutrient: string;
  currentIntake: number;
  recommendedIntake: number;
  unit: string;
  status: 'deficient' | 'adequate' | 'excessive';
  healthImpact: string;
  foodSources: string[];
  supplementRecommendation?: string;
}

interface NutritionInsight {
  category: string;
  insight: string;
  actionItems: string[];
  priority: 'low' | 'medium' | 'high';
}

interface DataQuality {
  completenessScore: number;
  reliabilityNote: string;
  recommendedActions: string[];
}

export default function EnhancedNutritionAI() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Form state
  const [timeRange, setTimeRange] = useState<string>("Last 7 Days");
  const [goals, setGoals] = useState<string[]>(['Muscle Gain']);
  const [healthConditions, setHealthConditions] = useState<string>('');

  // Available options
  const goalOptions = [
    'Muscle Gain',
    'Weight Loss', 
    'Health Optimization',
    'Athletic Performance',
    'Metabolic Health',
    'Immunity Boost',
    'Longevity'
  ];

  // Get user profile and nutrition data
  const { data: userProfile } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  const { data: nutritionData } = useQuery({
    queryKey: ['/api/nutrition/logs', timeRange],
  });

  // AI analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async () => {
      const request = {
        timeRange,
        primaryGoal: goals[0] || 'health_optimization',
        healthConditions: healthConditions || undefined
      };

      const response = await fetch('/api/ai/nutrition-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze nutrition data');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "AI Analysis Complete",
        description: "Your comprehensive nutrition analysis is ready!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze nutrition data. Please try again.",
        variant: "destructive"
      });
    }
  });

  

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deficient': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'adequate': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'excessive': return <Zap className="h-4 w-4 text-orange-400" />;
      default: return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost" 
          size="sm"
          onClick={() => setLocation('/nutrition')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-bold flex items-center gap-2 text-[16px] text-left pl-[0px] pr-[0px] ml-[-10px] mr-[-10px]">
            <Brain className="h-6 w-6 text-purple-500" />
            Enhanced Nutrition AI Analysis
          </h1>
          <p className="text-muted-foreground text-[12px] ml-[25px] mr-[25px]">Comprehensive micronutrient analysis & personalized RDA insights</p>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Analysis Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Analysis Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Time Range</label>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="14days">Last 2 Weeks</SelectItem>
                      <SelectItem value="30days">Last Month</SelectItem>
                      <SelectItem value="90days">Last 3 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Primary Goal</label>
                  <Select value={goals[0]} onValueChange={(value) => setGoals([value])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="health_optimization">Health Optimization</SelectItem>
                      <SelectItem value="weight_loss">Weight Loss</SelectItem>
                      <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                      <SelectItem value="athletic_performance">Athletic Performance</SelectItem>
                      <SelectItem value="metabolic_health">Metabolic Health</SelectItem>
                      <SelectItem value="immunity_boost">Immunity Boost</SelectItem>
                      <SelectItem value="longevity">Longevity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Health Conditions (Optional)</label>
                <Input
                  placeholder="e.g., Diabetes, Hypertension, PCOS (comma separated)"
                  value={healthConditions}
                  onChange={(e) => setHealthConditions(e.target.value)}
                />
              </div>

              <Button 
                onClick={() => analysisMutation.mutate()}
                disabled={analysisMutation.isPending}
                className="w-full"
              >
                {analysisMutation.isPending ? (
                  <>
                    <div className="ios-loading-dots flex items-center gap-1 mr-2">
                      <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                      <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                      <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                    Analyzing Nutrition...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate AI Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          
        </div>

        {/* Results Panel */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              AI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {!analysisMutation.data && !analysisMutation.isPending && (
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Configure analysis settings and generate your report</p>
              </div>
            )}

            {analysisMutation.isPending && (
              <div className="text-center py-12">
                <div className="ios-loading-dots flex items-center gap-1 justify-center mb-3">
                  <div className="dot w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="dot w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="dot w-2 h-2 bg-purple-500 rounded-full"></div>
                </div>
                <p className="text-sm">AI is analyzing your nutrition data...</p>
                <p className="text-xs text-muted-foreground mt-1">This comprehensive analysis may take a few moments</p>
              </div>
            )}

            {analysisMutation.data && (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-6 pb-4">
                  {/* Overall Rating */}
                  <div className="text-center p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-yellow-400" />
                      <span className="text-lg font-bold">Overall Rating</span>
                    </div>
                    <div className="text-3xl font-bold text-purple-400">
                      {analysisMutation.data.overallRating}/10
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Nutrition Quality Score</p>
                    {analysisMutation.data.dataQuality && (
                      <div className="mt-3 p-2 bg-orange-500/10 border border-orange-500/20">
                        <div className="text-xs text-orange-300 mb-1">
                          Data Quality: {Math.round(analysisMutation.data.dataQuality.completenessScore)}%
                        </div>
                        <p className="text-xs text-orange-400">
                          {analysisMutation.data.dataQuality.reliabilityNote}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Macronutrient Analysis */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Macronutrient Status
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20">
                        <div className="text-xs text-blue-300 mb-1">Protein</div>
                        <div className="text-sm font-medium text-blue-400">
                          {analysisMutation.data.macronutrientAnalysis.proteinStatus}
                        </div>
                      </div>
                      <div className="p-3 bg-green-500/10 border border-green-500/20">
                        <div className="text-xs text-green-300 mb-1">Carbs</div>
                        <div className="text-sm font-medium text-green-400">
                          {analysisMutation.data.macronutrientAnalysis.carbStatus}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Micronutrient Analysis */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Micronutrient Analysis
                    </h4>
                    <div className="space-y-2">
                      {analysisMutation.data.micronutrientAnalysis?.slice(0, 6).map((nutrient: MicronutrientAnalysis, index: number) => (
                        <div key={index} className="p-3 bg-muted/50 border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(nutrient.status)}
                              <span className="font-medium text-sm">{nutrient.nutrient}</span>
                            </div>
                            <Badge 
                              variant={nutrient.status === 'adequate' ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              {nutrient.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Current: {nutrient.currentIntake}{nutrient.unit} | 
                            RDA: {nutrient.recommendedIntake}{nutrient.unit}
                          </div>
                          <p className="text-xs mt-1">{nutrient.healthImpact}</p>
                          {nutrient.foodSources && (
                            <div className="mt-2">
                              <span className="text-xs font-medium">Food Sources: </span>
                              <span className="text-xs text-green-400">
                                {nutrient.foodSources.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RDA Comparison */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      RDA Comparison
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-green-500/10 border border-green-500/20">
                        <div className="text-sm font-bold text-green-400">
                          {analysisMutation.data.rdaComparison.meetsRDA?.length || 0}
                        </div>
                        <div className="text-xs text-green-300">Meets RDA</div>
                      </div>
                      <div className="text-center p-3 bg-red-500/10 border border-red-500/20">
                        <div className="text-sm font-bold text-red-400">
                          {analysisMutation.data.rdaComparison.belowRDA?.length || 0}
                        </div>
                        <div className="text-xs text-red-300">Below RDA</div>
                      </div>
                      <div className="text-center p-3 bg-orange-500/10 border border-orange-500/20">
                        <div className="text-sm font-bold text-orange-400">
                          {analysisMutation.data.rdaComparison.exceedsRDA?.length || 0}
                        </div>
                        <div className="text-xs text-orange-300">Exceeds RDA</div>
                      </div>
                    </div>
                  </div>

                  {/* Personalized Insights */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Personalized Insights
                    </h4>
                    {analysisMutation.data.personalizedInsights?.map((insight: NutritionInsight, index: number) => (
                      <div key={index} className="p-3 border-l-4 border-l-purple-500 bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{insight.category}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(insight.priority)}`}
                          >
                            {insight.priority}
                          </Badge>
                        </div>
                        <p className="text-xs mb-2">{insight.insight}</p>
                        <div className="space-y-1">
                          {insight.actionItems?.map((action, actionIndex) => (
                            <div key={actionIndex} className="text-xs text-purple-400">
                              • {action}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Supplementation Advice */}
                  {analysisMutation.data.supplementationAdvice?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Supplementation Recommendations
                      </h4>
                      <div className="space-y-2">
                        {analysisMutation.data.supplementationAdvice.map((advice: string, index: number) => (
                          <div key={index} className="p-3 bg-blue-500/10 border border-blue-500/20">
                            <p className="text-xs text-blue-300">{advice}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Data Quality Recommendations */}
                  {analysisMutation.data.dataQuality?.recommendedActions?.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
                      <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4" />
                        Data Quality Improvements
                      </h4>
                      <div className="space-y-1">
                        {analysisMutation.data.dataQuality.recommendedActions.map((action: string, index: number) => (
                          <div key={index} className="text-xs text-orange-400">
                            • {action}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  <div className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
                    <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                      <ShoppingCart className="h-4 w-4" />
                      Recommended Next Steps
                    </h4>
                    <div className="space-y-1">
                      {analysisMutation.data.nextSteps?.map((step: string, index: number) => (
                        <div key={index} className="text-xs text-green-400">
                          {index + 1}. {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}