import { 
  BarChart3,
  Target,
  Brain,
  User,
  TrendingUp,
  ShoppingCart
} from "lucide-react";

interface FloatingNutritionMenuProps {
  onTabSelect: (tab: string) => void;
  activeTab: string;
}

export function FloatingNutritionMenu({ onTabSelect, activeTab }: FloatingNutritionMenuProps) {
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
  };

  return (
    <div 
      className="fixed-viewport bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700"
      style={{ 
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        paddingTop: '8px'
      }}
    >
      {/* iOS Native Tab Bar */}
      <div className="flex items-center justify-around px-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`
                flex flex-col items-center justify-center min-w-0 flex-1 py-1 px-1 
                ios-touch-feedback touch-target rounded-lg
                transition-all duration-200 ease-out
                hover:bg-gray-100 dark:hover:bg-gray-800
                active:scale-95
                ${isActive ? 'bg-gray-100 dark:bg-gray-800' : ''}
              `}
            >
              <Icon 
                className={`w-6 h-6 mb-0.5 transition-colors duration-200 ${
                  isActive 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }`} 
              />
              <span 
                className={`text-xs font-medium truncate transition-colors duration-200 ${
                  isActive 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}