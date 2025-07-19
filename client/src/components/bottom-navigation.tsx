import { useLocation } from "wouter";
import { useLanguage } from "./language-provider";
import { Home, Utensils, Dumbbell, BarChart3, User } from "lucide-react";

export function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { path: "/dashboard", icon: Home, label: t("dashboard") },
    { path: "/nutrition", icon: Utensils, label: t("nutrition") },
    { path: "/training", icon: Dumbbell, label: t("training") },
    { path: "/reports", icon: BarChart3, label: t("reports") },
    { path: "/profile", icon: User, label: t("profile") },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-800/50 z-50 pb-safe">
      {/* iOS-style navigation with enhanced touch targets and safe area support */}
      <div className="grid grid-cols-5 h-20">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`
                flex flex-col items-center justify-center space-y-1 text-xs
                min-h-[44px] px-2 py-2 mx-1 rounded-xl
                transition-all duration-200 ease-out
                transform-gpu active:scale-95
                ${
                  isActive 
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20 shadow-sm" 
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                }
              `}
            >
              <Icon 
                className={`w-6 h-6 transition-transform duration-200 ${
                  isActive ? "scale-110" : ""
                }`} 
              />
              <span className={`font-medium leading-none ${
                isActive ? "text-blue-600 dark:text-blue-400" : ""
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}