import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  Dumbbell,
  TrendingUp,
  Target,
  Activity,
  FileText,
  Settings,
  Plus,
  X
} from "lucide-react";

interface FloatingTrainingMenuProps {
  onTabSelect: (tab: string) => void;
  activeTab: string;
}

export function FloatingTrainingMenu({ onTabSelect, activeTab }: FloatingTrainingMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { id: "sessions", icon: Dumbbell, label: "Sessions" },
    { id: "exercise-library", icon: Settings, label: "Exercises" },
    { id: "templates", icon: FileText, label: "Templates" },
    { id: "mesocycles", icon: Target, label: "Programs" },
    { id: "progression", icon: TrendingUp, label: "Progress" },
    { id: "auto-regulation", icon: Activity, label: "Feedback" },
  ];

  const handleItemClick = (tabId: string) => {
    onTabSelect(tabId);
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {/* iOS-style Backdrop for expanded menu */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10 modal-overlay-enter ios-animation"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Expanded Menu Items - iOS optimized for iPhone SE/12 mini */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 space-y-2 modal-content-enter ios-smooth-transform">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                className="ios-scale-in ios-smooth-transform"
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animation: `ios-scale-in 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 50}ms forwards`
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleItemClick(item.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-full shadow-xl backdrop-blur-md border
                    transition-all duration-200 ios-touch-feedback ios-smooth-transform min-w-[110px] justify-start
                    hover:scale-105 active:scale-95
                    ${isActive 
                      ? "bg-orange-600 hover:bg-orange-700 text-white border-orange-500/30" 
                      : "bg-white/90 dark:bg-gray-800/90 text-black dark:text-white hover:bg-white dark:hover:bg-gray-700 border-gray-200/50 dark:border-gray-700/50"
                    }
                  `}
                >
                  <Icon className={`w-3.5 h-3.5 transition-all duration-150 ${isActive ? "text-white" : "text-orange-600 dark:text-orange-400"}`} />
                  <span className="text-xs font-medium whitespace-nowrap transition-all duration-150">{item.label}</span>
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main FAB - iOS optimized */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-14 h-14 rounded-full shadow-xl backdrop-blur-md transition-all duration-300 ease-out
          ios-touch-feedback ios-smooth-transform border-2 flex items-center justify-center cursor-pointer
          active:scale-90
          ${isExpanded 
            ? "bg-red-600 hover:bg-red-700 text-white border-red-500/30 rotate-45 scale-110" 
            : "bg-orange-600 hover:bg-orange-700 text-white border-orange-500/30 hover:scale-105"
          }
        `}
      >
        <Plus className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-45' : 'rotate-0'}`} />
      </div>
    </div>
  );
}