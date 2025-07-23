import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  BarChart3,
  Target,
  Brain,
  User,
  TrendingUp,
  ShoppingCart,
  Plus,
  X
} from "lucide-react";

interface FloatingNutritionMenuProps {
  onTabSelect: (tab: string) => void;
  activeTab: string;
}

export function FloatingNutritionMenu({ onTabSelect, activeTab }: FloatingNutritionMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { id: "overview", icon: BarChart3, label: "Overview" },
    { id: "builder", icon: Target, label: "Diet Plan" },
    { id: "advanced", icon: Brain, label: "RP Coach" },
    { id: "body", icon: User, label: "Body" },
    { id: "progression", icon: TrendingUp, label: "Progress" },
    { id: "shopping", icon: ShoppingCart, label: "Shopping" },
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
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Expanded Menu Items - iOS optimized for iPhone SE/12 mini */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 space-y-2 animate-in slide-in-from-bottom-5 duration-300 ease-out">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                className="animate-in slide-in-from-bottom-3 duration-200 ease-out"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleItemClick(item.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-full shadow-xl backdrop-blur-md border
                    transition-all duration-200 ios-touch-feedback min-w-[110px] justify-start
                    ${isActive 
                      ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-500/30" 
                      : "bg-white/90 dark:bg-gray-800/90 text-black dark:text-white hover:bg-white dark:hover:bg-gray-700 border-gray-200/50 dark:border-gray-700/50"
                    }
                  `}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-blue-600 dark:text-blue-400"}`} />
                  <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
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
          w-12 h-12 rounded-full shadow-xl backdrop-blur-md transition-all duration-300 ease-out
          ios-touch-feedback border-2 flex items-center justify-center cursor-pointer
          ${isExpanded 
            ? "bg-red-600 hover:bg-red-700 text-white border-red-500/30 rotate-45 scale-110" 
            : "bg-blue-600 hover:bg-blue-700 text-white border-blue-500/30 hover:scale-105"
          }
        `}
      >
        <Plus className="w-5 h-5 transition-transform duration-300" />
      </div>
    </div>
  );
}