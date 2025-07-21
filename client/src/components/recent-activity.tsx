import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Utensils, Dumbbell, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: 'nutrition' | 'workout' | 'workout_completion';
  title: string;
  description: string;
  timestamp: Date;
  data?: any;
}

interface RecentActivityProps {
  userId: number;
}

export function RecentActivity({ userId }: RecentActivityProps) {
  // Fetch recent activities from unified endpoint
  const { data: activities = [] } = useQuery({
    queryKey: ['/api/activities', userId],
    queryFn: async () => {
      const response = await fetch(`/api/activities/${userId}?limit=8`);
      return response.json();
    }
  });

  // Convert timestamp strings to Date objects
  const formattedActivities: ActivityItem[] = activities.map((activity: any) => ({
    ...activity,
    timestamp: new Date(activity.timestamp)
  }));

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'nutrition':
        return <Utensils className="h-4 w-4" />;
      case 'workout':
        return <Dumbbell className="h-4 w-4" />;
      case 'workout_completion':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'nutrition':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'workout':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'workout_completion':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (formattedActivities.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-black dark:text-white">Recent Activity</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Your latest updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm mt-1">Start logging food or working out to see activity here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-black dark:text-white">Recent Activity</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Your latest updates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {formattedActivities.map((activity) => (
            <div 
              key={activity.id}
              className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-black dark:text-white truncate">
                    {activity.title}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {activity.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}