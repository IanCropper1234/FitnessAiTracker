import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Welcome back, {user?.firstName || user?.name || 'User'}!
            </h1>
            <p className="text-muted-foreground mt-2">
              Ready to continue your fitness journey?
            </p>
          </div>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/api/logout'}
          >
            Sign Out
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded border">
            <h3 className="text-xl font-semibold mb-2">Nutrition Dashboard</h3>
            <p className="text-muted-foreground mb-4">
              Track your daily nutrition and macro targets
            </p>
            <Button className="w-full">
              View Dashboard
            </Button>
          </div>
          
          <div className="bg-card p-6 rounded border">
            <h3 className="text-xl font-semibold mb-2">Training Programs</h3>
            <p className="text-muted-foreground mb-4">
              Manage your workout templates and training cycles
            </p>
            <Button className="w-full">
              Start Training
            </Button>
          </div>
          
          <div className="bg-card p-6 rounded border">
            <h3 className="text-xl font-semibold mb-2">Progress Analytics</h3>
            <p className="text-muted-foreground mb-4">
              View your progress and performance metrics
            </p>
            <Button className="w-full">
              View Analytics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}