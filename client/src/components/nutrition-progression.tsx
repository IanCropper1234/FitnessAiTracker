import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, Calendar, Activity, Target } from "lucide-react";
import { useTranslation } from "react-i18next";

interface NutritionProgressionProps {
  userId: number;
}

interface ProgressData {
  date: string;
  weight?: number;
  bodyFat?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function NutritionProgression({ userId }: NutritionProgressionProps) {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [chartType, setChartType] = useState<'weight' | 'bodyFat' | 'calories' | 'macros'>('weight');

  // Calculate date range
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch progression data
  const { data: progressionData = [], isLoading } = useQuery<ProgressData[]>({
    queryKey: ['/api/nutrition/progression', userId, timeRange],
    queryFn: async () => {
      const response = await fetch(
        `/api/nutrition/progression/${userId}?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      );
      const data = await response.json();
      // Ensure we always return an array
      return Array.isArray(data) ? data : [];
    }
  });

  // Fetch body metrics for weight/body fat trends
  const { data: bodyMetrics = [] } = useQuery({
    queryKey: ['/api/body-metrics', userId, timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/body-metrics/${userId}`);
      const allMetrics = await response.json();
      
      // Ensure allMetrics is an array before filtering
      if (!Array.isArray(allMetrics)) {
        console.warn('Body metrics API returned non-array data:', allMetrics);
        return [];
      }
      
      // Filter by date range and sort by date
      const filteredMetrics = allMetrics
        .filter((metric: any) => {
          const metricDate = new Date(metric.date);
          return metricDate >= startDate && metricDate <= endDate;
        })
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      console.log(`Filtered ${filteredMetrics.length} metrics from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      return filteredMetrics;
    }
  });

  const renderChart = () => {
    if (!progressionData || progressionData.length === 0) {
      return (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No data available for the selected time range</p>
          <p className="text-sm">Start logging your nutrition to see trends</p>
        </div>
      );
    }

    switch (chartType) {
      case 'weight':
        const weightData = bodyMetrics?.map((metric: any) => ({
          date: new Date(metric.date).toLocaleDateString(),
          weight: metric.weight,
        })) || [];

        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bodyFat':
        const bodyFatData = bodyMetrics?.filter((metric: any) => metric.bodyFatPercentage).map((metric: any) => ({
          date: new Date(metric.date).toLocaleDateString(),
          bodyFat: metric.bodyFatPercentage,
        })) || [];

        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bodyFatData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="bodyFat" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'calories':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="calories" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'macros':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={progressionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Bar dataKey="protein" fill="#10B981" name="Protein" />
              <Bar dataKey="carbs" fill="#F59E0B" name="Carbs" />
              <Bar dataKey="fat" fill="#8B5CF6" name="Fat" />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const getProgressSummary = () => {
    if (!progressionData || progressionData.length < 2) return null;

    const latest = progressionData[progressionData.length - 1];
    const previous = progressionData[0];

    // Sort body metrics by date and get latest entry per date to avoid duplicates
    const sortedBodyMetrics = bodyMetrics ? [...bodyMetrics]
      .sort((a, b) => {
        const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        // If same date, sort by createdAt to get latest entry
        return dateComparison === 0 ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() : dateComparison;
      })
      .filter((metric, index, array) => {
        // Keep only the latest entry for each date
        const nextIndex = array.findIndex((m, i) => i > index && 
          new Date(m.date).toDateString() === new Date(metric.date).toDateString()
        );
        return nextIndex === -1; // Keep if no later entry exists for same date
      }) : [];

    const weightChange = sortedBodyMetrics && sortedBodyMetrics.length >= 2 
      ? parseFloat(sortedBodyMetrics[sortedBodyMetrics.length - 1].weight) - parseFloat(sortedBodyMetrics[0].weight)
      : 0;

    const calorieChange = latest.calories - previous.calories;

    return {
      weightChange,
      calorieChange,
      avgCalories: progressionData.reduce((sum, day) => sum + day.calories, 0) / progressionData.length,
      avgProtein: progressionData.reduce((sum, day) => sum + day.protein, 0) / progressionData.length,
    };
  };

  const summary = getProgressSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Nutrition Progression
          </CardTitle>
          <CardDescription>
            Track your weight, body fat, calories, and macro trends over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Time Range:</label>
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="90d">90 Days</SelectItem>
                  <SelectItem value="1y">1 Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Chart Type:</label>
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight">Weight</SelectItem>
                  <SelectItem value="bodyFat">Body Fat %</SelectItem>
                  <SelectItem value="calories">Calories</SelectItem>
                  <SelectItem value="macros">Macros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Weight Change
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.weightChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {summary.weightChange > 0 ? '+' : ''}{summary.weightChange.toFixed(1)} kg
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Last {timeRange}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Calories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black dark:text-white">
                {Math.round(summary.avgCalories)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Daily average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Protein
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black dark:text-white">
                {Math.round(summary.avgProtein)}g
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Daily average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Calorie Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.calorieChange >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {summary.calorieChange > 0 ? '+' : ''}{Math.round(summary.calorieChange)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                vs start of period
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {chartType === 'weight' && 'Weight Trend'}
            {chartType === 'bodyFat' && 'Body Fat Percentage Trend'}
            {chartType === 'calories' && 'Daily Calorie Intake'}
            {chartType === 'macros' && 'Daily Macronutrient Intake'}
          </CardTitle>
          <CardDescription>
            {chartType === 'weight' && 'Track your weight changes over time'}
            {chartType === 'bodyFat' && 'Monitor body composition progress'}
            {chartType === 'calories' && 'Monitor daily calorie consumption'}
            {chartType === 'macros' && 'Track protein, carbs, and fat intake'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>
    </div>
  );
}