import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Scale, Ruler, TrendingUp, Plus, Trash2, Target, User, Calendar } from "lucide-react";
import { useLocation } from "wouter";


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
}

export function BodyTracking({ userId }: BodyTrackingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch body metrics
  const { data: metrics, isLoading } = useQuery<BodyMetric[]>({
    queryKey: ['/api/body-metrics', userId],
    queryFn: async () => {
      const response = await fetch(`/api/body-metrics/${userId}`);
      return response.json();
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





  const getLatestMetric = () => {
    if (!metrics || metrics.length === 0) return null;
    return metrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  const formatUnit = (type: 'weight' | 'measurement') => {
    return type === 'weight' ? 'kg' : 'cm';
  };

  const latestMetric = getLatestMetric();



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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">Body Progress</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Track your body measurements and changes</p>
        </div>
        <Button
          onClick={() => setLocation('/add-body-metrics')}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2 font-medium shadow-lg ios-touch-feedback touch-target"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Entry
        </Button>
      </div>

      {/* Current Stats - Enhanced Visual Design */}
      {latestMetric && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black dark:text-white">Current Stats</h3>
              <span className="text-sm text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                {new Date(latestMetric.date).toLocaleDateString()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Weight */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Weight</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {latestMetric.weight || '-'}
                      {latestMetric.weight && <span className="text-sm font-normal text-gray-500 ml-1">{formatUnit('weight')}</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body Fat */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Body Fat</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {latestMetric.bodyFatPercentage || '-'}
                      {latestMetric.bodyFatPercentage && <span className="text-sm font-normal text-gray-500 ml-1">%</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Waist */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Waist</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {latestMetric.waist || '-'}
                      {latestMetric.waist && <span className="text-sm font-normal text-gray-500 ml-1">{formatUnit('measurement')}</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chest */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Chest</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {latestMetric.chest || '-'}
                      {latestMetric.chest && <span className="text-sm font-normal text-gray-500 ml-1">{formatUnit('measurement')}</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Measurements Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Neck */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                    <Ruler className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Neck</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {latestMetric.neck || '-'}
                      {latestMetric.neck && <span className="text-sm font-normal text-gray-500 ml-1">{formatUnit('measurement')}</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hips */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hips</p>
                    <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                      {latestMetric.hips || '-'}
                      {latestMetric.hips && <span className="text-sm font-normal text-gray-500 ml-1">{formatUnit('measurement')}</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Thigh */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                    <Ruler className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Thigh</p>
                    <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                      {latestMetric.thigh || '-'}
                      {latestMetric.thigh && <span className="text-sm font-normal text-gray-500 ml-1">{formatUnit('measurement')}</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bicep */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Bicep</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {latestMetric.bicep || '-'}
                      {latestMetric.bicep && <span className="text-sm font-normal text-gray-500 ml-1">{formatUnit('measurement')}</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State - Show All Measurements with Dashes */}
      {!latestMetric && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black dark:text-white">Current Stats</h3>
              <span className="text-sm text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                No data yet
              </span>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Weight */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Weight</p>
                    <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                      -
                    </p>
                  </div>
                </div>
              </div>

              {/* Body Fat */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Body Fat</p>
                    <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                      -
                    </p>
                  </div>
                </div>
              </div>

              {/* Waist */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Waist</p>
                    <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                      -
                    </p>
                  </div>
                </div>
              </div>

              {/* Chest */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Chest</p>
                    <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                      -
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Measurements Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Neck */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                    <Ruler className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Neck</p>
                    <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                      -
                    </p>
                  </div>
                </div>
              </div>

              {/* Hips */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hips</p>
                    <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                      -
                    </p>
                  </div>
                </div>
              </div>

              {/* Thigh */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                    <Ruler className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Thigh</p>
                    <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                      -
                    </p>
                  </div>
                </div>
              </div>

              {/* Bicep */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Bicep</p>
                    <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                      -
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Start Tracking Your Progress</h4>
              <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
                Log your first body measurement to begin tracking your fitness journey and see your progress over time.
              </p>
              <Button
                onClick={() => setLocation('/add-body-metrics')}
                className="bg-blue-600 hover:bg-blue-700 text-white ios-touch-feedback touch-target"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Metrics History - Compact Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Progress Timeline
          </CardTitle>
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
                                {metric.weight}<span className="text-xs font-normal ml-0.5">{formatUnit('weight')}</span>
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
                                {metric.waist}<span className="text-xs font-normal ml-0.5">{formatUnit('measurement')}</span>
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
                                {metric.chest}<span className="text-xs font-normal ml-0.5">{formatUnit('measurement')}</span>
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
                                  Neck: {metric.neck}{formatUnit('measurement')}
                                </span>
                              )}
                              {metric.hips && (
                                <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">
                                  Hips: {metric.hips}{formatUnit('measurement')}
                                </span>
                              )}
                              {metric.thigh && (
                                <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">
                                  Thigh: {metric.thigh}{formatUnit('measurement')}
                                </span>
                              )}
                              {metric.bicep && (
                                <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">
                                  Bicep: {metric.bicep}{formatUnit('measurement')}
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
                onClick={() => setLocation('/add-body-metrics')}
                className="bg-blue-600 hover:bg-blue-700 text-white ios-touch-feedback touch-target"
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