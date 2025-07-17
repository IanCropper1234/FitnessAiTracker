import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Scale, Ruler, TrendingUp, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingMetric, setIsAddingMetric] = useState(false);
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
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
      setFormData({
        date: new Date().toISOString().split('T')[0],
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

  const getLatestMetric = () => {
    if (!metrics || metrics.length === 0) return null;
    return metrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
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
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5" />
              Body Tracking
            </div>
            <Button
              onClick={() => setIsAddingMetric(!isAddingMetric)}
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Metrics
            </Button>
          </CardTitle>
          <CardDescription>Track your weight, body fat, and measurements</CardDescription>
        </CardHeader>
      </Card>

      {/* Current Stats */}
      {latestMetric && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {latestMetric.weight && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Weight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black dark:text-white">
                  {latestMetric.weight} {formatUnit('weight')}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date(latestMetric.date).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          )}

          {latestMetric.bodyFatPercentage && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Body Fat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black dark:text-white">
                  {latestMetric.bodyFatPercentage}%
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date(latestMetric.date).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          )}

          {latestMetric.waist && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Waist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black dark:text-white">
                  {latestMetric.waist} {formatUnit('measurement')}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date(latestMetric.date).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          )}

          {latestMetric.chest && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Chest
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black dark:text-white">
                  {latestMetric.chest} {formatUnit('measurement')}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date(latestMetric.date).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add Metrics Form */}
      {isAddingMetric && (
        <Card>
          <CardHeader>
            <CardTitle>Add Body Metrics</CardTitle>
            <CardDescription>Record your weight, body fat, and measurements</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    type="date"
                    id="date"
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
                      <SelectItem value="imperial">Imperial (lbs/inches)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Weight ({formatUnit('weight')})</Label>
                  <Input
                    type="number"
                    step="0.1"
                    id="weight"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="Enter weight"
                  />
                </div>
                <div>
                  <Label htmlFor="bodyFatPercentage">Body Fat Percentage (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    id="bodyFatPercentage"
                    value={formData.bodyFatPercentage}
                    onChange={(e) => setFormData({ ...formData, bodyFatPercentage: e.target.value })}
                    placeholder="Enter body fat %"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="neck">Neck ({formatUnit('measurement')})</Label>
                  <Input
                    type="number"
                    step="0.1"
                    id="neck"
                    value={formData.neck}
                    onChange={(e) => setFormData({ ...formData, neck: e.target.value })}
                    placeholder="Neck"
                  />
                </div>
                <div>
                  <Label htmlFor="chest">Chest ({formatUnit('measurement')})</Label>
                  <Input
                    type="number"
                    step="0.1"
                    id="chest"
                    value={formData.chest}
                    onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
                    placeholder="Chest"
                  />
                </div>
                <div>
                  <Label htmlFor="waist">Waist ({formatUnit('measurement')})</Label>
                  <Input
                    type="number"
                    step="0.1"
                    id="waist"
                    value={formData.waist}
                    onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                    placeholder="Waist"
                  />
                </div>
                <div>
                  <Label htmlFor="hips">Hips ({formatUnit('measurement')})</Label>
                  <Input
                    type="number"
                    step="0.1"
                    id="hips"
                    value={formData.hips}
                    onChange={(e) => setFormData({ ...formData, hips: e.target.value })}
                    placeholder="Hips"
                  />
                </div>
                <div>
                  <Label htmlFor="thigh">Thigh ({formatUnit('measurement')})</Label>
                  <Input
                    type="number"
                    step="0.1"
                    id="thigh"
                    value={formData.thigh}
                    onChange={(e) => setFormData({ ...formData, thigh: e.target.value })}
                    placeholder="Thigh"
                  />
                </div>
                <div>
                  <Label htmlFor="bicep">Bicep ({formatUnit('measurement')})</Label>
                  <Input
                    type="number"
                    step="0.1"
                    id="bicep"
                    value={formData.bicep}
                    onChange={(e) => setFormData({ ...formData, bicep: e.target.value })}
                    placeholder="Bicep"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={addMetricMutation.isPending}>
                  {addMetricMutation.isPending ? "Adding..." : "Add Metrics"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAddingMetric(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Metrics History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Metrics History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics && metrics.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {metrics.map((metric) => (
                <div
                  key={metric.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-black dark:text-white mb-2">
                      {new Date(metric.date).toLocaleDateString()}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {metric.weight && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Weight: </span>
                          <span className="font-medium">{metric.weight} {formatUnit('weight')}</span>
                        </div>
                      )}
                      {metric.bodyFatPercentage && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Body Fat: </span>
                          <span className="font-medium">{metric.bodyFatPercentage}%</span>
                        </div>
                      )}
                      {metric.waist && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Waist: </span>
                          <span className="font-medium">{metric.waist} {formatUnit('measurement')}</span>
                        </div>
                      )}
                      {metric.chest && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Chest: </span>
                          <span className="font-medium">{metric.chest} {formatUnit('measurement')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMetricMutation.mutate(metric.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    disabled={deleteMetricMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <Scale className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No body metrics recorded yet</p>
              <p className="text-sm">Start tracking your progress with weight and measurements</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}