import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { LanguageProvider, useLanguage } from "@/components/language-provider";
import { BottomNavigation } from "@/components/bottom-navigation";
import Auth from "./pages/auth";
import { Dashboard } from "./pages/dashboard";
import { Nutrition } from "./pages/nutrition";
import { TrainingPage } from "./pages/training";
import { ProfilePage } from "./pages/profile";
import { Settings, Sun, Moon, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  id: number;
  email: string;
  name: string;
}

function HeaderControls() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  
  return (
    <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
      {/* Language Selector */}
      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger className="w-20 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
          <Globe className="w-4 h-4" />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600">
          <SelectItem value="en">EN</SelectItem>
          <SelectItem value="es">ES</SelectItem>
          <SelectItem value="ja">JA</SelectItem>
          <SelectItem value="zh-CN">中文</SelectItem>
          <SelectItem value="de">DE</SelectItem>
          <SelectItem value="zh-TW">繁中</SelectItem>
        </SelectContent>
      </Select>
      
      {/* Theme Toggle */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        {theme === "light" ? (
          <Moon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        ) : (
          <Sun className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        )}
      </Button>
    </div>
  );
}

function AppRouter({ user, setUser }: { user: User | null; setUser: (user: User | null) => void }) {
  const [location, setLocation] = useLocation();
  
  // Redirect to auth if no user
  useEffect(() => {
    if (!user && location !== "/auth") {
      setLocation("/auth");
    } else if (user && location === "/auth") {
      setLocation("/dashboard");
    }
  }, [user, location, setLocation]);

  const showBottomNav = user && location !== "/auth";

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <HeaderControls />
      
      <Switch>
        <Route path="/auth">
          <Auth onSuccess={(userData: User) => {
            setUser(userData);
            setLocation("/dashboard");
          }} />
        </Route>
        <Route path="/dashboard">
          {user ? <Dashboard user={user} /> : <div>Loading...</div>}
        </Route>
        <Route path="/nutrition">
          {user ? <Nutrition user={user} /> : <div>Loading...</div>}
        </Route>
        <Route path="/training">
          {user ? <TrainingPage user={user} /> : <div>Loading...</div>}
        </Route>
        <Route path="/profile">
          {user ? <ProfilePage user={user} onSignOut={() => setUser(null)} /> : <div>Loading...</div>}
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