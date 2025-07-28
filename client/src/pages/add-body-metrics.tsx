import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Scale, Ruler, TrendingUp, ArrowLeft, Save } from "lucide-react";
import { useLocation } from "wouter";

export function AddBodyMetricsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
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

  // Get current user ID (you may need to adjust this based on your auth system)
  const userId = 1; // Replace with actual user ID from auth context

  const formatUnit = (type: 'weight' | 'measurement') => {
    if (type === 'weight') {
      return unit === 'metric' ? 'kg' : 'lbs';
    }
    return unit === 'metric' ? 'cm' : 'in';
  };

  const syncWeightToProfile = async (weight: number) => {
    await apiRequest('PUT', '/api/user/profile', { weight });
  };

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
      toast({
        title: "Success",
        description: "Body metrics logged successfully!",
      });
      
      // Navigate back to nutrition page
      setLocation('/nutrition');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to log body metrics. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if at least one field is filled
    const hasData = Object.entries(formData).some(([key, value]) => 
      key !== 'date' && value && value.trim() !== ''
    );
    
    if (!hasData) {
      toast({
        title: "Error",
        description: "Please enter at least one measurement.",
        variant: "destructive",
      });
      return;
    }

    const metricData = {
      userId,
      date: formData.date,
      unit,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      bodyFatPercentage: formData.bodyFatPercentage ? parseFloat(formData.bodyFatPercentage) : null,
      neck: formData.neck ? parseFloat(formData.neck) : null,
      chest: formData.chest ? parseFloat(formData.chest) : null,
      waist: formData.waist ? parseFloat(formData.waist) : null,
      hips: formData.hips ? parseFloat(formData.hips) : null,
      thigh: formData.thigh ? parseFloat(formData.thigh) : null,
      bicep: formData.bicep ? parseFloat(formData.bicep) : null,
    };

    addMetricMutation.mutate(metricData);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - Ultra-Compact Single Row (44px height) */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-11 flex items-center justify-between px-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/nutrition')}
            className="p-2 h-8 w-8 ios-touch-feedback"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Log Body Metrics</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <Card className="shadow-lg border-0 bg-white dark:bg-gray-900 max-w-2xl mx-auto">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-100 dark:border-blue-800">
            <div>
              <CardTitle className="text-xl font-bold text-black dark:text-white">Track Your Progress</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Enter your body measurements to monitor your fitness journey</CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date and Unit Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date
                  </Label>
                  <Input
                    type="date"
                    id="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Unit System
                  </Label>
                  <Select value={unit} onValueChange={(value: 'metric' | 'imperial') => setUnit(value)}>
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
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/nutrition')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addMetricMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                >
                  {addMetricMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="ios-spinner" />
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Entry
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}