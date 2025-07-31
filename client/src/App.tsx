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
import { IOSDatePicker } from "@/components/ui/ios-date-picker";
import { TimezoneUtils } from "@shared/utils/timezone";
import Auth from "./pages/auth";
import { Dashboard } from "./pages/dashboard";
import { Nutrition } from "./pages/nutrition";
import { AddFood } from "./pages/add-food";
import { TrainingPage } from "./pages/training";
import { ReportsPage } from "./pages/reports";
import { ProfilePage } from "./pages/profile";
import WellnessTestPage from "./pages/WellnessTestPage";
import RPCoachPage from "./pages/RPCoachPage";
import NutritionFactsPage from "./pages/nutrition-facts";
import { NotFound } from "./components/NotFound";
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
  
  // Global date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(TimezoneUtils.getCurrentDate());
  
  // Body tracking specific date picker state
  const [showBodyDatePicker, setShowBodyDatePicker] = useState(false);
  const [bodyTrackingDate, setBodyTrackingDate] = useState(TimezoneUtils.getCurrentDate());
  
  // Copy meal date picker states
  const [showCopyFromDatePicker, setShowCopyFromDatePicker] = useState(false);
  const [copyFromDate, setCopyFromDate] = useState("");
  const [showCopyToDatePicker, setShowCopyToDatePicker] = useState(false);
  const [copyToDate, setCopyToDate] = useState("");
  
  // Redirect to auth if no user (but not if we're already checking auth)
  useEffect(() => {
    if (!user && location !== "/auth") {
      console.log('Redirecting to auth - no user found');
      setLocation("/auth");
    } else if (user && location === "/auth") {
      console.log('User authenticated, redirecting to dashboard');
      setLocation("/");
    }
  }, [user, location, setLocation]);

  const showBottomNav = user && location === "/";
  const showNutritionMenu = user && location === "/nutrition";
  const showTrainingMenu = user && location === "/training";

  return (
    <div className={`min-h-screen bg-white dark:bg-black ${showBottomNav || showNutritionMenu || showTrainingMenu ? 'pb-20' : 'pb-4'} theme-transition`}>
      <Switch>
        <Route path="/">
          <div className="page-enter ios-animation ios-smooth-transform">
            {user ? (
              <Dashboard 
                user={user} 
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                showDatePicker={showDatePicker}
                setShowDatePicker={setShowDatePicker}
              />
            ) : (
              <div className="animate-pulse">Loading...</div>
            )}
          </div>
        </Route>
        <Route path="/auth">
          <div className="page-enter ios-animation">
            <Auth onSuccess={(userData: User) => {
              setUser(userData);
              setLocation("/");
            }} />
          </div>
        </Route>
        <Route path="/nutrition">
          <div className="page-enter ios-animation ios-smooth-transform">
            {user ? (
              <Nutrition 
                user={user} 
                activeTab={activeNutritionTab} 
                onTabChange={setActiveNutritionTab}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                showDatePicker={showDatePicker}
                setShowDatePicker={setShowDatePicker}
                bodyTrackingDate={bodyTrackingDate}
                setBodyTrackingDate={setBodyTrackingDate}
                showBodyDatePicker={showBodyDatePicker}
                setShowBodyDatePicker={setShowBodyDatePicker}
                copyFromDate={copyFromDate}
                setCopyFromDate={setCopyFromDate}
                showCopyFromDatePicker={showCopyFromDatePicker}
                setShowCopyFromDatePicker={setShowCopyFromDatePicker}
                copyToDate={copyToDate}
                setCopyToDate={setCopyToDate}
                showCopyToDatePicker={showCopyToDatePicker}
                setShowCopyToDatePicker={setShowCopyToDatePicker}
              />
            ) : (
              <div className="animate-pulse">Loading...</div>
            )}
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
        <Route path="/wellness-test">
          <div className="page-enter ios-animation ios-smooth-transform">
            {user ? <WellnessTestPage /> : <div className="animate-pulse">Loading...</div>}
          </div>
        </Route>
        <Route path="/rp-coach">
          <div className="page-enter ios-animation ios-smooth-transform">
            {user ? <RPCoachPage userId={user.id} /> : <div className="animate-pulse">Loading...</div>}
          </div>
        </Route>
        <Route path="/nutrition-facts">
          <div className="page-enter ios-animation ios-smooth-transform">
            {user ? <NutritionFactsPage /> : <div className="animate-pulse">Loading...</div>}
          </div>
        </Route>
        <Route>
          <NotFound />
        </Route>
      </Switch>
      
      {showBottomNav && <BottomNavigation />}
      {showNutritionMenu && <FloatingNutritionMenu onTabSelect={setActiveNutritionTab} activeTab={activeNutritionTab} />}
      {showTrainingMenu && <FloatingTrainingMenu onTabSelect={setActiveTrainingTab} activeTab={activeTrainingTab} />}
      
      {/* Global iOS Date Picker Modal */}
      {user && (
        <IOSDatePicker 
          selectedDate={selectedDate}
          onDateChange={(newDate) => {
            setSelectedDate(newDate);
            setShowDatePicker(false);
            // Invalidate queries to refresh data for the new date
            queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
            queryClient.invalidateQueries({ queryKey: ['/api/training/stats'] });
          }}
          size="lg"
          showDatePicker={showDatePicker}
          setShowDatePicker={setShowDatePicker}
        />
      )}
      
      {/* Body Tracking iOS Date Picker Modal */}
      {user && (
        <IOSDatePicker 
          selectedDate={bodyTrackingDate}
          onDateChange={(newDate) => {
            setBodyTrackingDate(newDate);
            setShowBodyDatePicker(false);
            // Invalidate body metrics queries to refresh data for the new date
            queryClient.invalidateQueries({ queryKey: ['/api/body-metrics'] });
          }}
          size="lg"
          showDatePicker={showBodyDatePicker}
          setShowDatePicker={setShowBodyDatePicker}
        />
      )}

      {/* Copy From Date iOS Date Picker Modal */}
      {user && (
        <IOSDatePicker 
          selectedDate={copyFromDate || TimezoneUtils.getCurrentDate()}
          onDateChange={(newDate) => {
            setCopyFromDate(newDate);
            setShowCopyFromDatePicker(false);
            // Invalidate copy source logs query to refresh data
            queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', newDate] });
          }}
          size="lg"
          showDatePicker={showCopyFromDatePicker}
          setShowDatePicker={setShowCopyFromDatePicker}
        />
      )}

      {/* Copy To Date iOS Date Picker Modal */}
      {user && (
        <IOSDatePicker 
          selectedDate={copyToDate || TimezoneUtils.getCurrentDate()}
          onDateChange={(newDate) => {
            setCopyToDate(newDate);
            setShowCopyToDatePicker(false);
          }}
          size="lg"
          showDatePicker={showCopyToDatePicker}
          setShowDatePicker={setShowCopyToDatePicker}
        />
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication status on app initialization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication status...');
        const response = await fetch('/api/auth/user', {
          credentials: 'include'
        });
        console.log('Auth check response status:', response.status);
        if (response.ok) {
          const userData = await response.json();
          console.log('Authentication successful, user data:', userData);
          setUser(userData.user);
        } else {
          console.log('Not authenticated - no valid session');
        }
      } catch (error) {
        console.log('Authentication check failed:', error);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (authLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <TooltipProvider>
              <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="animate-pulse">Loading...</div>
              </div>
            </TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <div className="text-foreground bg-background theme-transition">
              <AppRouter user={user} setUser={setUser} />
              <Toaster />
            </div>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}