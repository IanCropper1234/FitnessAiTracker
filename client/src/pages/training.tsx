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
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="p-2"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-display">Training</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="p-2"
            >
              <Home className="w-6 h-6" />
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