import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle, Calendar } from "lucide-react";
import { useLocation } from "wouter";

interface DailyWellnessReminderProps {
  userId: number;
  compact?: boolean; // For smaller display areas
}

export function DailyWellnessReminder({ userId, compact = false }: DailyWellnessReminderProps) {
  const [, setLocation] = useLocation();
  
  // Get today's wellness check-in status
  const { data: todayWellnessCheckin, isLoading } = useQuery({
    queryKey: ['/api/daily-wellness-checkins', new Date().toISOString().split('T')[0]],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/daily-wellness-checkins?date=${today}`, {
        credentials: 'include'
      });
      if (!response.ok) return null;
      return response.json();
    }
  });

  const isCompleted = !!todayWellnessCheckin;
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });

  if (isLoading) {
    return (
      <Card className={compact ? "p-3" : ""}>
        <CardContent className={compact ? "p-0" : "pt-6"}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            <span className="text-sm text-gray-500">Loading wellness status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div 
        className={`
          flex items-center justify-between p-3 cursor-pointer transition-colors
          ${isCompleted 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30' 
            : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30'
          }
        `}
        onClick={() => setLocation('/rp-coach')}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isCompleted ? (
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          ) : (
            <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className={`font-medium text-sm ${isCompleted ? 'text-green-900 dark:text-green-100' : 'text-orange-900 dark:text-orange-100'}`}>
              Daily Wellness Check-in
            </p>
            <p className={`text-xs ${isCompleted ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}`}>
              {isCompleted ? 'Completed for today' : 'Pending for today'}
            </p>
          </div>
        </div>
        <Badge 
          variant={isCompleted ? "default" : "secondary"}
          className={`
            ${isCompleted 
              ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200' 
              : 'bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200'
            }
          `}
        >
          {isCompleted ? 'Complete' : 'Pending'}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={isCompleted ? 'border-green-200 dark:border-green-800' : 'border-orange-200 dark:border-orange-800'}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            Daily Wellness Check-in
          </div>
          <Badge 
            variant={isCompleted ? "default" : "secondary"}
            className={`
              ${isCompleted 
                ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200' 
                : 'bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200'
              }
            `}
          >
            {isCompleted ? 'Complete' : 'Pending'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isCompleted ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100 text-sm">
                  Today's Check-in Complete
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Your wellness data has been recorded and will contribute to personalized RP recommendations
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/rp-coach')}
                className="text-green-700 dark:text-green-300 border-green-300 dark:border-green-600"
              >
                View Check-in
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/rp-coach')}
                className="text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600"
              >
                RP Analysis
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="font-medium text-orange-900 dark:text-orange-100 text-sm">
                  Complete Today's Check-in
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  Track your energy, hunger, sleep, and adherence for personalized RP guidance
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setLocation('/rp-coach')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              Complete Check-in
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}