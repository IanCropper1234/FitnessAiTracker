import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, X, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ExerciseSelector } from '@/components/exercise-selector';

interface Exercise {
  id: number;
  name: string;
  category: string;
  primaryMuscle: string;
  muscleGroups: string[];
  equipment: string;
  difficulty: string;
  instructions: string;
}

interface TemplateExercise {
  id: number;
  exerciseId: number;
  name: string;
  category: string;
  muscleGroups: string[];
  primaryMuscle: string;
  equipment: string;
  difficulty: string;
  sets: number;
  targetReps: string;
  restPeriod: number;
  notes?: string;
  specialTrainingMethod?: string;
  specialMethodConfig?: any;
}

interface TemplateWorkout {
  name: string;
  exercises: TemplateExercise[];
  estimatedDuration: number;
  focus: string[];
}

interface TemplateData {
  workouts: TemplateWorkout[];
}

export default function CreateTrainingTemplate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    daysPerWeek: 4,
    templateData: {
      workouts: Array.from({ length: 4 }, (_, i) => ({
        name: `Day ${i + 1}`,
        exercises: [],
        estimatedDuration: 45,
        focus: []
      }))
    } as TemplateData
  });

  const currentWorkout = formData.templateData.workouts[currentWorkoutIndex] || {
    name: '',
    exercises: [],
    estimatedDuration: 45,
    focus: []
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('/api/training/templates', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "成功創建訓練範本",
        description: "您的自定義訓練範本已成功創建"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/training/templates'] });
      setLocation('/training');
    },
    onError: (error: any) => {
      toast({
        title: "創建失敗",
        description: error.message || "創建訓練範本時發生錯誤",
        variant: "destructive"
      });
    }
  });

  const updateWorkout = (index: number, workout: TemplateWorkout) => {
    setFormData(prev => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        workouts: prev.templateData.workouts.map((w, i) => i === index ? workout : w)
      }
    }));
  };

  const addExerciseToCurrentWorkout = (exercise: Exercise) => {
    const newExercise: TemplateExercise = {
      id: exercise.id,
      exerciseId: exercise.id,
      name: exercise.name,
      category: exercise.category,
      muscleGroups: exercise.muscleGroups,
      primaryMuscle: exercise.primaryMuscle,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      sets: 3,
      targetReps: "8-12",
      restPeriod: 120,
      notes: ""
    };

    const updatedWorkout = {
      ...currentWorkout,
      exercises: [...currentWorkout.exercises, newExercise]
    };

    updateWorkout(currentWorkoutIndex, updatedWorkout);
  };

  const removeExerciseFromCurrentWorkout = (exerciseId: number) => {
    const updatedWorkout = {
      ...currentWorkout,
      exercises: currentWorkout.exercises.filter(ex => ex.exerciseId !== exerciseId)
    };

    updateWorkout(currentWorkoutIndex, updatedWorkout);
  };

  const updateExercise = (exerciseIndex: number, updates: Partial<TemplateExercise>) => {
    const updatedWorkout = {
      ...currentWorkout,
      exercises: currentWorkout.exercises.map((ex, i) => 
        i === exerciseIndex ? { ...ex, ...updates } : ex
      )
    };

    updateWorkout(currentWorkoutIndex, updatedWorkout);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast({
        title: "請填寫必要資訊",
        description: "範本名稱和描述為必填項目",
        variant: "destructive"
      });
      return;
    }

    if (formData.templateData.workouts.some(w => w.exercises.length === 0)) {
      toast({
        title: "請添加運動",
        description: "每個訓練日都需要至少添加一個運動",
        variant: "destructive"
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const canProceedToStep2 = formData.name.trim() && formData.description.trim();
  const canComplete = formData.templateData.workouts.every(w => w.exercises.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/training')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
            <div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={step === 1 ? "default" : "secondary"}>
              步驟 1: 基本設定
            </Badge>
            <Badge variant={step === 2 ? "default" : "secondary"}>
              步驟 2: 配置運動
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto p-6 max-w-6xl">
        
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>範本基本資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">範本名稱 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="例如：我的自定義推拉訓練"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">難度等級</Label>
                    <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">初學者</SelectItem>
                        <SelectItem value="intermediate">中級</SelectItem>
                        <SelectItem value="advanced">高級</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">範本描述 *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="描述您的訓練範本的特色和目標..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="daysPerWeek">每週訓練天數</Label>
                  <Select value={formData.daysPerWeek.toString()} onValueChange={(value) => {
                    const days = parseInt(value);
                    setFormData(prev => ({ 
                      ...prev, 
                      daysPerWeek: days,
                      templateData: {
                        ...prev.templateData,
                        workouts: Array.from({ length: days }, (_, i) => ({
                          name: `第 ${i + 1} 天`,
                          exercises: [],
                          estimatedDuration: 45,
                          focus: []
                        }))
                      }
                    }));
                    setCurrentWorkoutIndex(0);
                  }}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 天</SelectItem>
                      <SelectItem value="4">4 天</SelectItem>
                      <SelectItem value="5">5 天</SelectItem>
                      <SelectItem value="6">6 天</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="flex items-center gap-2"
              >
                下一步：配置運動
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Configure Workouts */}
        {step === 2 && (
          <div className="space-y-6">
            
            {/* Workout Navigation */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>配置訓練日</CardTitle>
                    
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentWorkoutIndex(Math.max(0, currentWorkoutIndex - 1))}
                      disabled={currentWorkoutIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一個
                    </Button>
                    <span className="text-sm font-medium px-3 py-1 bg-muted rounded">
                      {currentWorkoutIndex + 1} / {formData.templateData.workouts.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentWorkoutIndex(Math.min(formData.templateData.workouts.length - 1, currentWorkoutIndex + 1))}
                      disabled={currentWorkoutIndex === formData.templateData.workouts.length - 1}
                    >
                      下一個
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Label htmlFor="workoutName">訓練日名稱：</Label>
                  <Input
                    id="workoutName"
                    value={currentWorkout.name}
                    onChange={(e) => updateWorkout(currentWorkoutIndex, { ...currentWorkout, name: e.target.value })}
                    className="w-64"
                    placeholder="例如：胸部和三頭肌"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Exercise Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Exercise Library */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    添加運動
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 overflow-y-auto">
                    <ExerciseSelector
                      selectedExercises={currentWorkout.exercises}
                      onExercisesChange={(exercises) => {
                        // Ensure each exercise has the required exerciseId property for TemplateExercise compatibility
                        const templateExercises = exercises.map(exercise => ({
                          ...exercise,
                          exerciseId: exercise.exerciseId || exercise.id, // Ensure exerciseId is present
                          sets: exercise.sets || 3,
                          targetReps: exercise.targetReps || "8-12",
                          restPeriod: exercise.restPeriod || 120,
                          notes: exercise.notes || ""
                        }));
                        updateWorkout(currentWorkoutIndex, { ...currentWorkout, exercises: templateExercises });
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Selected Exercises Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    運動配置
                    <Badge variant="secondary">{currentWorkout.exercises.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {currentWorkout.exercises.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>還沒有添加任何運動</p>
                        <p className="text-sm">從左側選擇運動來開始配置</p>
                      </div>
                    ) : (
                      currentWorkout.exercises.map((exercise, index) => (
                        <Card key={`${exercise.exerciseId}-${index}`} className="border-l-4 border-l-primary">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{exercise.name}</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeExerciseFromCurrentWorkout(exercise.exerciseId)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs">組數</Label>
                                <Input
                                  type="number"
                                  value={exercise.sets}
                                  onChange={(e) => updateExercise(index, { sets: parseInt(e.target.value) || 1 })}
                                  min="1"
                                  max="10"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">目標次數</Label>
                                <Input
                                  value={exercise.targetReps}
                                  onChange={(e) => updateExercise(index, { targetReps: e.target.value })}
                                  placeholder="8-12"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">休息時間(秒)</Label>
                                <Input
                                  type="number"
                                  value={exercise.restPeriod}
                                  onChange={(e) => updateExercise(index, { restPeriod: parseInt(e.target.value) || 60 })}
                                  min="30"
                                  max="300"
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="text-xs">特殊訓練方法</Label>
                              <Select 
                                value={exercise.specialTrainingMethod || "none"} 
                                onValueChange={(value) => {
                                  if (value === "none") {
                                    updateExercise(index, { 
                                      specialTrainingMethod: undefined,
                                      specialMethodConfig: undefined 
                                    });
                                  } else {
                                    updateExercise(index, { 
                                      specialTrainingMethod: value,
                                      specialMethodConfig: getDefaultSpecialMethodConfig(value)
                                    });
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">無特殊方法</SelectItem>
                                  <SelectItem value="dropSet">遞減組 (Drop Set)</SelectItem>
                                  <SelectItem value="myorepMatch">Myorep Match</SelectItem>
                                  <SelectItem value="myorepNoMatch">Myorep No Match</SelectItem>
                                  <SelectItem value="giantSet">巨大組 (Giant Set)</SelectItem>
                                  <SelectItem value="superset">超級組 (Superset)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {exercise.specialTrainingMethod && (
                              <SpecialMethodConfigurationPanel
                                method={exercise.specialTrainingMethod}
                                config={exercise.specialMethodConfig}
                                onConfigChange={(config) => updateExercise(index, { specialMethodConfig: config })}
                              />
                            )}

                            <div>
                              <Label className="text-xs">備註</Label>
                              <Textarea
                                value={exercise.notes || ''}
                                onChange={(e) => updateExercise(index, { notes: e.target.value })}
                                placeholder="運動相關備註..."
                                rows={2}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                返回基本設定
              </Button>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setLocation('/training')}>
                  取消
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || !canComplete}
                  className="flex items-center gap-2"
                >
                  {createMutation.isPending ? '創建中...' : '創建範本'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Special Method Configuration Panel Component
function SpecialMethodConfigurationPanel({
  method,
  config,
  onConfigChange
}: {
  method: string;
  config: any;
  onConfigChange: (config: any) => void;
}) {
  const renderConfig = () => {
    switch (method) {
      case 'dropSet':
        return (
          <div className="space-y-3 p-3 bg-muted/50 rounded">
            <h5 className="text-sm font-medium">遞減組設定</h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">遞減次數</Label>
                <Input
                  type="number"
                  value={config?.drops || 2}
                  onChange={(e) => onConfigChange({ ...config, drops: parseInt(e.target.value) || 2 })}
                  min="1"
                  max="4"
                />
              </div>
              <div>
                <Label className="text-xs">重量減少(%)</Label>
                <Input
                  type="number"
                  value={config?.weightReduction || 20}
                  onChange={(e) => onConfigChange({ ...config, weightReduction: parseInt(e.target.value) || 20 })}
                  min="10"
                  max="50"
                />
              </div>
            </div>
          </div>
        );

      case 'myorepMatch':
      case 'myorepNoMatch':
        return (
          <div className="space-y-3 p-3 bg-muted/50 rounded">
            <h5 className="text-sm font-medium">
              {method === 'myorepMatch' ? 'Myorep Match 設定' : 'Myorep No Match 設定'}
            </h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">激活組次數</Label>
                <Input
                  type="number"
                  value={config?.activationReps || 12}
                  onChange={(e) => onConfigChange({ ...config, activationReps: parseInt(e.target.value) || 12 })}
                  min="8"
                  max="20"
                />
              </div>
              <div>
                <Label className="text-xs">追加組次數</Label>
                <Input
                  type="number"
                  value={config?.backoffReps || 5}
                  onChange={(e) => onConfigChange({ ...config, backoffReps: parseInt(e.target.value) || 5 })}
                  min="3"
                  max="10"
                />
              </div>
            </div>
          </div>
        );

      case 'giantSet':
        return (
          <div className="space-y-3 p-3 bg-muted/50 rounded">
            <h5 className="text-sm font-medium">巨大組設定</h5>
            <div>
              <Label className="text-xs">運動數量</Label>
              <Input
                type="number"
                value={config?.exerciseCount || 4}
                onChange={(e) => onConfigChange({ ...config, exerciseCount: parseInt(e.target.value) || 4 })}
                min="3"
                max="6"
              />
            </div>
            <div>
              <Label className="text-xs">組間休息(秒)</Label>
              <Input
                type="number"
                value={config?.restBetweenExercises || 15}
                onChange={(e) => onConfigChange({ ...config, restBetweenExercises: parseInt(e.target.value) || 15 })}
                min="0"
                max="60"
              />
            </div>
          </div>
        );

      case 'superset':
        return (
          <div className="space-y-3 p-3 bg-muted/50 rounded">
            <h5 className="text-sm font-medium">超級組設定</h5>
            <div>
              <Label className="text-xs">配對運動</Label>
              <Input
                value={config?.pairedExercise || ''}
                onChange={(e) => onConfigChange({ ...config, pairedExercise: e.target.value })}
                placeholder="輸入配對運動名稱"
              />
            </div>
            <div>
              <Label className="text-xs">運動間休息(秒)</Label>
              <Input
                type="number"
                value={config?.restBetweenExercises || 10}
                onChange={(e) => onConfigChange({ ...config, restBetweenExercises: parseInt(e.target.value) || 10 })}
                min="0"
                max="30"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderConfig();
}

// Helper function to get default config for special methods
function getDefaultSpecialMethodConfig(method: string): any {
  switch (method) {
    case 'dropSet':
      return { drops: 2, weightReduction: 20 };
    case 'myorepMatch':
    case 'myorepNoMatch':
      return { activationReps: 12, backoffReps: 5 };
    case 'giantSet':
      return { exerciseCount: 4, restBetweenExercises: 15 };
    case 'superset':
      return { pairedExercise: '', restBetweenExercises: 10 };
    default:
      return {};
  }
}