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
  
  // iOS PWA-compatible redirect logic with immediate navigation
  useEffect(() => {
    const isIOSPWA = window.navigator.standalone === true || 
                     (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    
    console.log('FitAI PWA Navigation - User:', !!user, 'Location:', location, 'iOS PWA:', isIOSPWA);
    
    // Simplified navigation logic to prevent redirect loops
    if (!user && location !== "/auth") {
      console.log('Redirecting to auth - no user found');
      if (isIOSPWA) {
        // Only redirect if we haven't just tried authentication
        const lastAuthAttempt = localStorage.getItem('fitai-last-auth-attempt');
        const now = Date.now();
        if (!lastAuthAttempt || now - parseInt(lastAuthAttempt) > 5000) {
          localStorage.setItem('fitai-last-auth-attempt', now.toString());
          window.location.replace(window.location.origin + "/auth");
        }
      } else {
        setLocation("/auth");
      }
    } else if (user && location === "/auth") {
      console.log('User authenticated, redirecting to dashboard');
      // Clear auth attempt timestamp on successful auth
      localStorage.removeItem('fitai-last-auth-attempt');
      if (isIOSPWA) {
        window.location.replace(window.location.origin + "/");
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
              console.log('FitAI PWA: Auth success, user data received');
              setUser(userData);
              
              // iOS PWA: Cache auth and navigate
              const isIOSPWA = window.navigator.standalone === true;
              if (isIOSPWA) {
                console.log('FitAI PWA: Caching auth state and navigating');
                // Cache the successful authentication
                localStorage.setItem('fitai-auth-cache', JSON.stringify({
                  timestamp: Date.now(),
                  user: userData,
                  sessionValid: true
                }));
                
                // Navigate immediately
                window.location.replace(window.location.origin + '/');
              } else {
                setLocation("/");
              }
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

  // iOS PWA-compatible authentication with blank page prevention
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('FitAI PWA: Starting authentication check...');
        
        // Detect iOS PWA mode
        const isIOSPWA = window.navigator.standalone === true || 
                         (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
        console.log('FitAI PWA: iOS PWA mode detected:', isIOSPWA);
        
        // For iOS PWA, check if we need to handle URL directly
        if (isIOSPWA) {
          const currentPath = window.location.pathname;
          console.log('FitAI PWA: Current path:', currentPath);
          
          // If we're not on a valid route, redirect to home
          const validRoutes = ['/', '/auth', '/nutrition', '/add-food', '/training', '/reports', '/profile', '/wellness-test', '/rp-coach'];
          if (!validRoutes.includes(currentPath)) {
            console.log('FitAI PWA: Invalid route detected, redirecting to home');
            window.location.href = window.location.origin + '/';
            return;
          }
        }
        
        const response = await fetch('/api/auth/user', {
          credentials: 'include',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'X-PWA-Mode': isIOSPWA ? 'ios-standalone' : 'web'
          }
        });
        
        console.log('FitAI PWA: Auth check response status:', response.status);
        
        if (response.ok) {
          const userData = await response.json();
          console.log('FitAI PWA: Authentication successful');
          setUser(userData.user);
          
          // For iOS PWA, always cache authentication state
          if (isIOSPWA) {
            const authCache = {
              timestamp: Date.now(),
              user: userData.user,
              sessionValid: true
            };
            localStorage.setItem('fitai-auth-cache', JSON.stringify(authCache));
            console.log('FitAI PWA: Cached auth state for PWA');
          }
        } else {
          console.log('FitAI PWA: Not authenticated - no valid session');
          
          // For iOS PWA, check cache before giving up
          if (isIOSPWA) {
            const cachedAuth = localStorage.getItem('fitai-auth-cache');
            if (cachedAuth) {
              try {
                const { timestamp, user: cachedUser, sessionValid } = JSON.parse(cachedAuth);
                // Use cached auth if less than 30 minutes old and marked valid
                if (Date.now() - timestamp < 1800000 && sessionValid) {
                  console.log('FitAI PWA: Using valid cached auth');
                  setUser(cachedUser);
                  return;
                }
              } catch (e) {
                console.error('FitAI PWA: Failed to parse cached auth');
              }
            }
            localStorage.removeItem('fitai-auth-cache');
          }
        }
      } catch (error) {
        console.error('FitAI PWA: Authentication check failed:', error);
        const isIOSPWA = window.navigator.standalone === true;
        
        if (isIOSPWA) {
          console.log('FitAI PWA: Attempting localStorage recovery');
          const cachedAuth = localStorage.getItem('fitai-auth-cache');
          if (cachedAuth) {
            try {
              const { timestamp, user: cachedUser } = JSON.parse(cachedAuth);
              if (Date.now() - timestamp < 3600000) {
                console.log('FitAI PWA: Using cached auth for recovery');
                setUser(cachedUser);
                return;
              }
            } catch (parseError) {
              console.error('FitAI PWA: Failed to parse cached auth');
            }
          }
          localStorage.removeItem('fitai-auth-cache');
        }
        setInitError(error instanceof Error ? error.message : 'Authentication failed');
      } finally {
        setAuthLoading(false);
      }
    };

    // Immediate check for iOS PWA, delayed for web
    const isIOSPWA = window.navigator.standalone === true;
    const delay = isIOSPWA ? 0 : 100;
    const timer = setTimeout(checkAuth, delay);
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