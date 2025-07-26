import { 
  BarChart3,
  Target,
  Brain,
  User,
  TrendingUp
} from "lucide-react";
import { useScrollHide } from "@/hooks/use-scroll-hide";

interface FloatingNutritionMenuProps {
  onTabSelect: (tab: string) => void;
  activeTab: string;
}

export function FloatingNutritionMenu({ onTabSelect, activeTab }: FloatingNutritionMenuProps) {
  const isVisible = useScrollHide({ threshold: 15 });
  
  const menuItems = [
    { id: "overview", icon: BarChart3, label: "Overview" },
    { id: "builder", icon: Target, label: "Diet" },
    { id: "advanced", icon: Brain, label: "Adjustment" },
    { id: "body", icon: User, label: "Body" },
    { id: "progression", icon: TrendingUp, label: "Progress" },
  ];

  const handleItemClick = (tabId: string) => {
    onTabSelect(tabId);
  };

  return (
    <div className={`
      fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-[60] safe-area-pb
      transition-transform duration-300 ease-out
      ${isVisible ? 'translate-y-0' : 'translate-y-full'}
    `}>
      <div className="flex items-center justify-center px-1 py-1 max-w-sm mx-auto">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`
                flex flex-col items-center justify-center min-h-[48px] px-2 py-1 flex-1 max-w-[80px]
                transition-all duration-200 rounded-lg ios-touch-feedback
                ${isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              <Icon className={`w-5 h-5 mb-1 transition-colors ${isActive ? "text-primary" : ""}`} />
              <span className={`text-xs font-medium leading-tight transition-colors ${isActive ? "text-primary" : ""}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}