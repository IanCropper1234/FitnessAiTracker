import { TrainingDashboard } from "@/components/training-dashboard";

interface User {
  id: number;
  email: string;
  name: string;
}

interface TrainingPageProps {
  user: User;
}

export function TrainingPage({ user }: TrainingPageProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Training</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your workouts and build strength with Renaissance Periodization methodology
            </p>
          </div>
        </div>
        
        <TrainingDashboard userId={user.id} />
      </div>
    </div>
  );
}