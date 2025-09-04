import { useState } from "react";
import { TrainingDashboard } from "@/components/training-dashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Dumbbell, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { useWorkoutExecution } from "@/contexts/WorkoutExecutionContext";

interface User {
  id: number;
  email: string;
  name: string;
}

interface TrainingPageProps {
  user: User;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function TrainingPage({ user, activeTab: externalActiveTab, onTabChange }: TrainingPageProps) {
  const [, setLocation] = useLocation();
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const activeTab = externalActiveTab || "sessions";
  const setActiveTab = onTabChange || (() => {});
  const { state } = useWorkoutExecution();
  
  // Hide menu bar when in active workout or viewing details
  // Add defensive check for state
  const hideHeader = isViewingDetails || (state?.hideMenuBar || false);
  
  return (
    <div className="min-h-screen bg-background text-foreground w-full ios-pwa-container ml-[-3px] mr-[-3px] pt-[5px] pb-[5px] pl-[15px] pr-[15px]">
      <div className="w-full px-2 space-y-4 pl-[0px] pr-[0px] ml-[0px] mr-[0px] pt-[0px] pb-[0px]">
        {/* Ultra-Compact iOS Header - Hide when viewing workout details or in active workout */}
        {!hideHeader && (
          <div className="ios-sticky-header bg-background/95 border-b border-border/10 -mx-2 px-4 py-2 ml-[-8px] mr-[-8px] mb-6">
            <div className="flex items-center justify-between h-[44px]">
              {/* Left: Back Arrow Only */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/')}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] p-0 hover:bg-accent/50  ios-touch-feedback ios-smooth-transform button-press-animation"
              >
                <ArrowLeft className="w-5 h-5 transition-transform duration-150" />
              </Button>
              
              {/* Center: Compact Title with Icon */}
              <div className="flex items-center gap-1.5 min-w-0">
                <Dumbbell className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 transition-colors duration-200" />
                <h1 className="text-base font-semibold transition-colors duration-200">Training</h1>
              </div>
              
              {/* Right: Settings Button */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/workout-settings')}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] p-0 hover:bg-accent/50 ios-touch-feedback ios-smooth-transform button-press-animation"
              >
                <Settings className="w-5 h-5 transition-transform duration-150" />
              </Button>
            </div>
          </div>
        )}
        
        <div className={isViewingDetails ? "mt-4 mb-32" : "mt-8 mb-32"}>
          <TrainingDashboard 
            userId={user.id} 
            activeTab={activeTab} 
            onViewStateChange={setIsViewingDetails}
          />
        </div>
      </div>
    </div>
  );
}