import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Calendar, Heart, Battery, Moon, Zap, AlertTriangle } from "lucide-react";

interface WeeklyWellnessCheckin {
  id: number;
  userId: number;
  weekStartDate: string;
  energyLevel: number;
  hungerLevel: number;
  sleepQuality?: number;
  stressLevel?: number;
  cravingsIntensity?: number;
  adherencePerception?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface WeeklyWellnessCheckinProps {
  userId: number;
}

export default function WeeklyWellnessCheckin({ userId }: WeeklyWellnessCheckinProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get start of current week (Monday)
  const getWeekStartDate = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const [weekStartDate] = useState(getWeekStartDate());
  const [energyLevel, setEnergyLevel] = useState([7]);
  const [hungerLevel, setHungerLevel] = useState([5]);
  const [sleepQuality, setSleepQuality] = useState([7]);
  const [stressLevel, setStressLevel] = useState([5]);
  const [cravingsIntensity, setCravingsIntensity] = useState([5]);
  const [adherencePerception, setAdherencePerception] = useState([8]);
  const [notes, setNotes] = useState("");

  // Fetch existing checkin for current week
  const { data: checkins = [] } = useQuery<WeeklyWellnessCheckin[]>({
    queryKey: ["/api/wellness-checkins", weekStartDate.toISOString()],
    queryFn: async () => {
      const response = await apiRequest(`GET`, `/api/wellness-checkins?week=${weekStartDate.toISOString()}`);
      return response;
    },
  });

  const currentCheckin = checkins[0];

  // Load existing data when available
  useEffect(() => {
    if (currentCheckin) {
      setEnergyLevel([currentCheckin.energyLevel]);
      setHungerLevel([currentCheckin.hungerLevel]);
      setSleepQuality([currentCheckin.sleepQuality || 7]);
      setStressLevel([currentCheckin.stressLevel || 5]);
      setCravingsIntensity([currentCheckin.cravingsIntensity || 5]);
      setAdherencePerception([currentCheckin.adherencePerception || 8]);
      setNotes(currentCheckin.notes || "");
    }
  }, [currentCheckin]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/wellness-checkins", "POST", data),
    onSuccess: () => {
      toast({
        title: "Weekly Check-in Saved",
        description: "Your wellness data has been recorded and will help optimize your nutrition plan.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wellness-checkins"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save wellness check-in. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      userId,
      weekStartDate: weekStartDate.toISOString(),
      energyLevel: energyLevel[0],
      hungerLevel: hungerLevel[0],
      sleepQuality: sleepQuality[0],
      stressLevel: stressLevel[0],
      cravingsIntensity: cravingsIntensity[0],
      adherencePerception: adherencePerception[0],
      notes,
    });
  };

  const formatWeekDate = (date: Date) => {
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + 6);
    return `${date.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  const getScaleColor = (value: number, isReverse = false) => {
    if (isReverse) {
      // For stress, hunger, cravings - lower is better
      if (value <= 3) return "text-green-600";
      if (value <= 6) return "text-yellow-600";
      return "text-red-600";
    } else {
      // For energy, sleep, adherence - higher is better
      if (value >= 8) return "text-green-600";
      if (value >= 6) return "text-yellow-600";
      return "text-red-600";
    }
  };

  const getScaleBadge = (value: number, isReverse = false) => {
    if (isReverse) {
      if (value <= 3) return { variant: "default" as const, text: "Excellent" };
      if (value <= 6) return { variant: "secondary" as const, text: "Moderate" };
      return { variant: "destructive" as const, text: "High" };
    } else {
      if (value >= 8) return { variant: "default" as const, text: "Excellent" };
      if (value >= 6) return { variant: "secondary" as const, text: "Good" };
      return { variant: "destructive" as const, text: "Needs Attention" };
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <CardTitle>Weekly Wellness Check-in</CardTitle>
        </div>
        <CardDescription>
          Week of {formatWeekDate(weekStartDate)} • Rate your overall wellness this week
        </CardDescription>
        {currentCheckin && (
          <Badge variant="outline" className="w-fit">
            Last updated: {new Date(currentCheckin.updatedAt).toLocaleDateString()}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Energy Level */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery className="h-4 w-4 text-blue-600" />
              <Label className="text-base font-medium">Energy Level</Label>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-semibold ${getScaleColor(energyLevel[0])}`}>
                {energyLevel[0]}/10
              </span>
              <Badge {...getScaleBadge(energyLevel[0])}>
                {getScaleBadge(energyLevel[0]).text}
              </Badge>
            </div>
          </div>
          <Slider
            value={energyLevel}
            onValueChange={setEnergyLevel}
            max={10}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground">
            1 = Completely exhausted • 5 = Average • 10 = Extremely energetic
          </div>
        </div>

        {/* Hunger Level */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-600" />
              <Label className="text-base font-medium">Hunger Level</Label>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-semibold ${getScaleColor(hungerLevel[0], true)}`}>
                {hungerLevel[0]}/10
              </span>
              <Badge {...getScaleBadge(hungerLevel[0], true)}>
                {getScaleBadge(hungerLevel[0], true).text}
              </Badge>
            </div>
          </div>
          <Slider
            value={hungerLevel}
            onValueChange={setHungerLevel}
            max={10}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground">
            1 = Never hungry • 5 = Satisfied • 10 = Constantly hungry
          </div>
        </div>

        {/* Sleep Quality */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-indigo-600" />
              <Label className="text-base font-medium">Sleep Quality</Label>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-semibold ${getScaleColor(sleepQuality[0])}`}>
                {sleepQuality[0]}/10
              </span>
              <Badge {...getScaleBadge(sleepQuality[0])}>
                {getScaleBadge(sleepQuality[0]).text}
              </Badge>
            </div>
          </div>
          <Slider
            value={sleepQuality}
            onValueChange={setSleepQuality}
            max={10}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground">
            1 = Very poor sleep • 5 = Average • 10 = Excellent sleep
          </div>
        </div>

        {/* Stress Level */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <Label className="text-base font-medium">Stress Level</Label>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-semibold ${getScaleColor(stressLevel[0], true)}`}>
                {stressLevel[0]}/10
              </span>
              <Badge {...getScaleBadge(stressLevel[0], true)}>
                {getScaleBadge(stressLevel[0], true).text}
              </Badge>
            </div>
          </div>
          <Slider
            value={stressLevel}
            onValueChange={setStressLevel}
            max={10}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground">
            1 = Very relaxed • 5 = Moderate stress • 10 = Extremely stressed
          </div>
        </div>

        {/* Cravings Intensity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <Label className="text-base font-medium">Cravings Intensity</Label>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-semibold ${getScaleColor(cravingsIntensity[0], true)}`}>
                {cravingsIntensity[0]}/10
              </span>
              <Badge {...getScaleBadge(cravingsIntensity[0], true)}>
                {getScaleBadge(cravingsIntensity[0], true).text}
              </Badge>
            </div>
          </div>
          <Slider
            value={cravingsIntensity}
            onValueChange={setCravingsIntensity}
            max={10}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground">
            1 = No cravings • 5 = Manageable • 10 = Overwhelming cravings
          </div>
        </div>

        {/* Adherence Perception */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-green-600" />
              <Label className="text-base font-medium">Diet Adherence</Label>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-semibold ${getScaleColor(adherencePerception[0])}`}>
                {adherencePerception[0]}/10
              </span>
              <Badge {...getScaleBadge(adherencePerception[0])}>
                {getScaleBadge(adherencePerception[0]).text}
              </Badge>
            </div>
          </div>
          <Slider
            value={adherencePerception}
            onValueChange={setAdherencePerception}
            max={10}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground">
            1 = Poor adherence • 5 = Half the time • 10 = Perfect adherence
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Additional Notes (Optional)</Label>
          <Textarea
            placeholder="Any specific challenges, wins, or observations this week..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saveMutation.isPending}
          className="w-full"
        >
          {saveMutation.isPending ? "Saving..." : currentCheckin ? "Update Check-in" : "Save Check-in"}
        </Button>
      </CardContent>
    </Card>
  );
}