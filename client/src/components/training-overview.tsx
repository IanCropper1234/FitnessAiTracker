import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { LoadingState } from "@/components/ui/loading";
import { useRef, useEffect } from "react";

interface TrainingStats {
  totalSessions: number;
  totalVolume: number;
  averageSessionLength: number;
  favoriteExercises: string[];
  weeklyProgress: Array<{
    week: string;
    sessions: number;
    volume: number;
  }>;
}

interface TrainingOverviewProps {
  userId: number;
  date?: Date;
}

export function TrainingOverview({ userId, date }: TrainingOverviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Entrance animation for training overview
  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.training-card');
      cards.forEach((card, index) => {
        (card as HTMLElement).style.opacity = '0';
        (card as HTMLElement).style.transform = 'translateY(20px)';
        
        setTimeout(() => {
          card.animate([
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ], {
            duration: 500,
            easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
            delay: index * 100,
            fill: 'forwards'
          });
        }, 100);
      });
    }
  }, []);

  // Always fetch all-time training stats, ignore date filter for overview
  const { data: trainingStats, isLoading } = useQuery<TrainingStats>({
    queryKey: ['/api/training/stats', userId],
    queryFn: async () => {
      const response = await fetch('/api/training/stats', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch training stats');
      return response.json();
    }
  });

  // Weekly progress data for chart
  const weeklyData = trainingStats?.weeklyProgress || [];

  // Exercise distribution data (mock for now, can be enhanced with real data)
  const exerciseDistribution = [
    { name: 'Push', value: 35, color: '#3B82F6' },
    { name: 'Pull', value: 30, color: '#10B981' },
    { name: 'Legs', value: 25, color: '#F59E0B' },
    { name: 'Cardio', value: 10, color: '#EF4444' }
  ];

  if (isLoading) {
    return (
      <div className="text-center py-8 text-body-sm text-gray-600 dark:text-gray-400">
        <LoadingState type="dots" />
      </div>
    );
  }

  if (!trainingStats) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        No training data yet. Start your first workout!
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Training Summary Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Training Progress Metrics */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-black dark:text-white text-center mb-4">Training Progress</h3>
          
          {/* Training Frequency Card */}
          <div className="training-card bg-blue-50 dark:bg-blue-900/20 p-4  border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Weekly Frequency</h4>
                <p className="text-blue-700 dark:text-blue-300 text-xs">Training sessions</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                  {trainingStats?.totalSessions || 0}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">this week</p>
              </div>
            </div>
          </div>

          {/* Volume Card */}
          <div className="training-card bg-green-50 dark:bg-green-900/20 p-4  border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm">Total Volume</h4>
                <p className="text-green-700 dark:text-green-300 text-xs">Weight moved</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-900 dark:text-green-100">
                  {Math.round(trainingStats?.totalVolume || 0)}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">kg total</p>
              </div>
            </div>
          </div>

          {/* Session Duration Card */}
          <div className="training-card bg-purple-50 dark:bg-purple-900/20 p-4  border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 text-sm">Avg Duration</h4>
                <p className="text-purple-700 dark:text-purple-300 text-xs">Per session</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
                  {Math.round(trainingStats?.averageSessionLength || 0)}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400">minutes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Favorite Exercises */}
      {trainingStats.favoriteExercises && trainingStats.favoriteExercises.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-black dark:text-white">Favorite Exercises</h3>
          <div className="flex flex-wrap gap-2">
            {trainingStats.favoriteExercises.slice(0, 5).map((exercise, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-800  text-sm text-gray-700 dark:text-gray-300"
              >
                {exercise}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}