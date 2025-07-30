import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Target, TrendingUp, TrendingDown, Minus, Plus, Trash2 } from "lucide-react";
// convertValue function for unit conversion
const convertValue = (value: number, type: 'weight' | 'measurement', fromUnit: 'metric' | 'imperial', toUnit: 'metric' | 'imperial'): number => {
  if (fromUnit === toUnit || !value) return value;
  
  if (type === 'weight') {
    if (fromUnit === 'metric' && toUnit === 'imperial') {
      return Math.round(value * 2.20462 * 10) / 10; // kg to lbs
    } else if (fromUnit === 'imperial' && toUnit === 'metric') {
      return Math.round(value * 0.453592 * 10) / 10; // lbs to kg
    }
  }
  return value;
};

interface WeightGoal {
  id: number;
  userId: number;
  currentWeight?: number;
  targetWeight: number;
  targetWeightChangePerWeek?: number;
  goalType: 'cutting' | 'bulking' | 'maintenance';
  unit: 'metric' | 'imperial';
  startDate: string;
  targetDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WeightGoalsProps {
  userId: number;
  userWeightUnit?: 'metric' | 'imperial';
}

export function WeightGoals({ userId, userWeightUnit = 'metric' }: WeightGoalsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingGoal, setIsAddingGoal] = useState(false);

  const [formData, setFormData] = useState({
    currentWeight: '',
    targetWeight: '',
    targetWeightChangePerWeek: '',
    goalType: 'maintenance' as 'cutting' | 'bulking' | 'maintenance',
    unit: userWeightUnit,
    targetDate: ''
  });

  // Fetch weight goals
  const { data: weightGoals, isLoading } = useQuery<WeightGoal[]>({
    queryKey: ['/api/weight-goals', userId],
    queryFn: async () => {
      const response = await fetch(`/api/weight-goals/${userId}`);
      return response.json();
    }
  });

  // Create weight goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      return await apiRequest("POST", "/api/weight-goals", goalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/weight-goals', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/comprehensive', userId] });
      setIsAddingGoal(false);
      setFormData({
        currentWeight: '',
        targetWeight: '',
        targetWeightChangePerWeek: '',
        goalType: 'maintenance',
        unit: userWeightUnit,
        targetDate: ''
      });
      toast({
        title: "Success",
        description: "Weight goal created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create weight goal",
        variant: "destructive"
      });
    }
  });

  // Delete weight goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: number) => {
      return await apiRequest("DELETE", `/api/weight-goals/${goalId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/weight-goals', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/comprehensive', userId] });
      toast({
        title: "Success",
        description: "Weight goal deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete weight goal",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = () => {
    if (!formData.targetWeight) {
      toast({
        title: "Error",
        description: "Target weight is required",
        variant: "destructive"
      });
      return;
    }

    const goalData = {
      userId,
      currentWeight: formData.currentWeight ? parseFloat(formData.currentWeight) : null,
      targetWeight: parseFloat(formData.targetWeight),
      targetWeightChangePerWeek: formData.targetWeightChangePerWeek ? parseFloat(formData.targetWeightChangePerWeek) : null,
      goalType: formData.goalType,
      unit: formData.unit,
      targetDate: formData.targetDate ? new Date(formData.targetDate).toISOString() : null
    };

    createGoalMutation.mutate(goalData);
  };

  const activeGoal = weightGoals?.find(goal => goal.isActive);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Weight Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Weight Goals
        </CardTitle>
        <CardDescription>
          Set and track your weight targets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeGoal ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {activeGoal.goalType === 'cutting' && (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  {activeGoal.goalType === 'bulking' && (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  )}
                  {activeGoal.goalType === 'maintenance' && (
                    <Minus className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="font-medium capitalize">{activeGoal.goalType}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Target: {Math.round(convertValue(
                    activeGoal.targetWeight, 
                    activeGoal.unit, 
                    userWeightUnit
                  ))} {userWeightUnit === 'metric' ? 'kg' : 'lbs'}
                </div>
                {activeGoal.targetWeightChangePerWeek && (
                  <div className="text-sm text-muted-foreground">
                    {Math.abs(activeGoal.targetWeightChangePerWeek)} {activeGoal.unit === 'metric' ? 'kg' : 'lbs'}/week
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteGoalMutation.mutate(activeGoal.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No weight goal set</p>
            <p className="text-sm">Set a target to track your progress</p>
          </div>
        )}

        {!isAddingGoal ? (
          <Button
            onClick={() => setIsAddingGoal(true)}
            className="w-full"
            variant={activeGoal ? "outline" : "default"}
          >
            <Plus className="w-4 h-4 mr-2" />
            {activeGoal ? "Update Goal" : "Set Weight Goal"}
          </Button>
        ) : (
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="currentWeight">Current Weight</Label>
                <Input
                  id="currentWeight"
                  type="number"
                  step="0.1"
                  value={formData.currentWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentWeight: e.target.value }))}
                  placeholder={`${userWeightUnit === 'metric' ? 'kg' : 'lbs'}`}
                />
              </div>
              <div>
                <Label htmlFor="targetWeight">Target Weight *</Label>
                <Input
                  id="targetWeight"
                  type="number"
                  step="0.1"
                  value={formData.targetWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetWeight: e.target.value }))}
                  placeholder={`${userWeightUnit === 'metric' ? 'kg' : 'lbs'}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="goalType">Goal Type</Label>
                <Select
                  value={formData.goalType}
                  onValueChange={(value: 'cutting' | 'bulking' | 'maintenance') => 
                    setFormData(prev => ({ ...prev, goalType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cutting">Fat Loss</SelectItem>
                    <SelectItem value="bulking">Muscle Gain</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="weeklyChange">Weekly Change</Label>
                <Input
                  id="weeklyChange"
                  type="number"
                  step="0.1"
                  value={formData.targetWeightChangePerWeek}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetWeightChangePerWeek: e.target.value }))}
                  placeholder={`${userWeightUnit === 'metric' ? 'kg' : 'lbs'}/week`}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="targetDate">Target Date (Optional)</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={createGoalMutation.isPending}
                className="flex-1"
              >
                {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddingGoal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}