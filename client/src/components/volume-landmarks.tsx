import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TrendingUp, Target, Activity, BarChart3, Info } from "lucide-react";

interface MuscleGroup {
  id: number;
  name: string;
  category: string;
  bodyPart: string;
  priority: number;
  translations: Record<string, string>;
}

interface VolumeLandmark {
  id: number;
  userId: number;
  muscleGroupId: number;
  mv: number; // Maintenance Volume
  mev: number; // Minimum Effective Volume
  mav: number; // Maximum Adaptive Volume
  mrv: number; // Maximum Recoverable Volume
  currentVolume: number;
  targetVolume: number;
  recoveryLevel: number;
  adaptationLevel: number;
  lastUpdated: string;
  muscleGroup?: MuscleGroup;
}

export function VolumeLandmarks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<number | null>(null);

  // Get volume landmarks for user
  const { data: volumeLandmarks, isLoading } = useQuery({
    queryKey: ["/api/training/volume-landmarks", 1], // TODO: Get user ID from context
    queryFn: () => apiRequest("GET", "/api/training/volume-landmarks/1")
  });

  // Update volume landmark mutation
  const updateLandmarkMutation = useMutation({
    mutationFn: async ({ muscleGroupId, data }: { muscleGroupId: number; data: Partial<VolumeLandmark> }) => {
      return apiRequest("PUT", `/api/training/volume-landmarks/1/${muscleGroupId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Volume Landmarks Updated",
        description: "Your volume landmarks have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training/volume-landmarks"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update volume landmarks.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateLandmark = (muscleGroupId: number, field: string, value: number) => {
    updateLandmarkMutation.mutate({
      muscleGroupId,
      data: { [field]: value }
    });
  };

  const getVolumeZone = (current: number, mev: number, mav: number, mrv: number) => {
    if (current < mev) return { zone: "Below MEV", color: "text-red-500", progress: (current / mev) * 100 };
    if (current <= mav) return { zone: "Optimal Zone", color: "text-green-500", progress: 100 };
    if (current <= mrv) return { zone: "High Volume", color: "text-orange-500", progress: 100 };
    return { zone: "Over MRV", color: "text-red-500", progress: 100 };
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "push": return "💪";
      case "pull": return "🎯";  
      case "legs": return "🦵";
      default: return "💪";
    }
  };

  const groupedLandmarks = Array.isArray(volumeLandmarks) 
    ? volumeLandmarks.reduce((acc: any, landmark: VolumeLandmark) => {
        const category = landmark.muscleGroup?.category || "other";
        if (!acc[category]) acc[category] = [];
        acc[category].push(landmark);
        return acc;
      }, {}) 
    : {};

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Volume Landmarks</h2>
        <p className="text-muted-foreground">
          Renaissance Periodization volume landmarks for optimal hypertrophy training
        </p>
      </div>

      {/* RP Methodology Info */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Renaissance Periodization Volume Landmarks
          </CardTitle>
          <CardDescription>
            Evidence-based training volumes for maximum muscle growth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <div className="font-semibold text-red-500">MV - Maintenance Volume</div>
              <div className="text-muted-foreground">Volume needed to maintain muscle mass</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-green-500">MEV - Minimum Effective Volume</div>
              <div className="text-muted-foreground">Minimum volume for muscle growth</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-blue-500">MAV - Maximum Adaptive Volume</div>
              <div className="text-muted-foreground">Upper limit of productive volume</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-orange-500">MRV - Maximum Recoverable Volume</div>
              <div className="text-muted-foreground">Maximum volume before overreaching</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volume Landmarks by Category */}
      <Tabs defaultValue="push" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="push" className="flex items-center gap-2">
            💪 Push
          </TabsTrigger>
          <TabsTrigger value="pull" className="flex items-center gap-2">
            🎯 Pull  
          </TabsTrigger>
          <TabsTrigger value="legs" className="flex items-center gap-2">
            🦵 Legs
          </TabsTrigger>
        </TabsList>

        {Object.entries(groupedLandmarks).map(([category, landmarks]) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid gap-4">
              {(landmarks as VolumeLandmark[]).map((landmark) => {
                const zone = getVolumeZone(landmark.currentVolume, landmark.mev, landmark.mav, landmark.mrv);
                
                return (
                  <Card key={landmark.id} className="transition-all hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="capitalize flex items-center gap-2">
                            {landmark.muscleGroup?.translations?.en || landmark.muscleGroup?.name}
                            <Badge variant={landmark.muscleGroup?.priority === 1 ? "default" : "secondary"}>
                              {landmark.muscleGroup?.priority === 1 ? "Primary" : "Secondary"}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Current: {landmark.currentVolume} sets/week • Target: {landmark.targetVolume} sets/week
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${zone.color}`}>{zone.zone}</div>
                          <div className="text-xs text-muted-foreground">Volume Status</div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Volume Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>MV: {landmark.mv}</span>
                          <span>MEV: {landmark.mev}</span>
                          <span>MAV: {landmark.mav}</span>
                          <span>MRV: {landmark.mrv}</span>
                        </div>
                        <div className="relative">
                          <Progress 
                            value={Math.min((landmark.currentVolume / landmark.mrv) * 100, 100)} 
                            className="h-3"
                          />
                          <div 
                            className="absolute top-0 h-3 bg-green-500/30 rounded"
                            style={{ 
                              left: `${(landmark.mev / landmark.mrv) * 100}%`,
                              width: `${((landmark.mav - landmark.mev) / landmark.mrv) * 100}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* Volume Landmark Controls */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Current Volume</Label>
                          <Input
                            type="number"
                            value={landmark.currentVolume}
                            onChange={(e) => handleUpdateLandmark(landmark.muscleGroupId, "currentVolume", parseInt(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Target Volume</Label>
                          <Input
                            type="number"
                            value={landmark.targetVolume}
                            onChange={(e) => handleUpdateLandmark(landmark.muscleGroupId, "targetVolume", parseInt(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Recovery Level</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={landmark.recoveryLevel}
                            onChange={(e) => handleUpdateLandmark(landmark.muscleGroupId, "recoveryLevel", parseInt(e.target.value) || 5)}
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Adaptation Level</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={landmark.adaptationLevel}
                            onChange={(e) => handleUpdateLandmark(landmark.muscleGroupId, "adaptationLevel", parseInt(e.target.value) || 5)}
                            className="h-8"
                          />
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUpdateLandmark(landmark.muscleGroupId, "targetVolume", landmark.mev)}
                        >
                          Set to MEV
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUpdateLandmark(landmark.muscleGroupId, "targetVolume", Math.round((landmark.mev + landmark.mav) / 2))}
                        >
                          Set to Optimal
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUpdateLandmark(landmark.muscleGroupId, "targetVolume", landmark.mav)}
                        >
                          Set to MAV
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}