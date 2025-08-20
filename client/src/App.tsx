import { useState, useEffect, useCallback } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { IOSNotificationManager } from "@/components/ui/ios-notification-manager";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { LanguageProvider, useLanguage } from "@/components/language-provider";
import { ErrorBoundary, setupGlobalErrorHandling } from "@/components/error-boundary";
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
import { CreateWorkoutSession } from "./pages/create-workout-session";
import CreateTrainingTemplate from "./pages/create-training-template";
import TemplateDetails from "./pages/template-details";
import EditTemplatePage from "./pages/edit-template";
import CreateMesocyclePage from "./pages/create-mesocycle";
import ExerciseSelection from "./pages/exercise-selection";
import { ReportsPage } from "./pages/reports";
import { ProfilePage } from "./pages/profile";
import WellnessTestPage from "./pages/WellnessTestPage";
import RPCoachPage from "./pages/RPCoachPage";
import NutritionFactsPage from "./pages/nutrition-facts";
import WorkoutFeedbackPage from "./pages/WorkoutFeedbackPage";
import WorkoutSettings from "./pages/WorkoutSettings";
import { IOSNotificationDemo } from "./components/ui/ios-notification-demo";
import { NotFound } from "./components/NotFound";

import TrainingAnalytics from "./pages/training-analytics";
import AIExerciseRecommendations from "./pages/ai-exercise-recommendations";
import EnhancedNutritionAI from "./pages/enhanced-nutrition-ai";
import { AnimatedPage } from "./components/page-transition";
import { Settings, Sun, Moon, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { clearAllUserCache } from "./utils/cache-clear";
import { WorkoutExecutionProvider } from "@/contexts/WorkoutExecutionContext";
import { GlobalCompleteSetButton } from "@/components/GlobalCompleteSetButton";
import { FirstTimeUserLoading } from "@/components/FirstTimeUserLoading";
import { AppInitialLoading } from "@/components/AppInitialLoading";
import { InstantLoadingScreen } from "@/components/InstantLoadingScreen";
import { useFirstTimeUser } from "@/hooks/useFirstTimeUser";
import { initializeWorkoutSettings } from "@/hooks/useSettings";
import { AnimatePresence } from "framer-motion";

interface User {
  id: number;
  email: string;
  name: string;
}



function AppRouter({ user, setUser }: { user: User | null; setUser: (user: User | null) => void }) {
  const [location, setLocation] = useLocation();
  const [activeNutritionTab, setActiveNutritionTab] = useState("overview");
  const [activeTrainingTab, setActiveTrainingTab] = useState("sessions");
  
  // Initialize feature flags when user authentication state changes
  // Initialize workout settings when app starts
  useEffect(() => {
    if (user) {
      initializeWorkoutSettings();
    }
  }, [user]);
  
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
  
  // Completely disable cache clearing to prevent iOS PWA reload issues
  // Cache clearing was causing infinite loading states on PWA reload
  // useEffect(() => {
  //   // Cache clearing disabled to fix iOS PWA reload issue
  // }, []);

  // Redirect to auth if no user (but not if we're already checking auth)
  // IMPORTANT: Be more lenient with exercise-selection and template creation pages
  useEffect(() => {
    const protectedPages = [
      '/exercise-selection',
      '/create-training-template', 
      '/edit-template',
      '/template'
    ];
    const isProtectedPage = protectedPages.some(page => location.startsWith(page));
    
    if (!user && location !== "/auth") {
      // Delay redirect for protected pages to allow auth recovery
      if (isProtectedPage) {
        console.log('Protected page detected, delaying auth redirect to allow recovery');
        const timeoutId = setTimeout(() => {
          // Double-check user state before redirecting
          if (!user) {
            console.log('Auth recovery failed, redirecting to auth from protected page');
            setLocation("/auth");
          }
        }, 2000); // 2 second delay for auth recovery
        
        return () => clearTimeout(timeoutId);
      } else {
        console.log('Redirecting to auth - no user found');
        setLocation("/auth");
      }
    } else if (user && location === "/auth") {
      console.log('User authenticated, redirecting to dashboard');
      // Use a timeout to ensure React has time to process the user state change
      setTimeout(() => setLocation("/"), 50);
    }
  }, [user, location, setLocation]);

  const showBottomNav = user && location === "/";
  const showNutritionMenu = user && location === "/nutrition";
  const showTrainingMenu = user && location === "/training";

  return (
    <div className={`min-h-screen bg-white dark:bg-black ${showBottomNav || showNutritionMenu || showTrainingMenu ? 'pb-20' : 'pb-4'} theme-transition`}>
      <Switch>
        <Route path="/">
          <AnimatedPage>
            {user ? (
              <Dashboard 
                user={user} 
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                showDatePicker={showDatePicker}
                setShowDatePicker={setShowDatePicker}
              />
            ) : (
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-gray-600 dark:text-gray-400">Loading dashboard...</div>
              </div>
            )}
          </AnimatedPage>
        </Route>
        <Route path="/auth">
          <AnimatedPage>
            <Auth onSuccess={(userData: User) => {
              console.log('Auth onSuccess called with user:', userData);
              setUser(userData);
              // Use setTimeout to ensure state update completes before navigation
              setTimeout(() => {
                console.log('Navigating to dashboard after auth success');
                setLocation("/");
              }, 100);
            }} />
          </AnimatedPage>
        </Route>
        <Route path="/nutrition">
          <AnimatedPage>
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
          </AnimatedPage>
        </Route>
        <Route path="/add-food">
          <AnimatedPage>
            {user ? <AddFood user={user} /> : <div className="animate-pulse">Loading...</div>}
          </AnimatedPage>
        </Route>
        <Route path="/workout-feedback/:sessionId">
          <AnimatedPage>
            {user ? <WorkoutFeedbackPage /> : <div className="animate-pulse">Loading...</div>}
          </AnimatedPage>
        </Route>
        <Route path="/workout-settings">
          <AnimatedPage>
            {user ? <WorkoutSettings /> : <div className="animate-pulse">Loading...</div>}
          </AnimatedPage>
        </Route>
        <Route path="/training">
          <AnimatedPage>
            {user ? <TrainingPage user={user} activeTab={activeTrainingTab} onTabChange={setActiveTrainingTab} /> : <div className="animate-pulse">Loading...</div>}
          </AnimatedPage>
        </Route>
        <Route path="/create-workout-session">
          <AnimatedPage>
            {user ? <CreateWorkoutSession /> : <div className="animate-pulse">Loading...</div>}
          </AnimatedPage>
        </Route>
        <Route path="/exercise-selection/:source?">
          <AnimatedPage>
            {user ? <ExerciseSelection /> : (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="animate-pulse text-gray-600 dark:text-gray-400">Loading exercises...</div>
                  <div className="text-sm text-gray-500">Checking authentication...</div>
                </div>
              </div>
            )}
          </AnimatedPage>
        </Route>
        <Route path="/create-training-template">
          <AnimatedPage>
            {user ? <CreateTrainingTemplate /> : (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="animate-pulse text-gray-600 dark:text-gray-400">Loading template creator...</div>
                  <div className="text-sm text-gray-500">Checking authentication...</div>
                </div>
              </div>
            )}
          </AnimatedPage>
        </Route>
        <Route path="/create-mesocycle">
          <AnimatedPage>
            {user ? <CreateMesocyclePage /> : <div className="animate-pulse">Loading...</div>}
          </AnimatedPage>
        </Route>
        <Route path="/reports">
          <AnimatedPage>
            {user ? <ReportsPage userId={user.id} /> : <div className="animate-pulse">Loading...</div>}
          </AnimatedPage>
        </Route>
        <Route path="/profile">
          <AnimatedPage>
            {user ? <ProfilePage user={user} onSignOut={() => setUser(null)} /> : <div className="animate-pulse">Loading...</div>}
          </AnimatedPage>
        </Route>
        <Route path="/wellness-test">
          <AnimatedPage>
            {user ? <WellnessTestPage /> : <div className="animate-pulse">Loading...</div>}
          </AnimatedPage>
        </Route>
        <Route path="/rp-coach">
          <AnimatedPage>
            {user ? <RPCoachPage userId={user.id} /> : <div className="animate-pulse">Loading...</div>}
          </AnimatedPage>
        </Route>
        <Route path="/nutrition-facts">
          <AnimatedPage>
            {user ? <NutritionFactsPage /> : <div className="animate-pulse">Loading...</div>}
          </AnimatedPage>
        </Route>
        <Route path="/edit-template/:id">
          <AnimatedPage>
            {user ? <EditTemplatePage /> : <div className="animate-pulse">Loading...</div>}
          </AnimatedPage>
        </Route>
        <Route path="/template/:id">
          <AnimatedPage>
            {user ? <TemplateDetails /> : <div className="animate-pulse">Loading...</div>}
          </AnimatedPage>
        </Route>
        <Route path="/demo/notifications">
          <AnimatedPage>
            <IOSNotificationDemo />
          </AnimatedPage>
        </Route>
        <Route path="/training-analytics">
          <AnimatedPage>
            {user ? <TrainingAnalytics /> : <div className="animate-pulse">Loading...</div>}
          </AnimatedPage>
        </Route>
        <Route path="/create-ai-workout-session">
          <AnimatedPage>
            {user ? <AIExerciseRecommendations /> : <div className="animate-pulse">Loading...</div>}
          </AnimatedPage>
        </Route>
        <Route path="/enhanced-nutrition-ai">
          <AnimatedPage>
            {user ? <EnhancedNutritionAI /> : <div className="animate-pulse">Loading...</div>}
          </AnimatedPage>
        </Route>
        <Route>
          <AnimatedPage>
            <NotFound />
          </AnimatedPage>
        </Route>
      </Switch>
      
      {showBottomNav && <BottomNavigation />}
      {showNutritionMenu && <FloatingNutritionMenu onTabSelect={setActiveNutritionTab} activeTab={activeNutritionTab} />}
      {showTrainingMenu && <FloatingTrainingMenu onTabSelect={setActiveTrainingTab} activeTab={activeTrainingTab} />}
      
      {/* Global Complete Set Button */}
      <GlobalCompleteSetButton />
      
      {/* Global iOS Date Picker Modal */}
      {user && (
        <IOSDatePicker 
          selectedDate={selectedDate}
          onDateChange={(newDate) => {
            setSelectedDate(newDate);
            setShowDatePicker(false);
            // Invalidate queries to refresh data for the new date
            queryClient.invalidateQueries({ 
              predicate: (query) => {
                const key = query.queryKey;
                return Array.isArray(key) && (
                  (key.includes('/api/nutrition/summary') && key.includes(user?.id)) ||
                  (key.includes('/api/training/stats') && key.includes(user?.id))
                );
              }
            });
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
            queryClient.invalidateQueries({ 
              predicate: (query) => {
                const key = query.queryKey;
                return Array.isArray(key) && key.includes('/api/body-metrics') && key.includes(user?.id);
              }
            });
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
            queryClient.invalidateQueries({ 
              predicate: (query) => {
                const key = query.queryKey;
                return Array.isArray(key) && key.includes('/api/nutrition/logs') && key.includes(user?.id);
              }
            });
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

// Create a separate component for the main app logic
function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [minLoadingTime, setMinLoadingTime] = useState(true);
  const [previousUserId, setPreviousUserId] = useState<number | null>(null);
  
  // First-time user detection (now inside QueryClientProvider)
  const { 
    isFirstTimeUser, 
    isLoading: firstTimeUserLoading, 
    completeOnboarding 
  } = useFirstTimeUser(user?.id);
  
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Setup global error handling - must be at top level
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  // Clear cache when user changes to prevent data leakage
  useEffect(() => {
    if (user && previousUserId && user.id !== previousUserId) {
      console.log(`User changed from ${previousUserId} to ${user.id}, clearing old user cache`);
      // Clear cache for the previous user to prevent data leakage
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          if (Array.isArray(queryKey) && queryKey.length > 0) {
            const hasApiPath = queryKey.some(key => typeof key === 'string' && key.startsWith('/api/'));
            const hasPreviousUserId = queryKey.includes(previousUserId);
            // Invalidate queries that include the previous user ID
            return hasApiPath && hasPreviousUserId;
          }
          return false;
        }
      });
    }
    
    // Update the previous user ID
    if (user?.id) {
      setPreviousUserId(user.id);
    } else if (!user) {
      // User signed out, clear all cache to prevent any leakage
      console.log('User signed out, clearing all cache');
      queryClient.clear();
      setPreviousUserId(null);
    }
  }, [user?.id]);

  // Ensure minimum loading time for better UX
  useEffect(() => {
    // Show loading animation for at least 2.5 seconds
    const minLoadingTimer = setTimeout(() => {
      setMinLoadingTime(false);
    }, 2500);

    return () => clearTimeout(minLoadingTimer);
  }, []);

  // Check authentication status on app initialization with retry logic for iOS PWA
  useEffect(() => {
    const checkAuth = async (retryCount = 0) => {
      try {
        console.log(`Checking authentication status... (attempt ${retryCount + 1})`);
        const response = await fetch('/api/auth/user', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        console.log('Auth check response status:', response.status);
        if (response.ok) {
          const userData = await response.json();
          console.log('Authentication successful, user data:', userData);
          setUser(userData.user);
        } else {
          console.log('Not authenticated - no valid session');
          // In iOS PWA, sometimes the first auth check fails due to timing issues
          // Retry once after a short delay
          if (retryCount === 0) {
            console.log('Retrying authentication check in iOS PWA environment...');
            setTimeout(() => checkAuth(1), 1000);
            return;
          }
        }
      } catch (error) {
        console.log('Authentication check failed:', error);
        // Retry once on network error in PWA environment
        if (retryCount === 0) {
          console.log('Retrying authentication check due to network error...');
          setTimeout(() => checkAuth(1), 1500);
          return;
        }
      } finally {
        if (retryCount > 0) {
          setAuthLoading(false);
        }
      }
      
      if (retryCount === 0) {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);
  
  // Show onboarding for first-time users after auth is complete
  useEffect(() => {
    if (!authLoading && user && !firstTimeUserLoading) {
      setShowOnboarding(isFirstTimeUser);
    }
  }, [authLoading, user, isFirstTimeUser, firstTimeUserLoading]);
  
  // Handle onboarding completion
  const handleOnboardingComplete = useCallback(() => {
    completeOnboarding();
    setShowOnboarding(false);
  }, [completeOnboarding]);

  if (authLoading || minLoadingTime || (user && firstTimeUserLoading)) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <TooltipProvider>
              <AppInitialLoading />
            </TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
    <div className="text-foreground bg-background theme-transition">
      <AnimatePresence mode="wait">
        {showOnboarding ? (
          <FirstTimeUserLoading 
            key="onboarding"
            onComplete={handleOnboardingComplete}
          />
        ) : (
          <div key="main-app">
            <ErrorBoundary level="page">
              <AppRouter user={user} setUser={setUser} />
            </ErrorBoundary>
            <Toaster />
            <IOSNotificationManager 
              position="top" 
              maxNotifications={3}
              defaultAutoHideDelay={5000}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main App component that provides all contexts
export default function App() {
  // Track context initialization phases
  const [contextsReady, setContextsReady] = useState(false);
  
  // Mark contexts as ready after minimal delay
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      const timer = setTimeout(() => {
        setContextsReady(true);
      }, 50); // Minimal delay for context setup
      
      return () => clearTimeout(timer);
    });
  }, []);
  
  // Show instant loading screen before any context initialization
  if (!contextsReady) {
    return <InstantLoadingScreen />;
  }
  
  return (
    <ErrorBoundary level="critical">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <TooltipProvider>
              <WorkoutExecutionProvider>
                <AppContent />
              </WorkoutExecutionProvider>
            </TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}