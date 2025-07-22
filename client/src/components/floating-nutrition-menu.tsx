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
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded Menu Items */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 space-y-2 animate-in slide-in-from-bottom-5 duration-200">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "secondary"}
                size="sm"
                onClick={() => handleItemClick(item.id)}
                className={`w-full justify-start gap-3 shadow-lg ${
                  isActive 
                    ? "bg-black dark:bg-white text-white dark:text-black" 
                    : "bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-button whitespace-nowrap">{item.label}</span>
              </Button>
            );
          })}
        </div>
      )}

      {/* Main FAB */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-200 ${
          isExpanded 
            ? "bg-red-600 hover:bg-red-700 text-white rotate-45" 
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {isExpanded ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </Button>
    </div>
  );
}