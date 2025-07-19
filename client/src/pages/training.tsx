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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Training</h1>
          <p className="text-muted-foreground">
            Track your workouts and build strength with Renaissance Periodization methodology
          </p>
        </div>
        
        <TrainingDashboard userId={user.id} />
      </div>
    </div>
  );
}