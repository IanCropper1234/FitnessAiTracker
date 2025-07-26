import { TrainingDashboard } from "@/components/training-dashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Dumbbell } from "lucide-react";
import { useLocation } from "wouter";

interface User {
  id: number;
  email: string;
  name: string;
}

interface TrainingPageProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function TrainingPage({ user, activeTab, setActiveTab }: TrainingPageProps) {
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen bg-background text-foreground w-full ios-pwa-container">
      <div className="w-full px-2 space-y-4">
        {/* Ultra-Compact iOS Header */}
        <div className="ios-sticky-header bg-background/95 border-b border-border/10 -mx-2 px-4 py-2 ml-[-8px] mr-[-8px] mb-6">
          <div className="flex items-center justify-between h-[44px]">
            {/* Left: Back Arrow Only */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] p-0 hover:bg-accent/50 rounded-lg ios-touch-feedback ios-smooth-transform button-press-animation"
            >
              <ArrowLeft className="w-5 h-5 transition-transform duration-150" />
            </Button>
            
            {/* Center: Compact Title with Icon */}
            <div className="flex items-center gap-1.5 min-w-0">
              <Dumbbell className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 transition-colors duration-200" />
              <h1 className="text-base font-semibold transition-colors duration-200">Training</h1>
            </div>
            
            {/* Right: Context Menu */}
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center justify-center min-h-[44px] min-w-[44px] p-0 hover:bg-accent/50 rounded-lg ios-touch-feedback button-press-animation opacity-50"
              disabled
            >
              <div className="w-1 h-1 bg-current rounded-full mx-0.5 transition-all duration-150"></div>
              <div className="w-1 h-1 bg-current rounded-full mx-0.5 transition-all duration-150"></div>
              <div className="w-1 h-1 bg-current rounded-full mx-0.5 transition-all duration-150"></div>
            </Button>
          </div>
        </div>
        
        <div className="mt-8">
          <TrainingDashboard userId={user.id} activeTab={activeTab} />
        </div>


      </div>
    </div>
  );
}