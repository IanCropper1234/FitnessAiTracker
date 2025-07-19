import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

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
}

export function TrainingOverview({ userId }: TrainingOverviewProps) {
  const { data: trainingStats } = useQuery<TrainingStats>({
    queryKey: ['/api/training/stats', userId],
    queryFn: async () => {
      const response = await fetch(`/api/training/stats/${userId}`);
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

  if (!trainingStats) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        No training data yet. Start your first workout!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Training Summary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress Chart */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">Weekly Progress</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="week" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar 
                dataKey="sessions" 
                fill="#3B82F6" 
                name="Sessions"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="volume" 
                fill="#10B981" 
                name="Volume (kg)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Exercise Type Distribution */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">Exercise Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={exerciseDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {exerciseDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Training Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Most Active</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {trainingStats.totalSessions > 10 ? "High frequency trainer" : "Building consistency"}
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Volume Progress</h4>
          <p className="text-sm text-green-700 dark:text-green-300">
            {trainingStats.totalVolume > 1000 ? "Strong progression" : "Steady improvement"}
          </p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Session Length</h4>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            {trainingStats.averageSessionLength > 60 ? "Thorough workouts" : "Efficient training"}
          </p>
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
                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300"
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