import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { LanguageProvider, useLanguage } from "@/components/language-provider";
import { BottomNavigation } from "@/components/bottom-navigation";
import { FloatingNutritionMenu } from "@/components/floating-nutrition-menu";
import { FloatingTrainingMenu } from "@/components/floating-training-menu";
import Auth from "./pages/auth";
import { Dashboard } from "./pages/dashboard";
import { Nutrition } from "./pages/nutrition";
import { AddFood } from "./pages/add-food";
import { TrainingPage } from "./pages/training";
import { ReportsPage } from "./pages/reports";
import { ProfilePage } from "./pages/profile";
import { Settings, Sun, Moon, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  id: number;
  email: string;
  name: string;
}



function AppRouter({ user, setUser }: { user: User | null; setUser: (user: User | null) => void }) {
  const [location, setLocation] = useLocation();
  const [activeNutritionTab, setActiveNutritionTab] = useState("overview");
  const [activeTrainingTab, setActiveTrainingTab] = useState("sessions");
  
  // Redirect to auth if no user
  useEffect(() => {
    if (!user && location !== "/auth") {
      setLocation("/auth");
    } else if (user && location === "/auth") {
      setLocation("/dashboard");
    }
  }, [user, location, setLocation]);

  const showBottomNav = user && location === "/dashboard";
  const showNutritionMenu = user && location === "/nutrition";
  const showTrainingMenu = user && location === "/training";

  return (
    <div className={`min-h-screen bg-white dark:bg-black ${showBottomNav || showNutritionMenu || showTrainingMenu ? 'pb-20' : 'pb-4'} theme-transition`}>
      <Switch>
        <Route path="/auth">
          <div className="page-enter ios-animation">
            <Auth onSuccess={(userData: User) => {
              setUser(userData);
              setLocation("/dashboard");
            }} />
          </div>
        </Route>
        <Route path="/dashboard">
          <div className="page-enter ios-animation ios-smooth-transform">
            {user ? <Dashboard user={user} /> : <div className="animate-pulse">Loading...</div>}
          </div>
        </Route>
        <Route path="/nutrition">
          <div className="page-enter ios-animation ios-smooth-transform">
            {user ? <Nutrition user={user} activeTab={activeNutritionTab} onTabChange={setActiveNutritionTab} /> : <div className="animate-pulse">Loading...</div>}
          </div>
        </Route>
        <Route path="/add-food">
          <div className="page-enter ios-animation ios-smooth-transform">
            {user ? <AddFood user={user} /> : <div className="animate-pulse">Loading...</div>}
          </div>
        </Route>
        <Route path="/training">
          <div className="page-enter ios-animation ios-smooth-transform">
            {user ? <TrainingPage user={user} activeTab={activeTrainingTab} onTabChange={setActiveTrainingTab} /> : <div className="animate-pulse">Loading...</div>}
          </div>
        </Route>
        <Route path="/reports">
          <div className="page-enter ios-animation ios-smooth-transform">
            {user ? <ReportsPage userId={user.id} /> : <div className="animate-pulse">Loading...</div>}
          </div>
        </Route>
        <Route path="/profile">
          <div className="page-enter ios-animation ios-smooth-transform">
            {user ? <ProfilePage user={user} onSignOut={() => setUser(null)} /> : <div className="animate-pulse">Loading...</div>}
          </div>
        </Route>
        <Route>
          <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">404 - Page Not Found</h1>
              <Button 
                onClick={() => setLocation("/dashboard")}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </Route>
      </Switch>
      
      {showBottomNav && <BottomNavigation />}
      {showNutritionMenu && <FloatingNutritionMenu onTabSelect={setActiveNutritionTab} activeTab={activeNutritionTab} />}
      {showTrainingMenu && <FloatingTrainingMenu onTabSelect={setActiveTrainingTab} activeTab={activeTrainingTab} />}
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-white dark:bg-black">
              <Toaster />
              <AppRouter user={user} setUser={setUser} />
            </div>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;