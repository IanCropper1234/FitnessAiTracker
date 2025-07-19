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
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 z-50">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center justify-center space-y-1 text-xs transition-colors ${
                isActive 
                  ? "text-black dark:text-white" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}