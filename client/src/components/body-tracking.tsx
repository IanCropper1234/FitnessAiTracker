import { useState, useEffect, useRef } from "react";
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

interface BodyTrackingProps {
  userId: number;
  selectedDate?: string;
  setSelectedDate?: (date: string) => void;
  showDatePicker?: boolean;
  setShowDatePicker?: (show: boolean) => void;
}

export function BodyTracking({ userId, selectedDate: externalSelectedDate, setSelectedDate: externalSetSelectedDate, showDatePicker, setShowDatePicker }: BodyTrackingProps) {
  console.log('BodyTracking props:', { 
    hasExternalSelectedDate: !!externalSelectedDate, 
    hasExternalSetSelectedDate: !!externalSetSelectedDate, 
    hasShowDatePicker: !!showDatePicker,
    hasSetShowDatePicker: !!setShowDatePicker 
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingMetric, setIsAddingMetric] = useState(false);
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [previousUnit, setPreviousUnit] = useState<'metric' | 'imperial'>('metric');
  const [showConversionHelper, setShowConversionHelper] = useState(false);
  const [showUnifiedUnits, setShowUnifiedUnits] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  // Use external date if provided, otherwise use internal state
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

  // Add body metric mutation
  const addMetricMutation = useMutation({
    mutationFn: async (metricData: any) => {
      return await apiRequest("POST", "/api/body-metrics", metricData);
    },
    onSuccess: async (data, variables) => {
      // If weight was added, sync it to user profile
      if (variables.weight) {
        try {
          await syncWeightToProfile(variables.weight);
        } catch (error) {
          console.warn('Failed to sync weight to profile:', error);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/body-metrics', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile', userId] });
      setIsAddingMetric(false);
      // Reset form data - the useEffect will automatically set the date to the latest metric date
      setFormData({
        date: new Date().toISOString().split('T')[0], // This will be updated by useEffect
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
        description: "Body metrics added successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add body metrics",
        variant: "destructive"
      });
    }
  });

  // Delete metric mutation
  const deleteMetricMutation = useMutation({
    mutationFn: async (metricId: number) => {
      return await apiRequest("DELETE", `/api/body-metrics/${metricId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/body-metrics', userId] });
      toast({
        title: "Success",
        description: "Body metric deleted successfully"
      });
    }
  });

  // Sync weight to user profile
  const syncWeightToProfile = async (weight: number) => {
    try {
      // Get current profile
      const profileResponse = await fetch(`/api/user/profile/${userId}`);
      const profileData = await profileResponse.json();
      const profile = profileData.profile || profileData.user;
      
      // Update profile with new weight
      await apiRequest("PUT", `/api/user/profile/${userId}`, {
        ...profile,
        userId: userId,
        weight: weight.toString()
      });
    } catch (error) {
      console.warn('Failed to sync weight to profile:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const metricData = {
      userId,
      date: formData.date,
      unit,
      ...(formData.weight && { weight: parseFloat(formData.weight) }),
      ...(formData.bodyFatPercentage && { bodyFatPercentage: parseFloat(formData.bodyFatPercentage) }),
      ...(formData.neck && { neck: parseFloat(formData.neck) }),
      ...(formData.chest && { chest: parseFloat(formData.chest) }),
      ...(formData.waist && { waist: parseFloat(formData.waist) }),
      ...(formData.hips && { hips: parseFloat(formData.hips) }),
      ...(formData.thigh && { thigh: parseFloat(formData.thigh) }),
      ...(formData.bicep && { bicep: parseFloat(formData.bicep) }),
    };

    addMetricMutation.mutate(metricData);
  };

  const formatUnit = (type: 'weight' | 'measurement') => {
    if (type === 'weight') {
      return unit === 'metric' ? 'kg' : 'lbs';
    }
    return unit === 'metric' ? 'cm' : 'inches';
  };

  // Smart unit conversion helpers
  const convertValue = (value: number, type: 'weight' | 'measurement', fromUnit: 'metric' | 'imperial', toUnit: 'metric' | 'imperial'): number => {
    if (fromUnit === toUnit || !value) return value;
    
    if (type === 'weight') {
      if (fromUnit === 'metric' && toUnit === 'imperial') {
        return Math.round(value * 2.20462 * 10) / 10; // kg to lbs
      } else if (fromUnit === 'imperial' && toUnit === 'metric') {
        return Math.round(value * 0.453592 * 10) / 10; // lbs to kg
      }
    } else if (type === 'measurement') {
      if (fromUnit === 'metric' && toUnit === 'imperial') {
        return Math.round(value * 0.393701 * 10) / 10; // cm to inches
      } else if (fromUnit === 'imperial' && toUnit === 'metric') {
        return Math.round(value * 2.54 * 10) / 10; // inches to cm
      }
    }
    return value;
  };

  const getConversionHelper = (value: string, type: 'weight' | 'measurement'): string => {
    const numValue = parseFloat(value);
    if (!numValue) return '';
    
    const converted = convertValue(numValue, type, previousUnit, unit);
    const fromUnitLabel = type === 'weight' ? 
      (previousUnit === 'metric' ? 'kg' : 'lbs') : 
      (previousUnit === 'metric' ? 'cm' : 'inches');
    const toUnitLabel = formatUnit(type);
    
    return `${numValue} ${fromUnitLabel} ≈ ${converted} ${toUnitLabel}`;
  };

  const convertAllFormValues = () => {
    setFormData(prev => ({
      ...prev,
      weight: prev.weight ? convertValue(parseFloat(prev.weight), 'weight', previousUnit, unit).toString() : '',
      neck: prev.neck ? convertValue(parseFloat(prev.neck), 'measurement', previousUnit, unit).toString() : '',
      chest: prev.chest ? convertValue(parseFloat(prev.chest), 'measurement', previousUnit, unit).toString() : '',
      waist: prev.waist ? convertValue(parseFloat(prev.waist), 'measurement', previousUnit, unit).toString() : '',
      hips: prev.hips ? convertValue(parseFloat(prev.hips), 'measurement', previousUnit, unit).toString() : '',
      thigh: prev.thigh ? convertValue(parseFloat(prev.thigh), 'measurement', previousUnit, unit).toString() : '',
      bicep: prev.bicep ? convertValue(parseFloat(prev.bicep), 'measurement', previousUnit, unit).toString() : '',
    }));
    setShowConversionHelper(false);
  };

  const hasFormValues = () => {
    return formData.weight || formData.neck || formData.chest || formData.waist || 
           formData.hips || formData.thigh || formData.bicep;
  };

  // Enhanced display functions for timeline with unit conversion
  const displayValue = (value: number | undefined, type: 'weight' | 'measurement', originalUnit: 'metric' | 'imperial'): string => {
    if (!value) return '';
    
    if (showUnifiedUnits) {
      // Convert to current preferred unit
      const converted = convertValue(value, type, originalUnit, unit);
      const unitLabel = type === 'weight' ? 
        (unit === 'metric' ? 'kg' : 'lbs') : 
        (unit === 'metric' ? 'cm' : 'inches');
      return `${converted}${unitLabel}`;
    } else {
      // Show original value with original unit
      const unitLabel = type === 'weight' ? 
        (originalUnit === 'metric' ? 'kg' : 'lbs') : 
        (originalUnit === 'metric' ? 'cm' : 'inches');
      return `${value}${unitLabel}`;
    }
  };

  const getUnitIndicator = (metricUnit: 'metric' | 'imperial'): string => {
    if (showUnifiedUnits && metricUnit !== unit) {
      return ' (converted)';
    }
    return '';
  };

  const getLatestMetric = () => {
    if (!metrics || metrics.length === 0) return null;
    return metrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  const latestMetric = getLatestMetric();

  // Update form date when selectedDate changes or when metrics are available
  useEffect(() => {
    if (isAddingMetric) {
      setFormData(prev => ({
        ...prev,
        date: selectedDate
      }));
    } else if (latestMetric && !isAddingMetric) {
      setFormData(prev => ({
        ...prev,
        date: new Date(latestMetric.date).toISOString().split('T')[0]
      }));
    }
  }, [selectedDate, latestMetric, isAddingMetric]);
  
  // Sync external body tracking date changes to form data
  useEffect(() => {
    if (externalSelectedDate && isAddingMetric) {
      setFormData(prev => ({
        ...prev,
        date: externalSelectedDate
      }));
    }
  }, [externalSelectedDate, isAddingMetric]);

  // Handle unit changes and show conversion helper
  useEffect(() => {
    if (unit !== previousUnit && hasFormValues() && isAddingMetric) {
      setShowConversionHelper(true);
    }
  }, [unit, previousUnit, isAddingMetric]);

  // Handle unit selector change
  const handleUnitChange = (newUnit: 'metric' | 'imperial') => {
    setPreviousUnit(unit);
    setUnit(newUnit);
  };

  // Auto-scroll to form when it opens
  useEffect(() => {
    if (isAddingMetric && formRef.current) {
      const scrollTimeout = setTimeout(() => {
        formRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }, 100); // Small delay to ensure DOM is updated
      
      return () => clearTimeout(scrollTimeout);
    }
  }, [isAddingMetric]);

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
                        ≈ {convertValue(latestMetric.weight, 'weight', latestMetric.unit, latestMetric.unit === 'metric' ? 'imperial' : 'metric')} {latestMetric.unit === 'metric' ? 'lbs' : 'kg'}
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
                <div className="bg-white dark:bg-gray-800 rounded p-1.5 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-1 mb-1">
                    <Target className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-300 truncate">Waist</span>
                  </div>
                  <p className="text-sm font-bold text-green-800 dark:text-green-200 truncate">
                    {displayValue(latestMetric.waist, 'measurement', latestMetric.unit)}
                  </p>
                </div>
              )}

              {/* Chest */}
              {latestMetric.chest && (
                <div className="bg-white dark:bg-gray-800 rounded p-1.5 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-1 mb-1">
                    <User className="w-3 h-3 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300 truncate">Chest</span>
                  </div>
                  <p className="text-sm font-bold text-purple-800 dark:text-purple-200 truncate">
                    {displayValue(latestMetric.chest, 'measurement', latestMetric.unit)}
                  </p>
                </div>
              )}

              {/* Neck */}
              {latestMetric.neck && (
                <div className="bg-white dark:bg-gray-800 rounded p-1.5 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-1 mb-1">
                    <Ruler className="w-3 h-3 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300 truncate">Neck</span>
                  </div>
                  <p className="text-sm font-bold text-indigo-800 dark:text-indigo-200 truncate">
                    {displayValue(latestMetric.neck, 'measurement', latestMetric.unit)}
                  </p>
                </div>
              )}

              {/* Hips */}
              {latestMetric.hips && (
                <div className="bg-white dark:bg-gray-800 rounded p-1.5 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-1 mb-1">
                    <Target className="w-3 h-3 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-pink-700 dark:text-pink-300 truncate">Hips</span>
                  </div>
                  <p className="text-sm font-bold text-pink-800 dark:text-pink-200 truncate">
                    {displayValue(latestMetric.hips, 'measurement', latestMetric.unit)}
                  </p>
                </div>
              )}

              {/* Thigh */}
              {latestMetric.thigh && (
                <div className="bg-white dark:bg-gray-800 rounded p-1.5 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-1 mb-1">
                    <Ruler className="w-3 h-3 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300 truncate">Thigh</span>
                  </div>
                  <p className="text-sm font-bold text-cyan-800 dark:text-cyan-200 truncate">
                    {displayValue(latestMetric.thigh, 'measurement', latestMetric.unit)}
                  </p>
                </div>
              )}

              {/* Bicep */}
              {latestMetric.bicep && (
                <div className="bg-white dark:bg-gray-800 rounded p-1.5 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-1 mb-1">
                    <User className="w-3 h-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-300 truncate">Bicep</span>
                  </div>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-200 truncate">
                    {displayValue(latestMetric.bicep, 'measurement', latestMetric.unit)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {/* No Data State - Compact Design */}
      {!latestMetric && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Progress Data Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto text-sm">
                Start logging your body measurements to track your fitness journey and see your progress over time.
              </p>
              <Button
                onClick={() => setIsAddingMetric(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white ios-touch-feedback touch-target"
              >
                <Plus className="w-4 h-4 mr-2" />
                Log Your First Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Add Metrics Form - Enhanced Design */}
      {isAddingMetric && (
        <Card className="shadow-lg border-0 bg-white dark:bg-gray-900">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-black dark:text-white">Log Body Metrics</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Track your progress with accurate measurements</CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingMetric(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent ref={formRef} className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date and Unit Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      console.log('Date picker button clicked!', {
                        setShowDatePicker: !!setShowDatePicker,
                        setSelectedDate: !!setSelectedDate,
                        formDataDate: formData.date
                      });
                      if (setShowDatePicker) {
                        console.log('Opening date picker...');
                        // Update external date picker with current form date
                        setSelectedDate(formData.date);
                        setShowDatePicker(true);
                      } else {
                        console.error('setShowDatePicker is not available!');
                      }
                    }}
                    className="w-full justify-between text-left font-normal ios-touch-feedback ios-smooth-transform cursor-pointer text-[12px] pl-[20px] pr-[20px] pt-[6px] pb-[6px] mt-[0px] mb-[0px] ml-[-5px] mr-[-5px]"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {TimezoneUtils.isToday(formData.date) ? 'Today' : 
                         TimezoneUtils.parseUserDate(formData.date).toLocaleDateString('en-GB', { 
                           weekday: 'short',
                           day: '2-digit', 
                           month: 'short'
                         })}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Unit System
                  </Label>
                  <Select value={unit} onValueChange={handleUnitChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">Metric (kg/cm)</SelectItem>
                      <SelectItem value="imperial">Imperial (lbs/inches)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Smart Conversion Helper */}
              {showConversionHelper && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0">
                      <Scale className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        Convert Values?
                      </h4>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mb-2 leading-relaxed">
                        Unit changed. Convert existing values?
                      </p>
                      <div className="space-y-1 text-xs text-blue-600 dark:text-blue-400 mb-3">
                        {formData.weight && <div className="truncate">• {getConversionHelper(formData.weight, 'weight')}</div>}
                        {formData.waist && <div className="truncate">• Waist: {getConversionHelper(formData.waist, 'measurement')}</div>}
                        {formData.chest && <div className="truncate">• Chest: {getConversionHelper(formData.chest, 'measurement')}</div>}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={convertAllFormValues}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1.5 flex-1 sm:flex-none"
                        >
                          Convert All
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowConversionHelper(false)}
                          className="text-xs px-2 py-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/20 flex-1 sm:flex-none"
                        >
                          Keep Values
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Primary Measurements */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  Primary Measurements
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Weight ({formatUnit('weight')})
                    </Label>
                    <div className="relative">
                      <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="number"
                        step="0.1"
                        id="weight"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        placeholder="Enter weight"
                        className="pl-10"
                      />
                      {formData.weight && (
                        <div className="mt-1 text-xs text-gray-500">
                          ≈ {convertValue(parseFloat(formData.weight), 'weight', unit, unit === 'metric' ? 'imperial' : 'metric')} {unit === 'metric' ? 'lbs' : 'kg'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bodyFatPercentage" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Body Fat Percentage (%)
                    </Label>
                    <div className="relative">
                      <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="number"
                        step="0.1"
                        id="bodyFatPercentage"
                        value={formData.bodyFatPercentage}
                        onChange={(e) => setFormData({ ...formData, bodyFatPercentage: e.target.value })}
                        placeholder="Enter body fat %"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Body Measurements */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  Body Measurements ({formatUnit('measurement')})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="neck" className="text-sm text-gray-600 dark:text-gray-400">Neck</Label>
                    <Input
                      type="number"
                      step="0.1"
                      id="neck"
                      value={formData.neck}
                      onChange={(e) => setFormData({ ...formData, neck: e.target.value })}
                      placeholder="Neck"
                      className="text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chest" className="text-sm text-gray-600 dark:text-gray-400">Chest</Label>
                    <Input
                      type="number"
                      step="0.1"
                      id="chest"
                      value={formData.chest}
                      onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
                      placeholder="Chest"
                      className="text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="waist" className="text-sm text-gray-600 dark:text-gray-400">Waist</Label>
                    <Input
                      type="number"
                      step="0.1"
                      id="waist"
                      value={formData.waist}
                      onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                      placeholder="Waist"
                      className="text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hips" className="text-sm text-gray-600 dark:text-gray-400">Hips</Label>
                    <Input
                      type="number"
                      step="0.1"
                      id="hips"
                      value={formData.hips}
                      onChange={(e) => setFormData({ ...formData, hips: e.target.value })}
                      placeholder="Hips"
                      className="text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thigh" className="text-sm text-gray-600 dark:text-gray-400">Thigh</Label>
                    <Input
                      type="number"
                      step="0.1"
                      id="thigh"
                      value={formData.thigh}
                      onChange={(e) => setFormData({ ...formData, thigh: e.target.value })}
                      placeholder="Thigh"
                      className="text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bicep" className="text-sm text-gray-600 dark:text-gray-400">Bicep</Label>
                    <Input
                      type="number"
                      step="0.1"
                      id="bicep"
                      value={formData.bicep}
                      onChange={(e) => setFormData({ ...formData, bicep: e.target.value })}
                      placeholder="Bicep"
                      className="text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Button 
                  type="submit" 
                  disabled={addMetricMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                >
                  {addMetricMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Save Metrics
                    </div>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddingMetric(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      {/* Metrics History - Compact Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Progress Timeline
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUnifiedUnits(!showUnifiedUnits)}
              className="text-xs"
            >
              {showUnifiedUnits ? 'Show Original Units' : 'Unify Units'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          {metrics && metrics.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {metrics.map((metric, index) => (
                <div key={metric.id} className="relative">
                  {/* Timeline Line */}
                  {index !== metrics.length - 1 && (
                    <div className="absolute left-3 top-8 w-0.5 h-6 bg-gradient-to-b from-blue-300 to-gray-200 dark:from-blue-600 dark:to-gray-600"></div>
                  )}
                  
                  {/* Timeline Entry */}
                  <div className="flex gap-2 group">
                    {/* Timeline Dot - Smaller */}
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-150">
                      <Calendar className="w-2.5 h-2.5 text-white" />
                    </div>
                    
                    {/* Content Card - More Compact */}
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-150 group-hover:border-blue-200 dark:group-hover:border-blue-700">
                      <div className="p-2">
                        {/* Header - Compact */}
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                              {new Date(metric.date).toLocaleDateString('en-US', { 
                                month: 'short',
                                day: 'numeric'
                              })}
                            </h4>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {index === 0 ? 'Latest' : `${index + 1} ago`}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMetricMutation.mutate(metric.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-opacity duration-150 h-5 w-5 p-0"
                            disabled={deleteMetricMutation.isPending}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </Button>
                        </div>

                        {/* Metrics Grid - Ultra Compact */}
                        <div className="grid grid-cols-2 gap-1.5">
                          {metric.weight && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-1.5 border border-blue-100 dark:border-blue-800">
                              <div className="flex items-center gap-1 mb-0.5">
                                <Scale className="w-2.5 h-2.5 text-blue-600" />
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Weight</span>
                              </div>
                              <p className="text-xs font-bold text-blue-800 dark:text-blue-200">
                                {displayValue(metric.weight, 'weight', metric.unit)}
                                <span className="text-xs font-normal text-gray-500 ml-0.5">{getUnitIndicator(metric.unit)}</span>
                              </p>
                            </div>
                          )}

                          {metric.bodyFatPercentage && (
                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-1.5 border border-orange-100 dark:border-orange-800">
                              <div className="flex items-center gap-1 mb-0.5">
                                <TrendingUp className="w-2.5 h-2.5 text-orange-600" />
                                <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Body Fat</span>
                              </div>
                              <p className="text-xs font-bold text-orange-800 dark:text-orange-200">
                                {metric.bodyFatPercentage}%
                              </p>
                            </div>
                          )}

                          {metric.waist && (
                            <div className="bg-green-50 dark:bg-green-900/20 rounded p-1.5 border border-green-100 dark:border-green-800">
                              <div className="flex items-center gap-1 mb-0.5">
                                <Target className="w-2.5 h-2.5 text-green-600" />
                                <span className="text-xs font-medium text-green-700 dark:text-green-300">Waist</span>
                              </div>
                              <p className="text-xs font-bold text-green-800 dark:text-green-200">
                                {displayValue(metric.waist, 'measurement', metric.unit)}
                                <span className="text-xs font-normal text-gray-500 ml-0.5">{getUnitIndicator(metric.unit)}</span>
                              </p>
                            </div>
                          )}

                          {metric.chest && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-1.5 border border-purple-100 dark:border-purple-800">
                              <div className="flex items-center gap-1 mb-0.5">
                                <User className="w-2.5 h-2.5 text-purple-600" />
                                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Chest</span>
                              </div>
                              <p className="text-xs font-bold text-purple-800 dark:text-purple-200">
                                {displayValue(metric.chest, 'measurement', metric.unit)}
                                <span className="text-xs font-normal text-gray-500 ml-0.5">{getUnitIndicator(metric.unit)}</span>
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Additional Measurements - More Compact */}
                        {(metric.neck || metric.hips || metric.thigh || metric.bicep) && (
                          <div className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex flex-wrap gap-1 text-xs">
                              {metric.neck && (
                                <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">
                                  Neck: {displayValue(metric.neck, 'measurement', metric.unit)}
                                </span>
                              )}
                              {metric.hips && (
                                <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">
                                  Hips: {displayValue(metric.hips, 'measurement', metric.unit)}
                                </span>
                              )}
                              {metric.thigh && (
                                <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">
                                  Thigh: {displayValue(metric.thigh, 'measurement', metric.unit)}
                                </span>
                              )}
                              {metric.bicep && (
                                <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">
                                  Bicep: {displayValue(metric.bicep, 'measurement', metric.unit)}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Progress Data Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Start logging your body measurements to track your fitness journey and see your progress over time.
              </p>
              <Button
                onClick={() => setIsAddingMetric(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Log Your First Entry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}