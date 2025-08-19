import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine } from "recharts";
import { TrendingUp, Calendar, Activity, Target, ArrowLeftRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UnitConverter } from "@shared/utils/unit-conversion";

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
  
  // Unit conversion state for Recent Entries display
  const [displayUnit, setDisplayUnit] = useState<'kg' | 'lbs'>('kg');
  
  // Pagination state for memory optimization
  const [currentPage, setCurrentPage] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const recordsPerPage = 20;

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
    queryKey: ['/api/nutrition/progression', timeRange],
    queryFn: async () => {
      const response = await fetch(
        `/api/nutrition/progression?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      );
      return response.json();
    }
  });

  // Fetch body metrics for weight/body fat trends
  const { data: bodyMetrics } = useQuery({
    queryKey: ['/api/body-metrics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/body-metrics`);
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
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      const response = await fetch(`/api/user/profile`);
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Get user's preferred weight unit using UnitConverter
  const getUserPreferredWeightUnit = () => {
    return UnitConverter.getUserWeightUnit(userProfile?.userProfile, bodyMetrics);
  };

  // Handle page change with smooth transition
  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage || isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Smooth transition effect
    setTimeout(() => {
      setCurrentPage(newPage);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
    }, 150);
  };

  // Reset pagination when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [timeRange, chartType]);

  // Generic pagination helper function
  const getPaginatedData = (data: any[], page: number, perPage: number) => {
    const total = data.length;
    const totalPages = Math.ceil(total / perPage);
    const start = (page - 1) * perPage;
    const paginated = data.slice(start, start + perPage);
    return { total, totalPages, start, paginated };
  };

  // Generic pagination controls component
  const PaginationControls = ({ totalPages }: { totalPages: number }) => (
    totalPages > 1 ? (
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || isTransitioning}
          className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white disabled:bg-gray-300 disabled:text-gray-500 hover:bg-blue-700 disabled:hover:bg-gray-300 transition-all duration-200"
        >
          &lt;
        </button>
        
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
          {currentPage}
        </span>
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isTransitioning}
          className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white disabled:bg-gray-300 disabled:text-gray-500 hover:bg-blue-700 disabled:hover:bg-gray-300 transition-all duration-200"
        >
          &gt;
        </button>
      </div>
    ) : null
  );

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
        
        const weightTableData = bodyMetrics?.map((metric: any) => {
          let weight = parseFloat(metric.weight);
          const metricUnit = metric.unit === 'imperial' ? 'lbs' : 'kg';
          
          // Convert to displayUnit instead of user's preferred unit
          if (metricUnit !== displayUnit) {
            weight = UnitConverter.convertWeightChange(weight, metricUnit, displayUnit);
          }
          
          return {
            date: new Date(metric.date).toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: '2-digit',
              year: '2-digit'
            }),
            weight: (weight && !isNaN(weight)) ? Number(weight).toFixed(1) : 'N/A',
            unit: displayUnit,
            bodyFat: metric.bodyFatPercentage ? `${metric.bodyFatPercentage}%` : '-'
          };
        }) || [];

        const weightPagination = getPaginatedData(weightTableData, currentPage, recordsPerPage);

        return (
          <div className="space-y-3">
            <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-50 scale-[0.98]' : 'opacity-100 scale-100'}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                    <th className="text-left py-2 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Weight</th>
                    <th className="text-left py-2 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Body Fat</th>
                  </tr>
                </thead>
                <tbody>
                  {weightPagination.paginated.map((entry: any, index: number) => (
                    <tr 
                      key={weightPagination.start + index} 
                      className={`border-b border-gray-100 dark:border-gray-800 last:border-0 transition-all duration-300 ease-out ${
                        isTransitioning 
                          ? 'opacity-0 translate-y-2' 
                          : 'opacity-100 translate-y-0'
                      }`}
                      style={{
                        transitionDelay: isTransitioning ? '0ms' : `${index * 30}ms`
                      }}
                    >
                      <td className="py-2 px-1 text-gray-900 dark:text-gray-100">{entry.date}</td>
                      <td className="py-2 px-1 text-blue-600 font-medium">{entry.weight} {entry.unit}</td>
                      <td className="py-2 px-1 text-gray-600 dark:text-gray-400">{entry.bodyFat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <PaginationControls totalPages={weightPagination.totalPages} />
          </div>
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

        const bodyFatPagination = getPaginatedData(bodyFatTableData, currentPage, recordsPerPage);

        return (
          <div className="space-y-3">
            <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-50 scale-[0.98]' : 'opacity-100 scale-100'}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                    <th className="text-left py-2 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Body Fat %</th>
                  </tr>
                </thead>
                <tbody>
                  {bodyFatPagination.paginated.map((entry: any, index: number) => (
                    <tr 
                      key={bodyFatPagination.start + index} 
                      className={`border-b border-gray-100 dark:border-gray-800 last:border-0 transition-all duration-300 ease-out ${
                        isTransitioning 
                          ? 'opacity-0 translate-y-2' 
                          : 'opacity-100 translate-y-0'
                      }`}
                      style={{
                        transitionDelay: isTransitioning ? '0ms' : `${index * 30}ms`
                      }}
                    >
                      <td className="py-2 px-1 text-gray-900 dark:text-gray-100">{entry.date}</td>
                      <td className="py-2 px-1 text-orange-600 font-medium">{entry.bodyFat}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <PaginationControls totalPages={bodyFatPagination.totalPages} />
          </div>
        );

      case 'calories':
        if (!progressionData || progressionData.length === 0) {
          return (
            <div className="text-center py-6 text-gray-600 dark:text-gray-400">
              <p className="text-sm">No calorie entries for the selected time range</p>
            </div>
          );
        }

        const caloriesPagination = getPaginatedData(progressionData, currentPage, recordsPerPage);
        
        return (
          <div className="space-y-3">
            <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-50 scale-[0.98]' : 'opacity-100 scale-100'}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                    <th className="text-left py-2 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Calories</th>
                    <th className="text-left py-2 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Protein</th>
                  </tr>
                </thead>
                <tbody>
                  {caloriesPagination.paginated.map((entry: any, index: number) => (
                    <tr 
                      key={caloriesPagination.start + index} 
                      className={`border-b border-gray-100 dark:border-gray-800 last:border-0 transition-all duration-300 ease-out ${
                        isTransitioning 
                          ? 'opacity-0 translate-y-2' 
                          : 'opacity-100 translate-y-0'
                      }`}
                      style={{
                        transitionDelay: isTransitioning ? '0ms' : `${index * 30}ms`
                      }}
                    >
                      <td className="py-2 px-1 text-gray-900 dark:text-gray-100">
                        {new Date(entry.date).toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: '2-digit',
                          year: '2-digit'
                        })}
                      </td>
                      <td className="py-2 px-1 text-blue-600 font-medium">{Math.round(entry.calories)}</td>
                      <td className="py-2 px-1 text-orange-600 font-medium">{Math.round(entry.protein)}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <PaginationControls totalPages={caloriesPagination.totalPages} />
          </div>
        );

      case 'macros':
        if (!progressionData || progressionData.length === 0) {
          return (
            <div className="text-center py-6 text-gray-600 dark:text-gray-400">
              <p className="text-sm">No macro entries for the selected time range</p>
            </div>
          );
        }

        const macrosPagination = getPaginatedData(progressionData, currentPage, recordsPerPage);
        
        return (
          <div className="space-y-3">
            <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-50 scale-[0.98]' : 'opacity-100 scale-100'}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                    <th className="text-left py-2 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Protein</th>
                    <th className="text-left py-2 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Carbs</th>
                    <th className="text-left py-2 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Fat</th>
                  </tr>
                </thead>
                <tbody>
                  {macrosPagination.paginated.map((entry: any, index: number) => (
                    <tr 
                      key={macrosPagination.start + index} 
                      className={`border-b border-gray-100 dark:border-gray-800 last:border-0 transition-all duration-300 ease-out ${
                        isTransitioning 
                          ? 'opacity-0 translate-y-2' 
                          : 'opacity-100 translate-y-0'
                      }`}
                      style={{
                        transitionDelay: isTransitioning ? '0ms' : `${index * 30}ms`
                      }}
                    >
                      <td className="py-2 px-1 text-gray-900 dark:text-gray-100">
                        {new Date(entry.date).toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: '2-digit',
                          year: '2-digit'
                        })}
                      </td>
                      <td className="py-2 px-1 text-blue-600 font-medium">{Math.round(entry.protein)}g</td>
                      <td className="py-2 px-1 text-green-600 font-medium">{Math.round(entry.carbs)}g</td>
                      <td className="py-2 px-1 text-yellow-600 font-medium">{Math.round(entry.fat)}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <PaginationControls totalPages={macrosPagination.totalPages} />
          </div>
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
            weight = UnitConverter.convertWeightChange(weight, metricUnit, targetUnit);
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
        
        // Calculate average weight for reference line
        const avgWeight = weights.length > 0 ? weights.reduce((sum: number, weight: number) => sum + weight, 0) / weights.length : 0;

        return (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: 'var(--gray-600)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[yAxisMin, yAxisMax]}
                tick={{ fontSize: 11, fill: 'var(--gray-600)' }}
                axisLine={false}
                tickLine={false}
                label={{ 
                  value: `Weight (${preferredUnit})`, 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: '11px' }
                }}
              />
              <Tooltip 
                labelClassName="text-xs"
                contentStyle={{ 
                  backgroundColor: 'var(--chart-tooltip-bg)',
                  border: '1px solid var(--chart-tooltip-border)',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                formatter={(value: any) => [`${Number(value).toFixed(1)} ${preferredUnit}`, 'Weight']}
              />
              <ReferenceLine 
                y={avgWeight} 
                stroke="#f59e0b" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ value: `Avg: ${avgWeight.toFixed(1)} ${preferredUnit}`, position: "right", fontSize: 11 }}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={{ fill: '#2563eb', r: 3 }}
                activeDot={{ r: 5, fill: '#2563eb' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bodyFat':
        const bodyFatData = bodyMetrics?.filter((metric: any) => metric.bodyFatPercentage).map((metric: any) => ({
          date: new Date(metric.date).toLocaleDateString(),
          bodyFat: parseFloat(metric.bodyFatPercentage)
        })) || [];

        // Calculate average body fat for reference line
        const avgBodyFat = bodyFatData.length > 0 
          ? bodyFatData.reduce((sum: number, data: any) => sum + data.bodyFat, 0) / bodyFatData.length 
          : 0;

        return (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={bodyFatData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: 'var(--gray-600)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--gray-600)' }}
                axisLine={false}
                tickLine={false}
                label={{ 
                  value: 'Body Fat %', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: '11px' }
                }}
              />
              <Tooltip 
                labelClassName="text-xs"
                contentStyle={{ 
                  backgroundColor: 'var(--chart-tooltip-bg)',
                  border: '1px solid var(--chart-tooltip-border)',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Body Fat']}
              />
              <ReferenceLine 
                y={avgBodyFat} 
                stroke="#f59e0b" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ value: `Avg: ${avgBodyFat.toFixed(1)}%`, position: "right", fontSize: 11 }}
              />
              <Line 
                type="monotone" 
                dataKey="bodyFat" 
                stroke="#ea580c" 
                strokeWidth={2}
                dot={{ fill: '#ea580c', r: 3 }}
                activeDot={{ r: 5, fill: '#ea580c' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'calories':
        // Calculate average calories for reference line
        const avgCals = progressionData && progressionData.length > 0 
          ? progressionData.reduce((sum, data) => sum + data.calories, 0) / progressionData.length 
          : 0;

        return (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={progressionData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: "var(--gray-600)" }}
                axisLine={false}
                tickLine={false}
                
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: '2-digit' 
                })}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--gray-600)" }}
                axisLine={false}
                tickLine={false}
                
                label={{ 
                  value: 'Calories', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: '11px' }
                }}
              />
              <Tooltip 
                labelClassName="text-xs"
                contentStyle={{ 
                  backgroundColor: 'var(--chart-tooltip-bg)',
                  border: '1px solid var(--chart-tooltip-border)',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString('en-GB')}
                formatter={(value: any) => [`${Math.round(value)}`, 'Calories']}
              />
              <ReferenceLine 
                y={avgCals} 
                stroke="#f59e0b" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ value: `Avg: ${Math.round(avgCals)} cal`, position: "right", fontSize: 11 }}
              />
              <Bar 
                dataKey="calories" 
                fill="#2563eb"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'macros':
        // Calculate average macros for reference lines
        const avgMacros = progressionData && progressionData.length > 0 ? {
          protein: progressionData.reduce((sum, data) => sum + data.protein, 0) / progressionData.length,
          carbs: progressionData.reduce((sum, data) => sum + data.carbs, 0) / progressionData.length,
          fat: progressionData.reduce((sum, data) => sum + data.fat, 0) / progressionData.length
        } : { protein: 0, carbs: 0, fat: 0 };

        return (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={progressionData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: "var(--gray-600)" }}
                axisLine={false}
                tickLine={false}
                
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: '2-digit' 
                })}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--gray-600)" }}
                axisLine={false}
                tickLine={false}
                
                label={{ 
                  value: 'Grams', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: '11px' }
                }}
              />
              <Tooltip 
                labelClassName="text-xs"
                contentStyle={{ 
                  backgroundColor: 'var(--chart-tooltip-bg)',
                  border: '1px solid var(--chart-tooltip-border)',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString('en-GB')}
              />
              <ReferenceLine 
                y={avgMacros.protein} 
                stroke="#2563eb" 
                strokeDasharray="3 3" 
                strokeWidth={1.5}
                label={{ value: `Avg P: ${Math.round(avgMacros.protein)}g`, position: "left", fontSize: 10 }}
              />
              <ReferenceLine 
                y={avgMacros.carbs} 
                stroke="#16a34a" 
                strokeDasharray="3 3" 
                strokeWidth={1.5}
                label={{ value: `Avg C: ${Math.round(avgMacros.carbs)}g`, position: "center", fontSize: 10 }}
              />
              <ReferenceLine 
                y={avgMacros.fat} 
                stroke="#ca8a04" 
                strokeDasharray="3 3" 
                strokeWidth={1.5}
                label={{ value: `Avg F: ${Math.round(avgMacros.fat)}g`, position: "right", fontSize: 10 }}
              />
              <Bar 
                dataKey="protein" 
                fill="#2563eb"
                radius={[1, 1, 0, 0]}
              />
              <Bar 
                dataKey="carbs" 
                fill="#16a34a"
                radius={[1, 1, 0, 0]}
              />
              <Bar 
                dataKey="fat" 
                fill="#ca8a04"
                radius={[1, 1, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  // Get data for the current chart type to calculate progress summary
  const getCombinedData = () => {
    if (chartType === 'weight' || chartType === 'bodyFat') {
      return bodyMetrics || [];
    }
    return progressionData || [];
  };

  const getProgressSummary = () => {
    // Always calculate both weight and nutrition data
    const weightData = bodyMetrics || [];
    const nutritionData = progressionData || [];
    
    let weightChange = 0;
    let avgCalories = 0;
    let avgProtein = 0;
    let calorieChange = 0;

    // Calculate weight change if we have weight data
    if (weightData && weightData.length > 0) {
      const sortedWeightData = [...weightData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const firstEntry = sortedWeightData[0];
      const lastEntry = sortedWeightData[sortedWeightData.length - 1];
      
      const preferredUnit = getUserPreferredWeightUnit();
      
      let firstWeight = parseFloat(firstEntry.weight);
      let lastWeight = parseFloat(lastEntry.weight);
      
      // Convert weights to preferred unit if necessary
      const firstUnit = firstEntry.unit === 'imperial' ? 'lbs' : 'kg';
      const lastUnit = lastEntry.unit === 'imperial' ? 'lbs' : 'kg';
      
      if (firstUnit !== preferredUnit) {
        firstWeight = UnitConverter.convertWeightChange(firstWeight, firstUnit, preferredUnit);
      }
      if (lastUnit !== preferredUnit) {
        lastWeight = UnitConverter.convertWeightChange(lastWeight, lastUnit, preferredUnit);
      }
      
      weightChange = lastWeight - firstWeight;
    }

    // Calculate nutrition data if we have nutrition data
    if (nutritionData && nutritionData.length > 0) {
      const sortedNutritionData = [...nutritionData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Calculate averages
      avgCalories = sortedNutritionData.reduce((sum, entry) => sum + entry.calories, 0) / sortedNutritionData.length;
      avgProtein = sortedNutritionData.reduce((sum, entry) => sum + entry.protein, 0) / sortedNutritionData.length;
      
      // Calculate recent trend (last 7 days vs previous 7 days)
      const recentData = sortedNutritionData.slice(-7);
      const previousData = sortedNutritionData.slice(-14, -7);
      
      if (previousData.length > 0 && recentData.length > 0) {
        const recentAvgCalories = recentData.reduce((sum, entry) => sum + entry.calories, 0) / recentData.length;
        const previousAvgCalories = previousData.reduce((sum, entry) => sum + entry.calories, 0) / previousData.length;
        calorieChange = recentAvgCalories - previousAvgCalories;
      }
    }

    return {
      weightChange,
      avgCalories,
      avgProtein,
      calorieChange
    };
  };

  const summary = getProgressSummary();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 dark:bg-gray-700  w-32 animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700  w-24 animate-pulse"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700  w-32 animate-pulse"></div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-3 min-w-max">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800  p-3 min-w-[120px] animate-pulse">
                <div className="h-3 bg-gray-200 dark:bg-gray-700  w-12 mb-2"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700  w-16 mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700  w-8"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800  p-3 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700  w-24 mb-2"></div>
          <div className="h-[240px] bg-gray-200 dark:bg-gray-700 "></div>
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
          <div className="flex bg-gray-100 dark:bg-gray-800  p-0.5">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2 py-0.5 text-xs font-medium  transition-all ${
                  timeRange === range 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          
          <div className="flex bg-gray-100 dark:bg-gray-800  p-0.5">
            {([
              { key: 'weight', label: 'Weight' },
              { key: 'bodyFat', label: 'Fat%' },
              { key: 'calories', label: 'Cals' },
              { key: 'macros', label: 'Macros' }
            ] as const).map((chart) => (
              <button
                key={chart.key}
                onClick={() => setChartType(chart.key)}
                className={`px-2 py-0.5 text-xs font-medium  transition-all ${
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
      {/* Ultra-Compact 2x2 Grid Metrics */}
      {summary && (
        <div className="grid grid-cols-2 gap-1.5 px-0.5">
          {/* Top Row: Weight Change + Avg Calories */}
          <div className="bg-white dark:bg-gray-900  border border-gray-200 dark:border-gray-700 p-2 min-h-[45px] flex flex-col justify-center ios-touch-feedback">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 truncate">Weight</div>
            <div className={`text-sm font-bold leading-none ${summary.weightChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.weightChange > 0 ? '+' : summary.weightChange < 0 ? '-' : ''}{(summary.weightChange && !isNaN(summary.weightChange)) ? Math.abs(Number(summary.weightChange)).toFixed(1) : '0.0'} {getUserPreferredWeightUnit()}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900  border border-gray-200 dark:border-gray-700 p-2 min-h-[45px] flex flex-col justify-center ios-touch-feedback">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 truncate">Avg Calories</div>
            <div className="text-sm font-bold text-blue-600 leading-none">
              {Math.round(summary.avgCalories)} cal/day
            </div>
          </div>
          
          {/* Bottom Row: Protein + Trend */}
          <div className="bg-white dark:bg-gray-900  border border-gray-200 dark:border-gray-700 p-2 min-h-[45px] flex flex-col justify-center ios-touch-feedback">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 truncate">Protein</div>
            <div className="text-sm font-bold text-orange-600 leading-none">
              {Math.round(summary.avgProtein)}g/day
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900  border border-gray-200 dark:border-gray-700 p-2 min-h-[45px] flex flex-col justify-center ios-touch-feedback">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 truncate">7d Trend</div>
            <div className={`text-sm font-bold leading-none ${Math.abs(summary.calorieChange) < 50 ? 'text-gray-600' : summary.calorieChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(summary.calorieChange) < 50 ? 'Stable' : 
               `${summary.calorieChange > 0 ? '+' : ''}${Math.round(summary.calorieChange)} cal/day`}
            </div>
          </div>
        </div>
      )}
      {/* Streamlined Chart Container */}
      <div className="bg-white dark:bg-gray-900  border border-gray-200 dark:border-gray-700 p-3">
        <div className="mb-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            {chartType === 'weight' && `Weight Progress • ${timeRange}`}
            {chartType === 'bodyFat' && `Body Fat Trend • ${timeRange}`}
            {chartType === 'calories' && `Daily Calories • ${timeRange}`}
            {chartType === 'macros' && `Macro Breakdown • ${timeRange}`}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {chartType === 'weight' && `Track weight changes over time`}
            {chartType === 'bodyFat' && `Monitor body composition progress`}
            {chartType === 'calories' && `Daily caloric intake patterns`}
            {chartType === 'macros' && `Protein, carbs, and fat distribution`}
          </p>
          {/* Average Values Display */}
          <div className="flex items-center gap-4 text-xs">
            {chartType === 'weight' && bodyMetrics && bodyMetrics.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-gray-500 dark:text-gray-400">Avg:</span>
                <span className="font-medium text-blue-600">
                  {(() => {
                    const preferredUnit = getUserPreferredWeightUnit();
                    let avgWeight = bodyMetrics.reduce((sum: number, metric: any) => {
                      let weight = parseFloat(metric.weight);
                      const metricUnit = metric.unit === 'imperial' ? 'lbs' : 'kg';
                      if (metricUnit !== preferredUnit) {
                        weight = UnitConverter.convertWeightChange(weight, metricUnit, preferredUnit);
                      }
                      return sum + weight;
                    }, 0) / bodyMetrics.length;
                    return `${avgWeight.toFixed(1)} ${preferredUnit}`;
                  })()}
                </span>
              </div>
            )}
            {chartType === 'bodyFat' && bodyMetrics && bodyMetrics.filter((m: any) => m.bodyFatPercentage).length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-gray-500 dark:text-gray-400">Avg:</span>
                <span className="font-medium text-green-600">
                  {(() => {
                    const bodyFatData = bodyMetrics.filter((m: any) => m.bodyFatPercentage);
                    const avgBodyFat = bodyFatData.reduce((sum: number, metric: any) => 
                      sum + parseFloat(metric.bodyFatPercentage), 0) / bodyFatData.length;
                    return `${avgBodyFat.toFixed(1)}%`;
                  })()}
                </span>
              </div>
            )}
            {chartType === 'calories' && progressionData && progressionData.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-gray-500 dark:text-gray-400">Avg:</span>
                <span className="font-medium text-orange-600">
                  {Math.round(summary.avgCalories)} cal/day
                </span>
              </div>
            )}
            {chartType === 'macros' && progressionData && progressionData.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 dark:text-gray-400">Avg Protein:</span>
                  <span className="font-medium text-blue-600">{Math.round(summary.avgProtein)}g/day</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 dark:text-gray-400">Avg Carbs:</span>
                  <span className="font-medium text-green-600">
                    {progressionData.length > 0 ? Math.round(progressionData.reduce((sum, entry) => sum + entry.carbs, 0) / progressionData.length) : 0}g/day
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 dark:text-gray-400">Avg Fat:</span>
                  <span className="font-medium text-yellow-600">
                    {progressionData.length > 0 ? Math.round(progressionData.reduce((sum, entry) => sum + entry.fat, 0) / progressionData.length) : 0}g/day
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-2">
          {renderChart()}
        </div>
      </div>

      {/* Compact Data Table Section */}
      <div className="bg-white dark:bg-gray-900  border border-gray-200 dark:border-gray-700 p-2">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">
              Recent Entries
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {chartType === 'weight' && `Weight data • ${timeRange}`}
              {chartType === 'bodyFat' && `Body fat data • ${timeRange}`}
              {chartType === 'calories' && `Daily calories • ${timeRange}`}
              {chartType === 'macros' && `Macro data • ${timeRange}`}
            </p>
          </div>
          
          {/* Unit Toggle Button - Only show for weight chart */}
          {chartType === 'weight' && (
            <button
              onClick={() => setDisplayUnit(displayUnit === 'kg' ? 'lbs' : 'kg')}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium border border-gray-200 dark:border-gray-600"
              title="Toggle between kg and lbs"
            >
              <ArrowLeftRight className="w-3 h-3" />
              {displayUnit}
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          {renderDataTable()}
        </div>
      </div>
    </div>
  );
}