import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "./language-provider";
import { Home, BookOpen, Plus, BarChart3, MoreHorizontal, Utensils, Dumbbell, User, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const { t } = useLanguage();

  // iOS-style navigation items (4 main tabs + center action button)
  const navItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/nutrition", icon: BookOpen, label: "Diary" },
    { path: "/training", icon: Dumbbell, label: "Training" },
    { path: "/reports", icon: BarChart3, label: "Progress" },
  ];

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  const handleQuickAction = () => {
    setShowQuickActions(true);
  };

  return (
    <>
      {/* iOS-style Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-50 safe-area-pb">
        <div className="flex items-center justify-center px-2 py-1 max-w-md mx-auto">
          {/* First two navigation items */}
          {navItems.slice(0, 2).map((item) => {
            const isActive = location === item.path;
            return (
              <NavigationItem 
                key={item.path}
                item={item}
                isActive={isActive}
                onPress={handleNavigation}
              />
            );
          })}
          
          {/* Center Plus Button */}
          <button
            onClick={handleQuickAction}
            className="flex items-center justify-center w-12 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 mx-2 my-1"
          >
            <Plus className="w-6 h-6" />
          </button>
          
          {/* Last two navigation items */}
          {navItems.slice(2).map((item) => {
            const isActive = location === item.path;
            return (
              <NavigationItem 
                key={item.path}
                item={item}
                isActive={isActive}
                onPress={handleNavigation}
              />
            );
          })}
        </div>
      </div>

      {/* Quick Actions Modal */}
      <QuickActionsModal 
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
      />
    </>
  );
}

interface NavigationItemProps {
  item: { path: string; icon: any; label: string };
  isActive: boolean;
  onPress: (path: string) => void;
}

function NavigationItem({ item, isActive, onPress }: NavigationItemProps) {
  const Icon = item.icon;
  
  return (
    <button
      onClick={() => onPress(item.path)}
      className="flex flex-col items-center justify-center py-2 px-3 min-w-[70px] flex-1 transition-all duration-200"
    >
      <div className={`transition-colors duration-200 ${
        isActive 
          ? "text-primary" 
          : "text-muted-foreground"
      }`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className={`text-xs mt-1 transition-colors duration-200 ${
        isActive 
          ? "text-primary font-medium" 
          : "text-muted-foreground"
      }`}>
        {item.label}
      </span>
    </button>
  );
}

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function QuickActionsModal({ isOpen, onClose }: QuickActionsModalProps) {
  const [location, setLocation] = useLocation();

  const quickActions = [
    {
      id: "log-food",
      icon: Utensils,
      label: "Log Food",
      description: "Add a meal to your nutrition diary",
      action: () => {
        setLocation("/nutrition");
        onClose();
      }
    },
    {
      id: "start-workout",
      icon: Dumbbell,
      label: "Start Workout",
      description: "Begin a new training session",
      action: () => {
        setLocation("/training");
        onClose();
      }
    },
    {
      id: "profile",
      icon: User,
      label: "Profile",
      description: "View and edit your profile settings",
      action: () => {
        setLocation("/profile");
        onClose();
      }
    }
  ];

  const handleActionPress = (action: () => void) => {
    action();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[85vw] max-w-sm mx-auto rounded-xl bg-gray-900/95 backdrop-blur-md border-gray-700 p-4 sm:p-6">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2 sm:gap-3 text-headline text-white">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            Quick Actions
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2.5 mt-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleActionPress(action.action)}
                className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-gray-800/50 hover:bg-gray-700/60 border border-gray-700/30 text-white transition-all duration-200 hover:scale-[0.98] active:scale-95"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-700/80 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-gray-300" />
                </div>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-body text-white">{action.label}</span>
                  <span className="text-caption-sm text-gray-400 leading-tight">{action.description}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center pt-4">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-body-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}