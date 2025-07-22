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

  // iOS-style navigation items (5 main tabs + center action button)
  const navItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/nutrition", icon: BookOpen, label: "Diary" },
    { path: "/training", icon: Dumbbell, label: "Training" },
    { path: "/reports", icon: BarChart3, label: "Progress" },
    { path: "/more", icon: MoreHorizontal, label: "More" },
  ];

  const handleNavigation = (path: string) => {
    if (path === "/more") {
      // Handle "More" tab - could show additional options or navigate to a more page
      setLocation("/profile");
    } else {
      setLocation(path);
    }
  };

  const handleQuickAction = () => {
    setShowQuickActions(true);
  };

  return (
    <>
      {/* iOS-style Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 z-50 safe-area-pb">
        <div className="flex items-center justify-center px-1 py-1 max-w-lg mx-auto">
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
            className="flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105 mx-2 my-1"
          >
            <Plus className="w-6 h-6" />
          </button>
          
          {/* Last three navigation items */}
          {navItems.slice(2).map((item) => {
            const isActive = location === item.path || (item.path === "/more" && location === "/profile");
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
      className="flex flex-col items-center justify-center py-2 px-2 min-w-[60px] flex-1 transition-all duration-200"
    >
      <div className={`transition-colors duration-200 ${
        isActive 
          ? "text-blue-500 dark:text-blue-400" 
          : "text-gray-600 dark:text-gray-400"
      }`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className={`text-xs mt-1 transition-colors duration-200 ${
        isActive 
          ? "text-blue-500 dark:text-blue-400 font-medium" 
          : "text-gray-600 dark:text-gray-400"
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
      },
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      id: "start-workout",
      icon: Dumbbell,
      label: "Start Workout",
      description: "Begin a new training session",
      action: () => {
        setLocation("/training");
        onClose();
      },
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      id: "profile",
      icon: User,
      label: "Profile",
      description: "View and edit your profile settings",
      action: () => {
        setLocation("/profile");
        onClose();
      },
      color: "bg-purple-500 hover:bg-purple-600"
    }
  ];

  const handleActionPress = (action: () => void) => {
    action();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl font-semibold">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            Quick Actions
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                onClick={() => handleActionPress(action.action)}
                className={`${action.color} text-white h-auto p-4 justify-start gap-4 hover:scale-105 transition-all duration-200`}
                variant="default"
              >
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium text-base">{action.label}</span>
                  <span className="text-white/80 text-sm">{action.description}</span>
                </div>
              </Button>
            );
          })}
        </div>

        <div className="flex justify-center pt-2">
          <Button 
            onClick={onClose}
            variant="ghost"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}