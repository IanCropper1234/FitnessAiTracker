import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Activity, 
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Filter,
  ArrowLeft
} from "lucide-react";
import { useLocation } from "wouter";

interface VolumeData {
  week: string;
  mv: number;  // Minimum Effective Volume
  mev: number; // Maximum Effective Volume 
  mav: number; // Maximum Adaptive Volume
  mrv: number; // Maximum Recoverable Volume
  actual: number;
  adherence: number;
}

interface MuscleGroupVolume {
  muscleGroup: string;
  currentVolume: number;
  targetVolume: number;
  percentage: number;
  color: string;
}

interface ExerciseProgress {
  exerciseName: string;
  sessions: Array<{
    date: string;
    weight: number;
    reps: number;
    volume: number;
  }>;
}

export default function TrainingAnalytics() {
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState<string>("4weeks");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("all");

  // Fetch analytics data
  const { data: volumeProgression, isLoading: volumeLoading } = useQuery({
    queryKey: ['/api/analytics/volume-progression', timeRange],
  });

  const { data: muscleGroupData, isLoading: muscleLoading } = useQuery({
    queryKey: ['/api/analytics/muscle-group-distribution', timeRange],
  });

  const { data: exerciseProgress, isLoading: exerciseLoading } = useQuery({
    queryKey: ['/api/analytics/exercise-progress', timeRange, selectedMuscleGroup],
  });

  const { data: rpMetrics, isLoading: rpLoading } = useQuery({
    queryKey: ['/api/analytics/rp-metrics', timeRange],
  });

  // Mock data for development - will be replaced with real API data
  const mockVolumeData: VolumeData[] = [
    { week: "Week 1", mv: 10, mev: 14, mav: 18, mrv: 22, actual: 16, adherence: 89 },
    { week: "Week 2", mv: 10, mev: 14, mav: 18, mrv: 22, actual: 18, adherence: 95 },
    { week: "Week 3", mv: 10, mev: 14, mav: 18, mrv: 22, actual: 20, adherence: 91 },
    { week: "Week 4", mv: 10, mev: 14, mav: 18, mrv: 22, actual: 15, adherence: 83 },
  ];

  const mockMuscleData: MuscleGroupVolume[] = [
    { muscleGroup: "Chest", currentVolume: 18, targetVolume: 16, percentage: 112, color: "#FF6B6B" },
    { muscleGroup: "Back", currentVolume: 22, targetVolume: 20, percentage: 110, color: "#4ECDC4" },
    { muscleGroup: "Shoulders", currentVolume: 14, targetVolume: 14, percentage: 100, color: "#45B7D1" },
    { muscleGroup: "Arms", currentVolume: 16, targetVolume: 18, percentage: 89, color: "#96CEB4" },
    { muscleGroup: "Legs", currentVolume: 24, targetVolume: 22, percentage: 109, color: "#FFEAA7" },
  ];

  const mockExerciseProgress: ExerciseProgress[] = [
    {
      exerciseName: "Bench Press",
      sessions: [
        { date: "2025-07-14", weight: 100, reps: 8, volume: 800 },
        { date: "2025-07-21", weight: 102.5, reps: 8, volume: 820 },
        { date: "2025-07-28", weight: 105, reps: 8, volume: 840 },
        { date: "2025-08-04", weight: 107.5, reps: 8, volume: 860 },
      ]
    },
    {
      exerciseName: "Squat",
      sessions: [
        { date: "2025-07-15", weight: 120, reps: 6, volume: 720 },
        { date: "2025-07-22", weight: 125, reps: 6, volume: 750 },
        { date: "2025-07-29", weight: 127.5, reps: 6, volume: 765 },
        { date: "2025-08-05", weight: 130, reps: 6, volume: 780 },
      ]
    }
  ];

  const isLoading = volumeLoading || muscleLoading || exerciseLoading || rpLoading;

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Training Analytics</h1>
            <p className="text-sm text-muted-foreground">Renaissance Periodization Volume Analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Time Range</label>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4weeks">Last 4 Weeks</SelectItem>
              <SelectItem value="8weeks">Last 8 Weeks</SelectItem>
              <SelectItem value="12weeks">Last 12 Weeks</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Muscle Group</label>
          <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Muscle Groups</SelectItem>
              <SelectItem value="chest">Chest</SelectItem>
              <SelectItem value="back">Back</SelectItem>
              <SelectItem value="shoulders">Shoulders</SelectItem>
              <SelectItem value="arms">Arms</SelectItem>
              <SelectItem value="legs">Legs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* RP Volume Progression */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              RP Volume Progression
            </CardTitle>
            <Badge variant="outline">
              <Target className="h-3 w-3 mr-1" />
              MEV-MAV Zone
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse">Loading volume data...</div>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff',
                      border: '2px solid #e2e8f0',
                      borderRadius: '6px',
                      color: '#1a1a1a',
                      fontSize: '13px',
                      fontWeight: '500',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      padding: '12px',
                      lineHeight: '1.5',
                      minWidth: '200px'
                    }}
                    labelStyle={{ 
                      color: '#1a1a1a', 
                      fontWeight: '700',
                      fontSize: '14px',
                      marginBottom: '6px'
                    }}
                    separator=" : "
                    itemStyle={{ 
                      color: '#374151',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  />
                  <Legend />
                  {/* RP Volume Zones */}
                  <Line type="monotone" dataKey="mv" stroke="#ef4444" strokeDasharray="5 5" name="MV (Minimum Volume)" />
                  <Line type="monotone" dataKey="mev" stroke="#f97316" strokeDasharray="5 5" name="MEV (Min Effective)" />
                  <Line type="monotone" dataKey="mav" stroke="#eab308" strokeDasharray="5 5" name="MAV (Max Adaptive)" />
                  <Line type="monotone" dataKey="mrv" stroke="#dc2626" strokeDasharray="5 5" name="MRV (Max Recoverable)" />
                  {/* Actual Volume */}
                  <Line type="monotone" dataKey="actual" stroke="#22c55e" strokeWidth={3} name="Actual Volume" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {/* Volume Zone Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Current Week</div>
              <div className="text-lg font-bold text-green-400">15 Sets</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Adherence</div>
              <div className="text-lg font-bold text-blue-400">83%</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Zone</div>
              <div className="text-lg font-bold text-orange-400">MEV</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Fatigue</div>
              <div className="text-lg font-bold text-yellow-400">Moderate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Muscle Group Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Muscle Group Volume Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockMuscleData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={30}
                    fill="#8884d8"
                    dataKey="currentVolume"
                    label={false}
                  >
                    {mockMuscleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border-2 border-gray-200 rounded-md shadow-lg p-3 min-w-[200px]">
                            <div className="font-bold text-gray-900 mb-2 text-sm">
                              {data.muscleGroup}
                            </div>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Current Volume:</span>
                                <span className="font-medium text-gray-900">{data.currentVolume} sets</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Target Volume:</span>
                                <span className="font-medium text-gray-900">{data.targetVolume} sets</span>
                              </div>
                              <div className="flex justify-between pt-1 border-t border-gray-200">
                                <span className="text-gray-600">Adherence:</span>
                                <span className={`font-bold ${data.percentage >= 100 ? 'text-green-600' : data.percentage >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {data.percentage}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                    contentStyle={{ 
                      backgroundColor: '#ffffff',
                      border: '2px solid #e2e8f0',
                      borderRadius: '6px',
                      color: '#1a1a1a',
                      fontSize: '13px',
                      fontWeight: '500',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      padding: '12px',
                      lineHeight: '1.5',
                      minWidth: '200px'
                    }}
                    labelStyle={{ 
                      color: '#1a1a1a', 
                      fontWeight: '700',
                      fontSize: '14px',
                      marginBottom: '8px'
                    }}
                    itemStyle={{ 
                      color: '#374151',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Volume Comparison */}
            <div className="space-y-2">
              {mockMuscleData.map((muscle) => (
                <div key={muscle.muscleGroup} className="flex items-center justify-between p-2.5 bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-4 h-4 flex-shrink-0" 
                      style={{ backgroundColor: muscle.color }}
                    />
                    <span className="font-medium text-sm truncate">{muscle.muscleGroup}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-xs text-muted-foreground text-right">
                      {muscle.currentVolume}/{muscle.targetVolume} sets
                    </div>
                    <Badge 
                      variant={muscle.percentage >= 100 ? "default" : "secondary"}
                      className="text-xs min-w-[45px] text-center"
                    >
                      {muscle.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Exercise Progression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-6">
              {mockExerciseProgress.map((exercise) => (
                <div key={exercise.exerciseName} className="space-y-3">
                  <h4 className="font-medium text-sm">{exercise.exerciseName}</h4>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={exercise.sessions}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis yAxisId="weight" orientation="left" />
                        <YAxis yAxisId="volume" orientation="right" />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          contentStyle={{ 
                            backgroundColor: '#ffffff',
                            border: '2px solid #e2e8f0',
                            borderRadius: '6px',
                            color: '#1a1a1a',
                            fontSize: '13px',
                            fontWeight: '500',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            padding: '12px',
                            lineHeight: '1.5',
                            minWidth: '180px'
                          }}
                          labelStyle={{ 
                            color: '#1a1a1a', 
                            fontWeight: '700',
                            fontSize: '14px',
                            marginBottom: '6px'
                          }}
                          separator=" : "
                          itemStyle={{ 
                            color: '#374151',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        />
                        <Line 
                          yAxisId="weight" 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#8884d8" 
                          name="Weight (kg)"
                        />
                        <Line 
                          yAxisId="volume" 
                          type="monotone" 
                          dataKey="volume" 
                          stroke="#82ca9d" 
                          name="Volume"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Progress Summary */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-xs text-muted-foreground">Start Weight</div>
                      <div className="text-sm font-medium">{exercise.sessions[0]?.weight}kg</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Current Weight</div>
                      <div className="text-sm font-medium">{exercise.sessions[exercise.sessions.length - 1]?.weight}kg</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Progress</div>
                      <div className="text-sm font-medium text-green-400">
                        +{((exercise.sessions[exercise.sessions.length - 1]?.weight - exercise.sessions[0]?.weight) / exercise.sessions[0]?.weight * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* RP Fatigue Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Fatigue & Recovery Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-500/10 border border-green-500/20">
              <div className="text-sm text-green-400 mb-1">Recovery Status</div>
              <div className="text-lg font-bold text-green-400">Good</div>
              <div className="text-xs text-muted-foreground mt-1">Ready for progression</div>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/20">
              <div className="text-sm text-yellow-400 mb-1">Systemic Fatigue</div>
              <div className="text-lg font-bold text-yellow-400">Moderate</div>
              <div className="text-xs text-muted-foreground mt-1">Consider deload soon</div>
            </div>
            <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20">
              <div className="text-sm text-blue-400 mb-1">Volume Tolerance</div>
              <div className="text-lg font-bold text-blue-400">High</div>
              <div className="text-xs text-muted-foreground mt-1">Within MAV zone</div>
            </div>
            <div className="text-center p-4 bg-purple-500/10 border border-purple-500/20">
              <div className="text-sm text-purple-400 mb-1">Next Phase</div>
              <div className="text-lg font-bold text-purple-400">Week 2</div>
              <div className="text-xs text-muted-foreground mt-1">Volume increase</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}