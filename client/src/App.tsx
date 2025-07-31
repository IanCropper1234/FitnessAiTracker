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
  
  // Enhanced PWA-compatible redirect logic
  useEffect(() => {
    const isIOSPWA = window.navigator.standalone === true || 
                     (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    
    if (!user && location !== "/auth") {
      console.log('Redirecting to auth - no user found');
      // Add delay for PWA mode to ensure proper initialization
      if (isIOSPWA) {
        setTimeout(() => setLocation("/auth"), 100);
      } else {
        setLocation("/auth");
      }
    } else if (user && location === "/auth") {
      console.log('User authenticated, redirecting to dashboard');
      // Ensure smooth transition in PWA mode
      if (isIOSPWA) {
        setTimeout(() => setLocation("/"), 100);
      } else {
        setLocation("/");
      }
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
  const [initError, setInitError] = useState<string | null>(null);

  // Check authentication status on app initialization with PWA-compatible handling
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication status...');
        
        // Check if running as iOS PWA
        const isIOSPWA = window.navigator.standalone === true || 
                         (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
        console.log('iOS PWA mode detected:', isIOSPWA);
        
        const response = await fetch('/api/auth/user', {
          credentials: 'include',
          cache: 'no-cache', // Prevent caching issues in PWA
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        console.log('Auth check response status:', response.status);
        
        if (response.ok) {
          const userData = await response.json();
          console.log('Authentication successful, user data:', userData);
          setUser(userData.user);
        } else {
          console.log('Not authenticated - no valid session');
          // In PWA mode, ensure we clear any stale data
          if (isIOSPWA) {
            localStorage.removeItem('fitai-auth-cache');
          }
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        // In case of network failure in PWA, try localStorage fallback
        const isIOSPWA = window.navigator.standalone === true;
        if (isIOSPWA) {
          console.log('PWA auth check failed, attempting localStorage recovery');
          const cachedAuth = localStorage.getItem('fitai-auth-cache');
          if (cachedAuth) {
            try {
              const { timestamp, user: cachedUser } = JSON.parse(cachedAuth);
              // Use cached user if less than 1 hour old
              if (Date.now() - timestamp < 3600000) {
                console.log('Using cached auth for PWA recovery');
                setUser(cachedUser);
              } else {
                localStorage.removeItem('fitai-auth-cache');
              }
            } catch (parseError) {
              console.error('Failed to parse cached auth:', parseError);
              localStorage.removeItem('fitai-auth-cache');
            }
          }
        }
        setInitError(error instanceof Error ? error.message : 'Authentication failed');
      } finally {
        setAuthLoading(false);
      }
    };

    // Add a small delay to ensure PWA environment is fully initialized
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  if (authLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <TooltipProvider>
              <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-pulse">Loading FitAI...</div>
                  <div className="text-xs text-gray-500">
                    {typeof window !== 'undefined' && window.navigator.standalone ? 'PWA Mode' : 'Web Mode'}
                  </div>
                  {initError && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-sm">
                      <div className="text-sm text-red-800 dark:text-red-200">
                        Initialization Error: {initError}
                      </div>
                      <Button 
                        onClick={() => window.location.reload()} 
                        className="mt-2 w-full"
                        size="sm"
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
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