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
  Award,
  ArrowLeft,
  Home
} from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

interface ReportsPageProps {
  userId: number;
}

export function ReportsPage({ userId }: ReportsPageProps) {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
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
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 p-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-display text-black dark:text-white">
                {t("reports")}
              </h1>
              <p className="text-body-sm text-gray-600 dark:text-gray-400">
                Advanced analytics and progress insights
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 p-0"
            >
              <Home className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Period and Report Type Selectors */}
        <div className="flex gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32 pl-[0px] pr-[0px]">
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
            <SelectTrigger className="w-40 text-left pl-[0px] pr-[0px] ml-[25px] mr-[25px] mt-[0px] mb-[0px] pt-[10px] pb-[10px]">
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

          {/* Overview Tab - Compact iOS Style with RP Integration */}
          <TabsContent value="overview" className="space-y-4">
            {/* RP Performance Score Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">RP Performance Score</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Renaissance Periodization Assessment</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {Math.round(((comprehensiveAnalytics?.overview?.recoveryScore || 0) + 
                                   (comprehensiveAnalytics?.nutrition?.adherencePercentage || 0) / 10 + 
                                   (comprehensiveAnalytics?.training?.consistency || 0) * 10) / 3)}%
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {comprehensiveAnalytics?.overview?.recoveryScore >= 7 ? 'Excellent' : 
                       comprehensiveAnalytics?.overview?.recoveryScore >= 5 ? 'Good' : 'Needs Work'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* iOS-Style Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Nutrition Adherence */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Nutrition</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Adherence</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{Math.round(comprehensiveAnalytics?.nutrition?.adherencePercentage || 0)}%</div>
                    <p className="text-xs text-gray-500 mt-1">{comprehensiveAnalytics?.nutrition?.totalDays || 0} days</p>
                  </div>
                </div>
              </Card>

              {/* Training Volume */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Training</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Volume</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{Math.round((comprehensiveAnalytics?.training?.summary?.totalVolume || 0) / 1000)}k</div>
                    <p className="text-xs text-gray-500 mt-1">{comprehensiveAnalytics?.training?.summary?.totalSessions || 0} sessions</p>
                  </div>
                </div>
              </Card>

              {/* Body Composition */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                      <Scale className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Body</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Change</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {comprehensiveAnalytics?.bodyProgress?.progress?.weightChange ? 
                        `${comprehensiveAnalytics.bodyProgress.progress.weightChange > 0 ? '+' : ''}${Math.round(comprehensiveAnalytics.bodyProgress.progress.weightChange * 10) / 10}kg` : 
                        "0kg"}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {comprehensiveAnalytics?.bodyProgress?.progress?.trend || 'stable'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Recovery Quality */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                      <Zap className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Recovery</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Quality</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{comprehensiveAnalytics?.overview?.recoveryScore || 0}/10</div>
                    <p className="text-xs text-gray-500 mt-1">avg score</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* RP Phase Analysis */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  RP Phase Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <span className="text-sm font-medium">Mesocycle Progress</span>
                  <Badge variant="outline">{comprehensiveAnalytics?.training?.summary?.totalSessions >= 12 ? 'Complete' : 'In Progress'}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                  <span className="text-sm font-medium">Nutrition Phase</span>
                  <Badge variant="outline">
                    {comprehensiveAnalytics?.bodyProgress?.progress?.weightChange < -0.5 ? 'Weight Loss' : 
                     comprehensiveAnalytics?.bodyProgress?.progress?.weightChange > 0.5 ? 'Weight Gain' : 'Maintenance'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <span className="text-sm font-medium">Volume Status</span>
                  <Badge variant="outline">
                    {comprehensiveAnalytics?.overview?.recoveryScore >= 7 ? 'Optimal' : 
                     comprehensiveAnalytics?.overview?.recoveryScore >= 5 ? 'Moderate' : 'Deload Needed'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition" className="space-y-4">
            {/* RP Nutrition Performance Card */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">Nutrition Performance</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">RP Diet Coach Assessment</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {Math.round(comprehensiveAnalytics?.nutrition?.adherencePercentage || 0)}%
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {(comprehensiveAnalytics?.nutrition?.adherencePercentage || 0) >= 85 ? 'Excellent' : 
                       (comprehensiveAnalytics?.nutrition?.adherencePercentage || 0) >= 70 ? 'Good' : 'Needs Work'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* iOS-Style Nutrition Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Calories */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Average</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Calories</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {Math.round(nutritionAnalytics?.averages?.calories || comprehensiveAnalytics?.nutrition?.averages?.calories || 0)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      per day average
                    </p>
                  </div>
                </div>
              </Card>

              {/* Total Protein */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Average</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Protein</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {Math.round(nutritionAnalytics?.averages?.protein || comprehensiveAnalytics?.nutrition?.averages?.protein || 0)}g
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      per day average
                    </p>
                  </div>
                </div>
              </Card>

              {/* Total Carbs */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Average</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Carbs</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {Math.round(nutritionAnalytics?.averages?.carbs || comprehensiveAnalytics?.nutrition?.averages?.carbs || 0)}g
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      per day average
                    </p>
                  </div>
                </div>
              </Card>

              {/* Total Fat */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Average</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Fat</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {Math.round(nutritionAnalytics?.averages?.fat || comprehensiveAnalytics?.nutrition?.averages?.fat || 0)}g
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      per day average
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* RP Nutrition Analysis */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  RP Nutrition Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                  <span className="text-sm font-medium">Days with logs</span>
                  <Badge variant="outline">{nutritionAnalytics?.totalDays || comprehensiveAnalytics?.nutrition?.totalDays || 0} days</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <span className="text-sm font-medium">Total food entries</span>
                  <Badge variant="outline">{nutritionAnalytics?.totalLogs || comprehensiveAnalytics?.nutrition?.totalLogs || 0} entries</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <span className="text-sm font-medium">Adherence Status</span>
                  <Badge variant="outline">
                    {(comprehensiveAnalytics?.nutrition?.adherencePercentage || 0) >= 85 ? 'On Track' : 
                     (comprehensiveAnalytics?.nutrition?.adherencePercentage || 0) >= 70 ? 'Close' : 'Adjust Goals'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-4">
            {/* RP Training Performance Card */}
            <Card className="bg-gradient-to-r from-purple-50 to-orange-50 dark:from-purple-950 dark:to-orange-950 border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300">Training Performance</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">RP Hypertrophy Assessment</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.round((comprehensiveAnalytics?.training?.consistency || 0) * 100)}%
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {(comprehensiveAnalytics?.training?.consistency || 0) >= 0.8 ? 'Excellent' : 
                       (comprehensiveAnalytics?.training?.consistency || 0) >= 0.6 ? 'Good' : 'Needs Work'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* iOS-Style Training Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Sessions */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                      <Activity className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Sessions</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {trainingAnalytics?.summary?.totalSessions || comprehensiveAnalytics?.training?.summary?.totalSessions || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">completed workouts</p>
                  </div>
                </div>
              </Card>

              {/* Total Volume */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Volume</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {Math.round((trainingAnalytics?.summary?.totalVolume || comprehensiveAnalytics?.training?.summary?.totalVolume || 0) / 1000)}k
                    </div>
                    <p className="text-xs text-gray-500 mt-1">sets × reps × weight</p>
                  </div>
                </div>
              </Card>

              {/* Total Duration */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Duration</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {Math.round(trainingAnalytics?.summary?.totalDuration || comprehensiveAnalytics?.training?.summary?.totalDuration || 0)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">minutes trained</p>
                  </div>
                </div>
              </Card>

              {/* Average Session */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Average</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Session</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {Math.round(trainingAnalytics?.summary?.averageSessionDuration || comprehensiveAnalytics?.training?.summary?.averageSessionDuration || 0)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">minutes per session</p>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* RP Training Analysis */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  RP Training Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <span className="text-sm font-medium">Average weekly volume</span>
                  <Badge variant="outline">{Math.round(trainingAnalytics?.summary?.averageWeeklyVolume || comprehensiveAnalytics?.training?.summary?.averageWeeklyVolume || 0)}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <span className="text-sm font-medium">Sessions per week</span>
                  <Badge variant="outline">{comprehensiveAnalytics?.overview?.averageSessionsPerWeek || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <span className="text-sm font-medium">Training Status</span>
                  <Badge variant="outline">
                    {(comprehensiveAnalytics?.training?.consistency || 0) >= 0.8 ? 'Consistent' : 
                     (comprehensiveAnalytics?.training?.consistency || 0) >= 0.6 ? 'Building' : 'Irregular'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4">
            {comprehensiveAnalytics?.bodyProgress?.data?.length > 0 || comprehensiveAnalytics?.feedback?.data?.length > 0 ? (
              <div className="space-y-4">
                {/* RP Progress Performance Card */}
                <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-300">Progress Performance</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Body Composition & Recovery</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                          {comprehensiveAnalytics?.overview?.recoveryScore || 0}/10
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {(comprehensiveAnalytics?.overview?.recoveryScore || 0) >= 7 ? 'Excellent' : 
                           (comprehensiveAnalytics?.overview?.recoveryScore || 0) >= 5 ? 'Good' : 'Needs Work'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* iOS-Style Progress Metrics Grid */}
                {comprehensiveAnalytics?.bodyProgress?.progress && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Current Weight */}
                    <Card className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <Scale className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Current</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Weight</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {Math.round((comprehensiveAnalytics.bodyProgress.summary.currentWeight || 0) * 10) / 10}kg
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {comprehensiveAnalytics.bodyProgress.summary.totalEntries} measurements
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Weight Change */}
                    <Card className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Weight</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Change</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {comprehensiveAnalytics.bodyProgress.progress.weightChange > 0 ? '+' : ''}
                            {Math.round(comprehensiveAnalytics.bodyProgress.progress.weightChange * 10) / 10}kg
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {comprehensiveAnalytics.bodyProgress.progress.trend === 'gain' ? 'gaining' : 
                             comprehensiveAnalytics.bodyProgress.progress.trend === 'loss' ? 'losing' : 'stable'}
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Recovery Score */}
                    <Card className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <Activity className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Recovery</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Score</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {comprehensiveAnalytics?.feedback?.summary?.recoveryScore || 0}/10
                          </div>
                          <p className="text-xs text-gray-500 mt-1">avg recovery</p>
                        </div>
                      </div>
                    </Card>

                    {/* Body Fat (if available) */}
                    {comprehensiveAnalytics.bodyProgress.summary.currentBodyFat ? (
                      <Card className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                              <Target className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Body</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Fat</p>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              {Math.round((comprehensiveAnalytics.bodyProgress.summary.currentBodyFat || 0) * 10) / 10}%
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {comprehensiveAnalytics.bodyProgress.progress.bodyFatChange > 0 ? '+' : ''}
                              {Math.round((comprehensiveAnalytics.bodyProgress.progress.bodyFatChange || 0) * 10) / 10}% change
                            </p>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <Card className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                              <Zap className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Fatigue</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Score</p>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              {comprehensiveAnalytics?.feedback?.summary?.fatigueScore || 0}/10
                            </div>
                            <p className="text-xs text-gray-500 mt-1">avg fatigue</p>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {/* Auto-Regulation Feedback */}
                {comprehensiveAnalytics?.feedback?.averages && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <Activity className="w-4 h-4 mr-2" />
                        RP Auto-Regulation Feedback
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                          <div className="text-lg font-bold text-green-600">
                            {comprehensiveAnalytics.feedback.averages.pumpQuality}/10
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Pump Quality</div>
                        </div>
                        
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">
                            {comprehensiveAnalytics.feedback.averages.energyLevel}/10
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Energy Level</div>
                        </div>
                        
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                          <div className="text-lg font-bold text-purple-600">
                            {comprehensiveAnalytics.feedback.averages.sleepQuality}/10
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Sleep Quality</div>
                        </div>
                        
                        <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                          <div className="text-lg font-bold text-orange-600">
                            {comprehensiveAnalytics.feedback.summary.recoveryScore}/10
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Recovery Score</div>
                        </div>
                        
                        <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
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