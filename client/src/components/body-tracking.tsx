import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Scale, Ruler, TrendingUp, Plus, Trash2, Target, User, Calendar, ChevronDown } from "lucide-react";
import { TimezoneUtils } from "@shared/utils/timezone";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { UnitConverter } from "@shared/utils/unit-conversion";

interface BodyMetric {
  id: number;
  userId: number;
  date: string;
  weight?: number;
  bodyFatPercentage?: number;
  neck?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  thigh?: number;
  bicep?: number;
  unit: 'metric' | 'imperial';
  createdAt: string;
}

interface WeightProgressChartProps {
  metrics: BodyMetric[];
  chartTimeRange: string;
  latestMetric: BodyMetric | null;
}

function WeightProgressChart({ metrics, chartTimeRange, latestMetric }: WeightProgressChartProps) {
  // Filter metrics based on time range
  const filteredMetrics = useMemo(() => {
    const weightMetrics = metrics
      .filter(m => m.weight && m.weight > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (chartTimeRange === 'all') return weightMetrics;
    
    const daysMap: Record<string, number> = {
      '1week': 7,
      '1month': 30,
      '2months': 60,
      '3months': 90,
      '6months': 180,
      '1year': 365
    };
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysMap[chartTimeRange]);
    
    return weightMetrics.filter(m => new Date(m.date) >= cutoffDate);
  }, [metrics, chartTimeRange]);

  // Prepare chart data with unit conversion
  const chartData = useMemo(() => {
    if (filteredMetrics.length === 0) return [];
    
    return filteredMetrics.map((metric, index) => {
      const date = new Date(metric.date);
      const weight = metric.weight!;
      
      // Convert to a common unit for consistent display
      const displayUnit = latestMetric?.unit || 'metric';
      const convertedWeight = metric.unit === displayUnit 
        ? weight 
        : (() => {
            const converted = UnitConverter.convertWeight(weight, metric.unit);
            const result = displayUnit === 'metric' ? converted.kg : converted.lbs;
            return typeof result === 'number' ? result : weight;
          })();
      
      return {
        date: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        }),
        weight: Math.round((convertedWeight || 0) * 10) / 10,
        originalWeight: weight,
        originalUnit: metric.unit,
        isLatest: index === filteredMetrics.length - 1
      };
    });
  }, [filteredMetrics, latestMetric]);

  if (filteredMetrics.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p className="text-sm">No weight data available for selected time range</p>
      </div>
    );
  }

  const startWeight = chartData[0]?.weight;
  const currentWeight = chartData[chartData.length - 1]?.weight;
  const weightChange = currentWeight - startWeight;
  const weightChangePercent = startWeight > 0 ? ((weightChange / startWeight) * 100) : 0;
  const displayUnit = latestMetric?.unit === 'metric' ? 'kg' : 'lbs';

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Start</p>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
            {startWeight} {displayUnit}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Current</p>
          <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
            {currentWeight} {displayUnit}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Change</p>
          <p className={`text-lg font-bold ${
            weightChange > 0 
              ? 'text-orange-600 dark:text-orange-400' 
              : weightChange < 0 
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
          }`}>
            {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} {displayUnit}
          </p>
          <p className={`text-xs ${
            weightChange > 0 
              ? 'text-orange-500 dark:text-orange-400' 
              : weightChange < 0 
                ? 'text-blue-500 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400'
          }`}>
            ({weightChangePercent > 0 ? '+' : ''}{weightChangePercent.toFixed(1)}%)
          </p>
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              fontSize={10}
              tick={{ fill: 'currentColor' }}
              axisLine={{ stroke: 'currentColor', strokeWidth: 1 }}
            />
            <YAxis 
              fontSize={10}
              tick={{ fill: 'currentColor' }}
              axisLine={{ stroke: 'currentColor', strokeWidth: 1 }}
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Weight: {data.weight} {displayUnit}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, fill: '#2563eb' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface BodyTrackingProps {
  userId: number;
  selectedDate?: string;
  setSelectedDate?: (date: string) => void;
  showDatePicker?: boolean;
  setShowDatePicker?: (show: boolean) => void;
}

export function BodyTracking({ userId, selectedDate: externalSelectedDate, setSelectedDate: externalSetSelectedDate, showDatePicker, setShowDatePicker }: BodyTrackingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingMetric, setIsAddingMetric] = useState(false);
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [previousUnit, setPreviousUnit] = useState<'metric' | 'imperial'>('metric');
  const [showConversionHelper, setShowConversionHelper] = useState(false);
  const [showUnifiedUnits, setShowUnifiedUnits] = useState(false);
  const [chartTimeRange, setChartTimeRange] = useState<string>('1month');
  const formRef = useRef<HTMLDivElement>(null);
  
  const selectedDate = externalSelectedDate || new Date().toISOString().split('T')[0];
  const setSelectedDate = externalSetSelectedDate || (() => {});
  
  const [formData, setFormData] = useState({
    date: selectedDate,
    weight: '',
    bodyFatPercentage: '',
    neck: '',
    chest: '',
    waist: '',
    hips: '',
    thigh: '',
    bicep: '',
  });

  // Fetch body metrics
  const { data: metrics, isLoading } = useQuery<BodyMetric[]>({
    queryKey: ['/api/body-metrics', userId],
    queryFn: async () => {
      const response = await fetch(`/api/body-metrics/${userId}`);
      return response.json();
    }
  });

  // Get latest metric for current stats
  const latestMetric = metrics && metrics.length > 0 ? metrics[0] : null;

  // Add metric mutation
  const addMetricMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/body-metrics', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/body-metrics', userId] });
      setIsAddingMetric(false);
      setFormData({
        date: selectedDate,
        weight: '',
        bodyFatPercentage: '',
        neck: '',
        chest: '',
        waist: '',
        hips: '',
        thigh: '',
        bicep: '',
      });
      toast({
        title: "Success",
        description: "Body metric added successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add body metric",
        variant: "destructive"
      });
    }
  });

  // Delete metric mutation
  const deleteMetricMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/body-metrics/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/body-metrics', userId] });
      toast({
        title: "Success",
        description: "Body metric deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete body metric",
        variant: "destructive"
      });
    }
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericData: any = {
      userId,
      date: formData.date,
      unit
    };

    // Add only non-empty numeric fields
    if (formData.weight) numericData.weight = parseFloat(formData.weight);
    if (formData.bodyFatPercentage) numericData.bodyFatPercentage = parseFloat(formData.bodyFatPercentage);
    if (formData.neck) numericData.neck = parseFloat(formData.neck);
    if (formData.chest) numericData.chest = parseFloat(formData.chest);
    if (formData.waist) numericData.waist = parseFloat(formData.waist);
    if (formData.hips) numericData.hips = parseFloat(formData.hips);
    if (formData.thigh) numericData.thigh = parseFloat(formData.thigh);
    if (formData.bicep) numericData.bicep = parseFloat(formData.bicep);

    addMetricMutation.mutate(numericData);
  };

  // Helper functions for display values
  const displayValue = (value: number, type: 'weight' | 'measurement', originalUnit: 'metric' | 'imperial') => {
    if (type === 'weight') {
      return originalUnit === 'metric' ? `${value}kg` : `${value}lbs`;
    } else {
      return originalUnit === 'metric' ? `${value}cm` : `${value}in`;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Quick Add */}
      <div className="flex items-center justify-between mb-6 pl-[5px] pr-[5px]">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">Body Progress</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Track your body measurements and changes</p>
        </div>
        <Button
          onClick={() => setIsAddingMetric(true)}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] ios-touch-feedback hover:shadow-lg border border-primary/20 h-11 min-w-[80px] bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2 font-medium shadow-lg ios-touch-feedback touch-target text-[12px] pl-[20px] pr-[20px]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Entry
        </Button>
      </div>
      
      {/* Weight Progress Chart */}
      {metrics && metrics.length > 0 && (
        <Card className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Weight Progress
              </CardTitle>
              <Select value={chartTimeRange} onValueChange={setChartTimeRange}>
                <SelectTrigger className="w-auto min-w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1week">1 Week</SelectItem>
                  <SelectItem value="1month">1 Month</SelectItem>
                  <SelectItem value="2months">2 Months</SelectItem>
                  <SelectItem value="3months">3 Months</SelectItem>
                  <SelectItem value="6months">6 Months</SelectItem>
                  <SelectItem value="1year">1 Year</SelectItem>
                  <SelectItem value="all">All (Since Start Weight)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <WeightProgressChart 
              metrics={metrics} 
              chartTimeRange={chartTimeRange} 
              latestMetric={latestMetric}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Current Stats - Ultra Compact Mobile Design */}
      {latestMetric && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-black dark:text-white">Current Stats</h3>
              <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                {new Date(latestMetric.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            
            {/* Priority Metrics - Always Visible */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {/* Weight */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Scale className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Weight</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400 truncate">
                      {latestMetric.weight ? displayValue(latestMetric.weight, 'weight', latestMetric.unit) : '-'}
                    </p>
                    {latestMetric.weight && (
                      <p className="text-xs text-gray-400 truncate">
                        ≈ {(() => {
                          const converted = UnitConverter.convertWeight(latestMetric.weight, latestMetric.unit);
                          const targetUnit = latestMetric.unit === 'metric' ? 'lbs' : 'kg';
                          const convertedValue = targetUnit === 'lbs' ? converted.lbs : converted.kg;
                          return `${convertedValue.toFixed(1)} ${targetUnit}`;
                        })()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Body Fat */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Body Fat</p>
                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400 truncate">
                      {latestMetric.bodyFatPercentage || '-'}
                      {latestMetric.bodyFatPercentage && <span className="text-sm font-normal text-gray-500 ml-1">%</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Measurements Grid - 4 columns on larger screens, 2 on mobile */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
              {/* Waist */}
              {latestMetric.waist && (
                <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-100 dark:border-gray-700 h-16 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 h-4">
                    <Target className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-300 truncate leading-none">Waist</span>
                  </div>
                  <div className="flex items-end h-4">
                    <p className="text-sm font-bold text-green-800 dark:text-green-200 truncate leading-none">
                      {displayValue(latestMetric.waist, 'measurement', latestMetric.unit)}
                    </p>
                  </div>
                </div>
              )}

              {/* Chest */}
              {latestMetric.chest && (
                <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-100 dark:border-gray-700 h-16 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 h-4">
                    <User className="w-3 h-3 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300 truncate leading-none">Chest</span>
                  </div>
                  <div className="flex items-end h-4">
                    <p className="text-sm font-bold text-purple-800 dark:text-purple-200 truncate leading-none">
                      {displayValue(latestMetric.chest, 'measurement', latestMetric.unit)}
                    </p>
                  </div>
                </div>
              )}

              {/* More measurements can be added here */}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Metric Form */}
      {isAddingMetric && (
        <Card ref={formRef}>
          <CardHeader>
            <CardTitle>Log Body Metrics</CardTitle>
            <CardDescription>
              Track your progress with measurements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit System</Label>
                  <Select value={unit} onValueChange={(value: 'metric' | 'imperial') => setUnit(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">Metric (kg/cm)</SelectItem>
                      <SelectItem value="imperial">Imperial (lbs/in)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Weight ({unit === 'metric' ? 'kg' : 'lbs'})</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="70.5"
                  />
                </div>
                <div>
                  <Label htmlFor="bodyFatPercentage">Body Fat (%)</Label>
                  <Input
                    id="bodyFatPercentage"
                    type="number"
                    step="0.1"
                    value={formData.bodyFatPercentage}
                    onChange={(e) => setFormData({ ...formData, bodyFatPercentage: e.target.value })}
                    placeholder="15.2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="waist">Waist ({unit === 'metric' ? 'cm' : 'in'})</Label>
                  <Input
                    id="waist"
                    type="number"
                    step="0.1"
                    value={formData.waist}
                    onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                    placeholder="80"
                  />
                </div>
                <div>
                  <Label htmlFor="chest">Chest ({unit === 'metric' ? 'cm' : 'in'})</Label>
                  <Input
                    id="chest"
                    type="number"
                    step="0.1"
                    value={formData.chest}
                    onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
                    placeholder="95"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingMetric(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addMetricMutation.isPending}
                  className="flex-1"
                >
                  {addMetricMutation.isPending ? 'Adding...' : 'Add Metric'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}