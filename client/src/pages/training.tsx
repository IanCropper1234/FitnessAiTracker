import { TrainingDashboard } from "@/components/training-dashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useLocation } from "wouter";
import { FloatingTrainingMenu } from "@/components/floating-training-menu";
import { useState } from "react";

interface User {
  id: number;
  email: string;
  name: string;
}

interface TrainingPageProps {
  user: User;
}

export function TrainingPage({ user }: TrainingPageProps) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("sessions");
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-3 py-4 space-y-4 max-w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 p-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-display font-semibold">Training</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 p-0"
            >
              <Home className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <TrainingDashboard userId={user.id} activeTab={activeTab} />

        {/* Floating Training Menu */}
        <FloatingTrainingMenu 
          onTabSelect={setActiveTab}
          activeTab={activeTab}
        />
      </div>
    </div>
  );
}