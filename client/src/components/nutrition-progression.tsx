import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, Calendar, Activity, Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UnitConverter } from "@shared/utils/unit-conversion";
import { convertWeight, getUserWeightUnit } from "@shared/utils/metric-conversion";

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
  const { data: progressionData, isLoading } = useQuery<ProgressData[]>({
    queryKey: ['/api/nutrition/progression', userId, timeRange],
    queryFn: async () => {
      const response = await fetch(
        `/api/nutrition/progression/${userId}?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      );
      return response.json();
    }
  });

  // Fetch body metrics for weight/body fat trends
  const { data: bodyMetrics } = useQuery({
    queryKey: ['/api/body-metrics', userId, timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/body-metrics/${userId}`);
      const allMetrics = await response.json();
      // Filter by date range and sort by date
      const filteredMetrics = allMetrics
        .filter((metric: any) => {
          const metricDate = new Date(metric.date);
          return metricDate >= startDate && metricDate <= endDate;
        })
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      return filteredMetrics;
    }
  });

  // Get user profile for unit preferences
  const { data: userProfile } = useQuery({
    queryKey: ['/api/user/profile', userId],
    queryFn: async () => {
      const response = await fetch(`/api/user/profile/${userId}`);
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Get user's preferred weight unit using UnitConverter
  const getUserPreferredWeightUnit = () => {
    return UnitConverter.getUserWeightUnit(userProfile?.userProfile, bodyMetrics);
  };

  const renderDataTable = () => {
    switch (chartType) {
      case 'weight':
        if (!bodyMetrics || bodyMetrics.length === 0) {
          return (
            <div className="text-center py-6 text-gray-600 dark:text-gray-400">
              <p className="text-sm">No weight entries for the selected time range</p>
            </div>
          );
        }
        
        const preferredUnit = getUserPreferredWeightUnit();
        const weightTableData = bodyMetrics?.map((metric: any) => {
          let weight = parseFloat(metric.weight);
          const metricUnit = metric.unit === 'imperial' ? 'lbs' : 'kg';
          
          if (metricUnit !== preferredUnit) {
            weight = convertWeight(weight, metricUnit, preferredUnit);
          }
          
          return {
            date: new Date(metric.date).toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: '2-digit',
              year: '2-digit'
            }),
            weight: weight.toFixed(1),
            unit: preferredUnit,
            bodyFat: metric.bodyFatPercentage ? `${metric.bodyFatPercentage}%` : '-'
          };
        }) || [];

        return (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-1.5 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="text-left py-1.5 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Weight</th>
                <th className="text-left py-1.5 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Body Fat</th>
              </tr>
            </thead>
            <tbody>
              {weightTableData.map((entry: any, index: number) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="py-1.5 px-1 text-gray-900 dark:text-gray-100 text-xs">{entry.date}</td>
                  <td className="py-1.5 px-1 text-blue-600 font-medium text-xs">{entry.weight} {entry.unit}</td>
                  <td className="py-1.5 px-1 text-gray-600 dark:text-gray-400 text-xs">{entry.bodyFat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'bodyFat':
        if (!bodyMetrics || bodyMetrics.length === 0) {
          return (
            <div className="text-center py-6 text-gray-600 dark:text-gray-400">
              <p className="text-sm">No body fat entries for the selected time range</p>
            </div>
          );
        }

        const bodyFatTableData = bodyMetrics?.filter((metric: any) => metric.bodyFatPercentage).map((metric: any) => ({
          date: new Date(metric.date).toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: '2-digit',
            year: '2-digit'
          }),
          bodyFat: metric.bodyFatPercentage
        })) || [];

        return (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-1.5 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="text-left py-1.5 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Body Fat %</th>
              </tr>
            </thead>
            <tbody>
              {bodyFatTableData.map((entry: any, index: number) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="py-1.5 px-1 text-gray-900 dark:text-gray-100 text-xs">{entry.date}</td>
                  <td className="py-1.5 px-1 text-orange-600 font-medium text-xs">{entry.bodyFat}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'calories':
        if (!progressionData || progressionData.length === 0) {
          return (
            <div className="text-center py-6 text-gray-600 dark:text-gray-400">
              <p className="text-sm">No calorie entries for the selected time range</p>
            </div>
          );
        }

        // The backend API already filters by date range, so progressionData should contain only relevant entries
        
        return (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-1.5 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="text-left py-1.5 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Calories</th>
                <th className="text-left py-1.5 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Protein</th>
              </tr>
            </thead>
            <tbody>
              {progressionData.map((entry: any, index: number) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="py-1.5 px-1 text-gray-900 dark:text-gray-100 text-xs">
                    {new Date(entry.date).toLocaleDateString('en-GB', { 
                      day: '2-digit', 
                      month: '2-digit',
                      year: '2-digit'
                    })}
                  </td>
                  <td className="py-1.5 px-1 text-blue-600 font-medium text-xs">{Math.round(entry.calories)}</td>
                  <td className="py-1.5 px-1 text-orange-600 font-medium text-xs">{Math.round(entry.protein)}g</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'macros':
        if (!progressionData || progressionData.length === 0) {
          return (
            <div className="text-center py-6 text-gray-600 dark:text-gray-400">
              <p className="text-sm">No macro entries for the selected time range</p>
            </div>
          );
        }

        // The backend API already filters by date range, so progressionData should contain only relevant entries
        
        return (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-1.5 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="text-left py-1.5 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Protein</th>
                <th className="text-left py-1.5 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Carbs</th>
                <th className="text-left py-1.5 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Fat</th>
              </tr>
            </thead>
            <tbody>
              {progressionData.map((entry: any, index: number) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="py-1.5 px-1 text-gray-900 dark:text-gray-100 text-xs">
                    {new Date(entry.date).toLocaleDateString('en-GB', { 
                      day: '2-digit', 
                      month: '2-digit',
                      year: '2-digit'
                    })}
                  </td>
                  <td className="py-1.5 px-1 text-blue-600 font-medium text-xs">{Math.round(entry.protein)}g</td>
                  <td className="py-1.5 px-1 text-green-600 font-medium text-xs">{Math.round(entry.carbs)}g</td>
                  <td className="py-1.5 px-1 text-yellow-600 font-medium text-xs">{Math.round(entry.fat)}g</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      default:
        return (
          <div className="text-center py-6 text-gray-600 dark:text-gray-400">
            <p className="text-sm">No data available for the selected time range</p>
          </div>
        );
    }
  };

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
        const preferredUnit = getUserPreferredWeightUnit();
        const weightData = bodyMetrics?.map((metric: any) => {
          let weight = parseFloat(metric.weight);
          // Convert weight to user's preferred unit
          const metricUnit = metric.unit === 'imperial' ? 'lbs' : 'kg';
          const targetUnit = preferredUnit;
          
          if (metricUnit !== targetUnit) {
            weight = convertWeight(weight, metricUnit, targetUnit);
          }
          return {
            date: new Date(metric.date).toLocaleDateString(),
            weight: weight,
            originalWeight: metric.weight,
            originalUnit: metric.unit
          };
        }) || [];

        // Calculate dynamic Y-axis range for better weight visualization
        const weights = weightData.map((d: any) => d.weight);
        const minWeight = Math.min(...weights);
        const maxWeight = Math.max(...weights);
        const weightRange = maxWeight - minWeight;
        const padding = Math.max(weightRange * 0.2, 1); // 20% padding or minimum 1 unit
        const yAxisMin = Math.max(0, minWeight - padding);
        const yAxisMax = maxWeight + padding;

        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="2 2" stroke="#E5E7EB" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[yAxisMin, yAxisMax]}
                tickFormatter={(value) => `${value.toFixed(1)}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #2563EB',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px',
                  color: '#2563EB'
                }}
                labelStyle={{
                  color: '#2563EB',
                  fontWeight: '500'
                }}
                formatter={(value: any) => [
                  `${value.toFixed(1)} ${getUserPreferredWeightUnit()}`, 
                  'Weight'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#2563EB" 
                strokeWidth={3}
                dot={{ fill: '#2563EB', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: '#2563EB' }}
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
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={bodyFatData}>
              <CartesianGrid strokeDasharray="2 2" stroke="#E5E7EB" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px'
                }}
                formatter={(value: any) => [`${value}%`, 'Body Fat']}
              />
              <Line 
                type="monotone" 
                dataKey="bodyFat" 
                stroke="#059669" 
                strokeWidth={3}
                dot={{ fill: '#059669', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: '#059669' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'calories':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={progressionData}>
              <CartesianGrid strokeDasharray="2 2" stroke="#E5E7EB" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px'
                }}
                formatter={(value: any) => [`${value} cal`, 'Calories']}
              />
              <Line 
                type="monotone" 
                dataKey="calories" 
                stroke="#EA580C" 
                strokeWidth={3}
                dot={{ fill: '#EA580C', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: '#EA580C' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'macros':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={progressionData} barCategoryGap="10%">
              <CartesianGrid strokeDasharray="2 2" stroke="#E5E7EB" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px'
                }}
                formatter={(value: any, name: any) => [`${value}g`, name]}
              />
              <Bar dataKey="protein" fill="#059669" name="Protein" radius={[2, 2, 0, 0]} />
              <Bar dataKey="carbs" fill="#EA580C" name="Carbs" radius={[2, 2, 0, 0]} />
              <Bar dataKey="fat" fill="#7C3AED" name="Fat" radius={[2, 2, 0, 0]} />
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

    // Calculate weight change with unit conversion
    let weightChange = 0;
    if (sortedBodyMetrics && sortedBodyMetrics.length >= 2) {
      const preferredUnit = getUserPreferredWeightUnit();
      const latestMetric = sortedBodyMetrics[sortedBodyMetrics.length - 1];
      const earliestMetric = sortedBodyMetrics[0];
      
      let latestWeight = parseFloat(latestMetric.weight);
      let earliestWeight = parseFloat(earliestMetric.weight);
      
      // Convert to preferred unit if needed
      const latestMetricUnit = latestMetric.unit === 'imperial' ? 'lbs' : 'kg';
      const earliestMetricUnit = earliestMetric.unit === 'imperial' ? 'lbs' : 'kg';
      const targetUnit = preferredUnit;
      
      if (latestMetricUnit !== targetUnit) {
        latestWeight = convertWeight(latestWeight, latestMetricUnit, targetUnit);
      }
      if (earliestMetricUnit !== targetUnit) {
        earliestWeight = convertWeight(earliestWeight, earliestMetricUnit, targetUnit);
      }
      
      weightChange = latestWeight - earliestWeight;
    }

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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-pulse"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-32 animate-pulse"></div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-3 min-w-max">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 min-w-[120px] animate-pulse">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 mb-2"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
          <div className="h-[240px] bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Ultra-Compact Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Progress</h2>
        </div>
        
        {/* Compact Pill Controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-0.5">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2 py-0.5 text-xs font-medium rounded-full transition-all ${
                  timeRange === range 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-0.5">
            {([
              { key: 'weight', label: 'Weight' },
              { key: 'bodyFat', label: 'Fat%' },
              { key: 'calories', label: 'Cals' },
              { key: 'macros', label: 'Macros' }
            ] as const).map((chart) => (
              <button
                key={chart.key}
                onClick={() => setChartType(chart.key)}
                className={`px-2 py-0.5 text-xs font-medium rounded-full transition-all ${
                  chartType === chart.key 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {chart.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* iOS-Optimized Metrics Grid */}
      {summary && (
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-1.5 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Weight</div>
            <div className={`text-sm font-bold ${summary.weightChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.weightChange > 0 ? '+' : ''}{Math.abs(summary.weightChange).toFixed(1)}
            </div>
            <div className="text-xs text-gray-400">{getUserPreferredWeightUnit()}</div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-1.5 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Avg Cal</div>
            <div className="text-sm font-bold text-blue-600">
              {Math.round(summary.avgCalories)}
            </div>
            <div className="text-xs text-gray-400">per day</div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-1.5 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Protein</div>
            <div className="text-sm font-bold text-orange-600">
              {Math.round(summary.avgProtein)}g
            </div>
            <div className="text-xs text-gray-400">per day</div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-1.5 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Trend</div>
            <div className={`text-sm font-bold ${summary.calorieChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.calorieChange > 0 ? '+' : ''}{Math.round(summary.calorieChange)}
            </div>
            <div className="text-xs text-gray-400">vs start</div>
          </div>
        </div>
      )}
      {/* Compact Chart Container */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-2 mb-3">
        <div className="mb-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">
            {chartType === 'weight' && 'Weight Trend'}
            {chartType === 'bodyFat' && 'Body Fat %'}
            {chartType === 'calories' && 'Daily Calories'}
            {chartType === 'macros' && 'Macronutrients'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {chartType === 'weight' && `Track changes over ${timeRange}`}
            {chartType === 'bodyFat' && `Body composition ${timeRange}`}
            {chartType === 'calories' && `Daily intake ${timeRange}`}
            {chartType === 'macros' && `Protein, carbs, fat ${timeRange}`}
          </p>
        </div>
        
        <div className="w-full h-[180px]">
          {renderChart()}
        </div>
      </div>

      {/* Data Table Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
        <div className="mb-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">
            Data Entries
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {chartType === 'weight' && `Weight entries over ${timeRange}`}
            {chartType === 'bodyFat' && `Body fat entries over ${timeRange}`}
            {chartType === 'calories' && `Daily calories over ${timeRange}`}
            {chartType === 'macros' && `Macro breakdown over ${timeRange}`}
          </p>
        </div>
        
        <div className="max-h-64 overflow-y-auto -mx-2 px-2">
          {renderDataTable()}
        </div>
      </div>
    </div>
  );
}