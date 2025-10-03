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
import { useVisibilityDetection } from "./hooks/useVisibilityDetection";
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
import EmailVerification from "./pages/email-verification";
import EmailVerificationSuccess from "./pages/email-verification-success";
import PrivacyPolicy from "./pages/privacy-policy";
import TermsOfService from "./pages/terms-of-service";
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
import { HeaderProvider, useHeader } from "./contexts/HeaderContext";

interface User {
  id: number;
  email: string;
  name: string;
  emailVerified?: boolean;
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

  // Initialize iOS WebView visibility detection and auto-reload
  useVisibilityDetection({
    onVisibilityChange: (isVisible) => {
      console.log('[App] Visibility changed:', isVisible ? 'visible' : 'hidden');

      // Invalidate queries when app becomes visible to refresh data
      if (isVisible && user) {
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const key = query.queryKey;
            return Array.isArray(key) && (
              (key.includes('/api/nutrition/summary') && key.includes(user?.id)) ||
              (key.includes('/api/training/stats') && key.includes(user?.id)) ||
              (key.includes('/api/user/profile') && key.includes(user?.id))
            );
          }
        });
      }
    },
    onBlankPageDetected: () => {
      console.log('[App] Blank page detected by React hook');
    },
    onLongInactivity: () => {
      console.log('[App] Long inactivity detected');
    },
    enableAutoReload: true,
    inactivityThreshold: 30 * 60 * 1000 // 30 minutes
  });

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

  // Redirect logic with email verification gate
  useEffect(() => {
    const protectedPages = [
      '/exercise-selection',
      '/create-training-template', 
      '/edit-template',
      '/template'
    ];
    const isProtectedPage = protectedPages.some(page => location.startsWith(page));

    if (!user && location !== "/auth" && location !== "/email-verification") {
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
      // Check email verification status
      if (!user.emailVerified) {
        console.log('User authenticated but email not verified, redirecting to verification');
        setLocation("/email-verification");
      } else {
        console.log('User authenticated and verified, redirecting to dashboard');
        setTimeout(() => setLocation("/"), 50);
      }
    } else if (user && !user.emailVerified && location !== "/email-verification" && location !== "/auth") {
      // Block access to all pages if email not verified
      console.log('User not verified, redirecting to verification page');
      setLocation("/email-verification");
    } else if (user && user.emailVerified && location === "/email-verification") {
      // If verified user somehow ends up on verification page, redirect to dashboard
      console.log('User already verified, redirecting to dashboard');
      setLocation("/");
    }
  }, [user, location, setLocation]);

  const showBottomNav = user && location === "/";
  const showNutritionMenu = user && location === "/nutrition";
  const showTrainingMenu = user && location === "/training";

  return (
    <div className={`min-h-screen bg-white dark:bg-black ${showBottomNav || showNutritionMenu || showTrainingMenu ? 'pb-20' : 'pb-4'} theme-transition`}>
      <Switch>
        <Route path="/email-verification">
          <AnimatedPage>
            {user && !user.emailVerified ? (
              <EmailVerification 
                user={user as any}
                onVerificationSuccess={() => {
                  // Refresh user data to get updated verification status
                  window.location.reload();
                }}
                onReturnToLogin={() => {
                  setUser(null);
                  setLocation("/auth");
                }}
              />
            ) : (
              <Auth onSuccess={(user: any) => setUser({ ...user, emailVerified: user.emailVerified ?? true })} />
            )}
          </AnimatedPage>
        </Route>

        <Route path="/email-verification-success">
          <AnimatedPage>
            <EmailVerificationSuccess />
          </AnimatedPage>
        </Route>

        <Route path="/">
          <AnimatedPage>
            {user && user.emailVerified ? (
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
            <Auth onSuccess={(userData: any) => {
              console.log('Auth onSuccess called with user:', userData);
              setUser({ ...userData, emailVerified: userData.emailVerified ?? true });
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
        <Route path="/privacy-policy">
          <AnimatedPage>
            <PrivacyPolicy />
          </AnimatedPage>
        </Route>
        <Route path="/terms-of-service">
          <AnimatedPage>
            <TermsOfService />
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
function AppContent({ location, showGlobalHeader }: { location: string; showGlobalHeader: boolean }) {
  const { headerConfig } = useHeader();

  return (
    <>
      {/* 全域 iOS Sticky Header - 應用層級,WebView 控制 safe area */}
      {showGlobalHeader && (
        <div className="ios-sticky-header bg-background/95 border-b border-border/10 px-4 py-2 fixed top-0 left-0 right-0 z-50">
          <div className="flex items-center justify-between h-[44px]">
            {/* Left Button */}
            <div className="flex items-center justify-center min-h-[44px] min-w-[44px]">
              {headerConfig.leftButton || <div className="w-[44px]" />}
            </div>

            {/* Center: Title with Icon */}
            <div className="flex items-center gap-1.5 min-w-0">
              {headerConfig.icon}
              {headerConfig.title && (
                <h1 className="text-base font-semibold">{headerConfig.title}</h1>
              )}
            </div>

            {/* Right Button */}
            <div className="flex items-center justify-center min-h-[44px] min-w-[44px]">
              {headerConfig.rightButton || <div className="w-[44px]" />}
            </div>
          </div>
        </div>
      )}

      <AnimatedPage key={location}>
        <Switch location={location}>
          <Route path="/auth" component={AuthPage} />
          <Route path="/email-verification" component={EmailVerification} />
          <Route path="/email-verification-success" component={EmailVerificationSuccess} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <ProtectedRoute path="/" component={Home} />
          <ProtectedRoute path="/dashboard" component={Dashboard} />
          <ProtectedRoute path="/training" component={Training} />
          <ProtectedRoute path="/nutrition" component={Nutrition} />
          <ProtectedRoute path="/reports" component={Reports} />
          <ProtectedRoute path="/profile" component={Profile} />
          <ProtectedRoute path="/create-mesocycle" component={CreateMesocycle} />
          <ProtectedRoute path="/create-training-template" component={CreateTrainingTemplate} />
          <ProtectedRoute path="/edit-template/:id" component={EditTemplate} />
          <ProtectedRoute path="/template-details/:id" component={TemplateDetails} />
          <ProtectedRoute path="/create-workout-session" component={CreateWorkoutSession} />
          <ProtectedRoute path="/training-analytics" component={TrainingAnalytics} />
          <ProtectedRoute path="/add-food" component={AddFood} />
          <ProtectedRoute path="/nutrition-facts" component={NutritionFacts} />
          <ProtectedRoute path="/rp-coach" component={RPCoachPage} />
          <ProtectedRoute path="/exercise-selection" component={ExerciseSelection} />
          <ProtectedRoute path="/ai-exercise-recommendations" component={AIExerciseRecommendations} />
          <ProtectedRoute path="/enhanced-nutrition-ai" component={EnhancedNutritionAI} />
          <ProtectedRoute path="/language-demo" component={LanguageDemo} />
          <ProtectedRoute path="/wellness-test" component={WellnessTestPage} />
          <ProtectedRoute path="/workout-feedback" component={WorkoutFeedbackPage} />
          <ProtectedRoute path="/workout-settings" component={WorkoutSettings} />
          <ProtectedRoute path="/ios-notification-demo" component={IOSNotificationDemoPage} />
          <Route path="*" component={NotFound} />
        </Switch>
      </AnimatedPage>
    </>
  );
}

// Main App component that provides all contexts
export default function App() {
  // Track context initialization phases
  const [contextsReady, setContextsReady] = useState(false);

  // Use location hook here to determine if the global header should be shown
  const location = useLocation()[0];

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

  // 檢測是否顯示全域 header(排除 auth 相關頁面)
  const showGlobalHeader = !['/auth', '/email-verification', '/email-verification-success', '/onboarding', '/privacy-policy', '/terms-of-service'].includes(location);

  return (
    <ErrorBoundary level="critical">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <TooltipProvider>
              <WorkoutExecutionProvider>
                <AppContent location={location} showGlobalHeader={showGlobalHeader} />
              </WorkoutExecutionProvider>
            </TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}