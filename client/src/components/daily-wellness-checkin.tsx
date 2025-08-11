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

interface DailyWellnessCheckin {
  id: number;
  userId: number;
  date: string;
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

interface DailyWellnessCheckinProps {
  userId: number;
  selectedDate?: Date; // Allow specifying which date to track
}

export default function DailyWellnessCheckin({ userId, selectedDate = new Date() }: DailyWellnessCheckinProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Set date to beginning of day for consistency
  const trackingDate = new Date(selectedDate);
  trackingDate.setHours(0, 0, 0, 0);
  
  const [energyLevel, setEnergyLevel] = useState([5]);
  const [hungerLevel, setHungerLevel] = useState([5]);
  const [sleepQuality, setSleepQuality] = useState([7]);
  const [stressLevel, setStressLevel] = useState([5]);
  const [cravingsIntensity, setCravingsIntensity] = useState([5]);
  const [adherencePerception, setAdherencePerception] = useState([7]);
  const [notes, setNotes] = useState("");

  // Fetch existing checkin for the selected date
  const dateString = trackingDate.toISOString().split('T')[0];
  console.log('DailyWellnessCheckin - selectedDate prop:', selectedDate);
  console.log('DailyWellnessCheckin - trackingDate:', trackingDate);
  console.log('DailyWellnessCheckin - dateString:', dateString);
  console.log('DailyWellnessCheckin - new Date():', new Date());
  
  const { data: existingCheckin, isLoading } = useQuery({
    queryKey: ['/api/daily-wellness-checkins', dateString],
    queryFn: async () => {
      const response = await fetch(`/api/daily-wellness-checkins?date=${dateString}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 0, // Always consider data stale
    gcTime: 0 // Don't cache this data
  });

  // Update form values when existing checkin is loaded
  useEffect(() => {
    if (existingCheckin) {
      setEnergyLevel([existingCheckin.energyLevel]);
      setHungerLevel([existingCheckin.hungerLevel]);
      setSleepQuality([existingCheckin.sleepQuality || 7]);
      setStressLevel([existingCheckin.stressLevel || 5]);
      setCravingsIntensity([existingCheckin.cravingsIntensity || 5]);
      setAdherencePerception([existingCheckin.adherencePerception || 7]);
      setNotes(existingCheckin.notes || "");
    }
  }, [existingCheckin]);

  // Submit checkin mutation
  const submitCheckinMutation = useMutation({
    mutationFn: async (checkinData: any) => {
      return apiRequest('POST', '/api/daily-wellness-checkins', checkinData);
    },
    onSuccess: () => {
      toast({
        title: "Daily Check-in Saved",
        description: "Your wellness data has been recorded for macro adjustments",
      });
      
      // Invalidate related queries with specific date
      const dateString = trackingDate.toISOString().split('T')[0];
      
      // Force immediate refetch by removing from cache and invalidating
      queryClient.removeQueries({ queryKey: ['/api/daily-wellness-checkins', dateString] });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-wellness-checkins', dateString] });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-wellness-summary'] });
      // Also invalidate all wellness-related queries to be safe
      queryClient.invalidateQueries({ queryKey: ['/api/daily-wellness-checkins'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save wellness check-in. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    // Use the same date format for both query and submission
    const dateString = trackingDate.toISOString().split('T')[0];
    
    const checkinData = {
      userId,
      date: dateString, // Use simple date format (YYYY-MM-DD)
      energyLevel: energyLevel[0],
      hungerLevel: hungerLevel[0],
      sleepQuality: sleepQuality[0],
      stressLevel: stressLevel[0],
      cravingsIntensity: cravingsIntensity[0],
      adherencePerception: adherencePerception[0],
      notes: notes.trim() || null
    };

    submitCheckinMutation.mutate(checkinData);
  };

  const getEnergyLevelDescription = (level: number) => {
    if (level <= 3) return "Low Energy";
    if (level <= 6) return "Moderate Energy";
    return "High Energy";
  };

  const getHungerLevelDescription = (level: number) => {
    if (level <= 3) return "Low Hunger";
    if (level <= 6) return "Moderate Hunger";
    return "High Hunger";
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isToday = trackingDate.toDateString() === new Date().toDateString();

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="ios-loading-dots flex items-center gap-1">
              <div className="dot w-2 h-2 bg-blue-600 rounded-full"></div>
              <div className="dot w-2 h-2 bg-blue-600 rounded-full"></div>
              <div className="dot w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading wellness check-in...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <CardTitle className="text-lg font-semibold text-black dark:text-white">
              Daily Wellness Check-in
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isToday && <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Today</Badge>}
            {existingCheckin && <Badge variant="secondary" className="text-xs">Completed</Badge>}
          </div>
        </div>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          {formatDate(trackingDate)} • Daily tracking for weekly macro adjustments
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 pl-[5px] pr-[5px]">
        {/* Core Required Metrics (for RP adjustments) */}
        <div className="space-y-4">
          <h4 className="font-medium text-black dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" />
            Core Wellness Indicators
          </h4>
          
          {/* Energy Level */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-black dark:text-white flex items-center gap-2">
                <Battery className="w-4 h-4 text-green-500" />
                Energy Level
              </Label>
              <div className="text-right">
                <span className="text-lg font-semibold text-black dark:text-white">{energyLevel[0]}/10</span>
                <div className="text-xs text-gray-500 dark:text-gray-400">{getEnergyLevelDescription(energyLevel[0])}</div>
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
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Very Tired</span>
              <span>Energized</span>
            </div>
          </div>

          {/* Hunger Level */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-black dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Hunger Level
              </Label>
              <div className="text-right">
                <span className="text-lg font-semibold text-black dark:text-white">{hungerLevel[0]}/10</span>
                <div className="text-xs text-gray-500 dark:text-gray-400">{getHungerLevelDescription(hungerLevel[0])}</div>
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
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Not Hungry</span>
              <span>Very Hungry</span>
            </div>
          </div>
        </div>

        {/* Optional Metrics */}
        <div className="space-y-4">
          <h4 className="font-medium text-black dark:text-white flex items-center gap-2">
            <Moon className="w-4 h-4 text-purple-500" />
            Additional Factors
            <Badge variant="outline" className="text-xs">Optional</Badge>
          </h4>
          
          {/* Sleep Quality */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-black dark:text-white">Sleep Quality</Label>
              <span className="text-lg font-semibold text-black dark:text-white">{sleepQuality[0]}/10</span>
            </div>
            <Slider
              value={sleepQuality}
              onValueChange={setSleepQuality}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          {/* Stress Level */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-black dark:text-white">Stress Level</Label>
              <span className="text-lg font-semibold text-black dark:text-white">{stressLevel[0]}/10</span>
            </div>
            <Slider
              value={stressLevel}
              onValueChange={setStressLevel}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          {/* Diet Adherence */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-black dark:text-white">Diet Adherence</Label>
              <span className="text-lg font-semibold text-black dark:text-white">{adherencePerception[0]}/10</span>
            </div>
            <Slider
              value={adherencePerception}
              onValueChange={setAdherencePerception}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label className="text-black dark:text-white">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about your day..."
            className="min-h-[80px]"
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitCheckinMutation.isPending}
          className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
        >
          {submitCheckinMutation.isPending ? (
            <>
              <div className="ios-loading-dots flex items-center gap-1 mr-2">
                <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              Saving Check-in...
            </>
          ) : existingCheckin ? (
            <>
              <Heart className="w-4 h-4 mr-2" />
              Update Today's Check-in
            </>
          ) : (
            <>
              <Heart className="w-4 h-4 mr-2" />
              Complete Daily Check-in
            </>
          )}
        </Button>

        {/* Impact Info */}
        <div className="bg-blue-50 dark:bg-blue-950/30  p-3 text-xs text-gray-600 dark:text-gray-400">
          <p><strong>RP Methodology:</strong> Daily wellness data is averaged weekly and used to adjust next week's macro targets. Low energy (≤4) reduces calorie deficit by 1%, high hunger (≥8) makes adjustments 2% more conservative.</p>
        </div>
      </CardContent>
    </Card>
  );
}