import { TrainingDashboard } from "@/components/training-dashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Dumbbell } from "lucide-react";
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
    <div className="min-h-screen bg-background text-foreground w-full">
      <div className="w-full px-2 py-4 space-y-4">
        {/* iOS-optimized Header Navigation for iPhone SE/12 mini */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/20 -mx-2 px-3 py-3">
          <div className="flex items-center justify-between min-h-[44px]">
            {/* Left: Back to Dashboard */}
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/dashboard')}
                className="flex items-center gap-1.5 px-2 py-2 min-h-[44px] hover:bg-accent rounded-lg ios-touch-feedback"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium hidden xs:inline">Back</span>
              </Button>
            </div>
            
            {/* Center: Page Title with Icon */}
            <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
              <Dumbbell className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
              <h1 className="text-lg font-semibold">Training</h1>
            </div>
            
            {/* Right: Home Button - Perfect alignment match */}
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/dashboard')}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] px-2 py-2 hover:bg-accent rounded-lg ios-touch-feedback"
              >
                <Home className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <TrainingDashboard userId={user.id} activeTab={activeTab} />
        </div>

        {/* Floating Training Menu */}
        <FloatingTrainingMenu 
          onTabSelect={setActiveTab}
          activeTab={activeTab}
        />
      </div>
    </div>
  );
}