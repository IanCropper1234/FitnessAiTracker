import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/language-provider";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download, 
  Target, 
  Activity,
  Scale,
  Zap,
  Clock,
  Award
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReportsPageProps {
  userId: number;
}

export function ReportsPage({ userId }: ReportsPageProps) {
  const { t } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [reportType, setReportType] = useState("overview");

  // Fetch comprehensive analytics data
  const { data: comprehensiveAnalytics, isLoading } = useQuery({
    queryKey: ['/api/analytics/comprehensive', userId, selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/comprehensive/${userId}?days=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    enabled: !!userId
  });

  // Fetch individual analytics for detailed views
  const { data: nutritionAnalytics } = useQuery({
    queryKey: ['/api/analytics/nutrition', userId, selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/nutrition/${userId}?days=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch nutrition analytics');
      return response.json();
    },
    enabled: !!userId && reportType === 'nutrition'
  });

  const { data: trainingAnalytics } = useQuery({
    queryKey: ['/api/analytics/training', userId, selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/training/${userId}?days=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch training analytics');
      return response.json();
    },
    enabled: !!userId && reportType === 'training'
  });

  const { data: bodyProgressAnalytics } = useQuery({
    queryKey: ['/api/analytics/body-progress', userId, selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/body-progress/${userId}?days=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch body progress analytics');
      return response.json();
    },
    enabled: !!userId && reportType === 'progress'
  });

  const { data: feedbackAnalytics } = useQuery({
    queryKey: ['/api/analytics/feedback', userId, selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/feedback/${userId}?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Failed to fetch feedback analytics');
      return response.json();
    },
    enabled: !!userId && reportType === 'progress'
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-black dark:border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-body-sm text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-20">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-display text-black dark:text-white">
              {t("reports")}
            </h1>
            <p className="text-body-sm text-gray-600 dark:text-gray-400">
              Advanced analytics and progress insights
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Period and Report Type Selectors */}
        <div className="flex gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-40">
              <BarChart3 className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="nutrition">Nutrition Focus</SelectItem>
              <SelectItem value="training">Training Focus</SelectItem>
              <SelectItem value="progress">Progress Analysis</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-4">
        <Tabs value={reportType} onValueChange={setReportType} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="text-caption">Overview</TabsTrigger>
            <TabsTrigger value="nutrition" className="text-caption">Nutrition</TabsTrigger>
            <TabsTrigger value="training" className="text-caption">Training</TabsTrigger>
            <TabsTrigger value="progress" className="text-caption">Progress</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Average Daily Calories */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Target className="w-4 h-4 mr-2 text-green-600" />
                    Avg Daily Calories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{comprehensiveAnalytics?.overview?.averageCaloriesPerDay || 0}</div>
                  <Badge variant="default" className="text-xs">
                    {comprehensiveAnalytics?.nutrition?.totalDays || 0} days tracked
                  </Badge>
                </CardContent>
              </Card>

              {/* Training Volume */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-blue-600" />
                    Training Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{comprehensiveAnalytics?.training?.summary?.totalSessions || 0}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {comprehensiveAnalytics?.overview?.averageSessionsPerWeek || 0} per week
                  </p>
                </CardContent>
              </Card>

              {/* Body Progress */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Scale className="w-4 h-4 mr-2 text-purple-600" />
                    Weight Change
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {comprehensiveAnalytics?.overview?.weightChange ? 
                      `${comprehensiveAnalytics.overview.weightChange > 0 ? '+' : ''}${comprehensiveAnalytics.overview.weightChange}kg` : 
                      "No data"}
                  </div>
                  {comprehensiveAnalytics?.bodyProgress?.progress && (
                    <Badge variant={comprehensiveAnalytics.bodyProgress.progress.trend === 'loss' ? "default" : "secondary"} className="text-xs">
                      {comprehensiveAnalytics.bodyProgress.progress.trend === 'gain' ? 'Weight Gain' : 
                       comprehensiveAnalytics.bodyProgress.progress.trend === 'loss' ? 'Weight Loss' : 'Maintained'}
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Recovery Score */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-orange-600" />
                    Recovery Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{comprehensiveAnalytics?.overview?.recoveryScore || 0}/10</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Based on feedback data
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Weekly Summary
                </CardTitle>
                <CardDescription>
                  Your performance overview for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-sm font-medium">Total Nutrition Logs</span>
                    <span className="text-sm">{comprehensiveAnalytics?.overview?.totalNutritionLogs || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-sm font-medium">Training Sessions</span>
                    <span className="text-sm">{comprehensiveAnalytics?.overview?.totalTrainingSessions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-sm font-medium">Body Measurements</span>
                    <span className="text-sm">{comprehensiveAnalytics?.overview?.totalBodyMetrics || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-sm font-medium">Feedback Entries</span>
                    <span className="text-sm">{comprehensiveAnalytics?.overview?.totalFeedbackEntries || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Calories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {nutritionAnalytics?.summary?.totalCalories?.toFixed(0) || comprehensiveAnalytics?.nutrition?.summary?.totalCalories?.toFixed(0) || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Avg: {nutritionAnalytics?.averages?.calories?.toFixed(0) || comprehensiveAnalytics?.nutrition?.averages?.calories?.toFixed(0) || 0}/day
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Protein</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {nutritionAnalytics?.summary?.totalProtein?.toFixed(0) || comprehensiveAnalytics?.nutrition?.summary?.totalProtein?.toFixed(0) || 0}g
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Avg: {nutritionAnalytics?.averages?.protein?.toFixed(0) || comprehensiveAnalytics?.nutrition?.averages?.protein?.toFixed(0) || 0}g/day
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Carbs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {nutritionAnalytics?.summary?.totalCarbs?.toFixed(0) || comprehensiveAnalytics?.nutrition?.summary?.totalCarbs?.toFixed(0) || 0}g
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Avg: {nutritionAnalytics?.averages?.carbs?.toFixed(0) || comprehensiveAnalytics?.nutrition?.averages?.carbs?.toFixed(0) || 0}g/day
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Fat</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {nutritionAnalytics?.summary?.totalFat?.toFixed(0) || comprehensiveAnalytics?.nutrition?.summary?.totalFat?.toFixed(0) || 0}g
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Avg: {nutritionAnalytics?.averages?.fat?.toFixed(0) || comprehensiveAnalytics?.nutrition?.averages?.fat?.toFixed(0) || 0}g/day
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Nutrition Summary</CardTitle>
                <CardDescription>Period overview for the last {selectedPeriod} days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-sm font-medium">Days with logs</span>
                    <span className="text-sm">{nutritionAnalytics?.totalDays || comprehensiveAnalytics?.nutrition?.totalDays || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-sm font-medium">Total food entries</span>
                    <span className="text-sm">{nutritionAnalytics?.totalLogs || comprehensiveAnalytics?.nutrition?.totalLogs || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {trainingAnalytics?.summary?.totalSessions || comprehensiveAnalytics?.training?.summary?.totalSessions || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Completed workouts</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {trainingAnalytics?.summary?.totalVolume?.toFixed(0) || comprehensiveAnalytics?.training?.summary?.totalVolume?.toFixed(0) || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Sets × reps × weight</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {trainingAnalytics?.summary?.totalDuration?.toFixed(0) || comprehensiveAnalytics?.training?.summary?.totalDuration?.toFixed(0) || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Minutes trained</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {trainingAnalytics?.summary?.averageSessionDuration?.toFixed(0) || comprehensiveAnalytics?.training?.summary?.averageSessionDuration?.toFixed(0) || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Minutes per session</div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Training Summary</CardTitle>
                <CardDescription>Performance overview for the last {selectedPeriod} days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-sm font-medium">Average weekly volume</span>
                    <span className="text-sm">{trainingAnalytics?.summary?.averageWeeklyVolume?.toFixed(0) || comprehensiveAnalytics?.training?.summary?.averageWeeklyVolume?.toFixed(0) || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-sm font-medium">Sessions per week</span>
                    <span className="text-sm">{comprehensiveAnalytics?.overview?.averageSessionsPerWeek || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4">
            {comprehensiveAnalytics?.bodyProgress?.data?.length > 0 || comprehensiveAnalytics?.feedback?.data?.length > 0 ? (
              <div className="space-y-4">
                {/* Body Progress Cards */}
                {comprehensiveAnalytics?.bodyProgress?.progress && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Current Weight</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                          {comprehensiveAnalytics.bodyProgress.summary.currentWeight?.toFixed(1) || 0}kg
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {comprehensiveAnalytics.bodyProgress.summary.totalEntries} measurements
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Weight Change</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                          {comprehensiveAnalytics.bodyProgress.progress.weightChange > 0 ? '+' : ''}
                          {comprehensiveAnalytics.bodyProgress.progress.weightChange}kg
                        </div>
                        <Badge variant={comprehensiveAnalytics.bodyProgress.progress.trend === 'loss' ? "default" : "secondary"} className="text-xs">
                          {comprehensiveAnalytics.bodyProgress.progress.trend === 'gain' ? 'Weight Gain' : 
                           comprehensiveAnalytics.bodyProgress.progress.trend === 'loss' ? 'Weight Loss' : 'Maintained'}
                        </Badge>
                      </CardContent>
                    </Card>
                    
                    {comprehensiveAnalytics.bodyProgress.summary.currentBodyFat && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Body Fat</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-orange-600">
                            {comprehensiveAnalytics.bodyProgress.summary.currentBodyFat?.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {comprehensiveAnalytics.bodyProgress.progress.bodyFatChange > 0 ? '+' : ''}
                            {comprehensiveAnalytics.bodyProgress.progress.bodyFatChange?.toFixed(1)}% change
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Auto-Regulation Feedback */}
                {comprehensiveAnalytics?.feedback?.averages && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Auto-Regulation Feedback</CardTitle>
                      <CardDescription>Average scores for the last {selectedPeriod} days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div className="text-lg font-bold text-green-600">
                            {comprehensiveAnalytics.feedback.averages.pumpQuality}/10
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Pump Quality</div>
                        </div>
                        
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">
                            {comprehensiveAnalytics.feedback.averages.energyLevel}/10
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Energy Level</div>
                        </div>
                        
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div className="text-lg font-bold text-purple-600">
                            {comprehensiveAnalytics.feedback.averages.sleepQuality}/10
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Sleep Quality</div>
                        </div>
                        
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div className="text-lg font-bold text-orange-600">
                            {comprehensiveAnalytics.feedback.summary.recoveryScore}/10
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Recovery Score</div>
                        </div>
                        
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div className="text-lg font-bold text-red-600">
                            {comprehensiveAnalytics.feedback.summary.fatigueScore}/10
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Fatigue Score</div>
                        </div>
                      </div>
                      
                      {comprehensiveAnalytics.feedback.trends && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <h4 className="text-sm font-medium mb-2">Recent Trends</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex justify-between">
                              <span>Pump Quality:</span>
                              <span className={comprehensiveAnalytics.feedback.trends.pumpQuality >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {comprehensiveAnalytics.feedback.trends.pumpQuality >= 0 ? '+' : ''}{comprehensiveAnalytics.feedback.trends.pumpQuality}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Energy Level:</span>
                              <span className={comprehensiveAnalytics.feedback.trends.energyLevel >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {comprehensiveAnalytics.feedback.trends.energyLevel >= 0 ? '+' : ''}{comprehensiveAnalytics.feedback.trends.energyLevel}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Sleep Quality:</span>
                              <span className={comprehensiveAnalytics.feedback.trends.sleepQuality >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {comprehensiveAnalytics.feedback.trends.sleepQuality >= 0 ? '+' : ''}{comprehensiveAnalytics.feedback.trends.sleepQuality}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Scale className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Progress Data</h3>
                <p className="text-gray-600 dark:text-gray-400">Start tracking your body metrics and providing feedback to see progress analytics</p>
              </div>
            )}
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}