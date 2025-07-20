import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "./language-provider";
import { Home, Utensils, Dumbbell, BarChart3, User, Menu, X } from "lucide-react";

export function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
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
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Action Buttons */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 flex flex-col-reverse space-y-reverse space-y-3 animate-in slide-in-from-bottom-2 fade-in-0 duration-200">
          {navItems.map((item, index) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${
                  isActive 
                    ? "bg-black dark:bg-white text-white dark:text-black" 
                    : "bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'both'
                }}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 hover:scale-105 ${
          isExpanded 
            ? "bg-red-500 hover:bg-red-600 text-white rotate-45" 
            : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
        }`}
      >
        {isExpanded ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}