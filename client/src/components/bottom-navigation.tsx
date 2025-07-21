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

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  return (
    <>
      {/* iOS Safe Area Bottom Padding */}
      <div className="h-20 md:h-0" />
      
      {/* iOS-style Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50 pb-safe">
        <div className="flex items-center justify-around px-4 py-2 min-h-[83px]">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`flex flex-col items-center justify-center space-y-1 py-2 px-3 rounded-lg transition-all duration-200 active:scale-95 touch-manipulation min-w-[60px] min-h-[60px] ${
                  isActive 
                    ? "text-blue-500 dark:text-blue-400" 
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <div className={`transition-all duration-200 ${
                  isActive ? "scale-110" : "scale-100"
                }`}>
                  <Icon className={`w-6 h-6 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                </div>
                <span className={`text-xs font-medium transition-all duration-200 ${
                  isActive ? "font-semibold" : "font-normal"
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 dark:bg-blue-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}