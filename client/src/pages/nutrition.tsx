import React, { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TimezoneUtils } from "@shared/utils/timezone";
import { NutritionLogger } from "@/components/nutrition-logger";
import { IntegratedNutritionOverview } from "@/components/integrated-nutrition-overview";
import { DietBuilder } from "@/components/diet-builder";
import { BodyTracking } from "@/components/body-tracking";
import { NutritionProgression } from "@/components/nutrition-progression";
import { AdvancedMacroManagement } from "@/components/advanced-macro-management";
import { ShoppingListGenerator } from "@/components/shopping-list-generator";


import { LoadingState, NutritionLogSkeleton } from "@/components/ui/loading";
import { useLocation } from "wouter";

import { AnimatedTabs, AnimatedTabsContent, AnimatedTabsList, AnimatedTabsTrigger } from "@/components/ui/animated-tabs";
import { FloatingNutritionMenu } from "@/components/floating-nutrition-menu";
import { 
  Plus, 
  Search, 
  Trash2, 
  Calendar,
  BarChart3,
  FileText,
  Target,
  Brain,
  User,
  TrendingUp,
  ShoppingCart,
  Sunrise,
  Sun,
  Moon,
  Apple,
  Utensils,
  ArrowLeft,
  Home,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from "lucide-react";

interface User {
  id: number;
  email: string;
  name: string;
}


interface NutritionProps {
  user: User;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
  bodyTrackingDate?: string;
  setBodyTrackingDate?: (date: string) => void;
  showBodyDatePicker?: boolean;
  setShowBodyDatePicker?: (show: boolean) => void;
  copyFromDate?: string;
  setCopyFromDate?: (date: string) => void;
  showCopyFromDatePicker?: boolean;
  setShowCopyFromDatePicker?: (show: boolean) => void;
  copyToDate?: string;
  setCopyToDate?: (date: string) => void;
  showCopyToDatePicker?: boolean;
  setShowCopyToDatePicker?: (show: boolean) => void;
}

export function Nutrition({ 
  user, 
  activeTab: externalActiveTab, 
  onTabChange, 
  selectedDate, 
  setSelectedDate, 
  showDatePicker, 
  setShowDatePicker, 
  bodyTrackingDate, 
  setBodyTrackingDate, 
  showBodyDatePicker, 
  setShowBodyDatePicker,
  copyFromDate,
  setCopyFromDate,
  showCopyFromDatePicker,
  setShowCopyFromDatePicker,
  copyToDate,
  setCopyToDate,
  showCopyToDatePicker,
  setShowCopyToDatePicker 
}: NutritionProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLogger, setShowLogger] = useState(false);
  const [loggerSelectedDate, setLoggerSelectedDate] = useState<string>();
  const [persistentMealType, setPersistentMealType] = useState('breakfast');
  const [, setLocation] = useLocation();
  const activeTab = externalActiveTab || "overview";
  const setActiveTab = onTabChange || (() => {});

  // Memoized tab content to prevent re-rendering
  const memoizedTabs = React.useMemo(() => ({
    overview: <IntegratedNutritionOverview 
      userId={user.id} 
      selectedDate={selectedDate}
      onShowLogger={(selectedDate) => {
        console.log('onShowLogger called from IntegratedNutritionOverview with date:', selectedDate, 'setting showLogger to true');
        setLoggerSelectedDate(selectedDate);
        setShowLogger(true);
      }}
      onDatePickerOpen={() => setShowDatePicker(true)}
      copyFromDate={copyFromDate}
      setCopyFromDate={setCopyFromDate}
      showCopyFromDatePicker={showCopyFromDatePicker}
      setShowCopyFromDatePicker={setShowCopyFromDatePicker}
      copyToDate={copyToDate}
      setCopyToDate={setCopyToDate}
      showCopyToDatePicker={showCopyToDatePicker}
      setShowCopyToDatePicker={setShowCopyToDatePicker}
      onCopyDateSelected={(date, operation) => {
        console.log('Copy date selected:', date, 'operation:', operation);
      }}
    />,
    builder: <DietBuilder userId={user.id} />,
    advanced: <AdvancedMacroManagement userId={user.id} />,
    body: <BodyTracking 
      userId={user.id}
      selectedDate={bodyTrackingDate}
      setSelectedDate={setBodyTrackingDate}
      showDatePicker={showBodyDatePicker}
      setShowDatePicker={setShowBodyDatePicker}
    />,
    progression: <NutritionProgression userId={user.id} />,
    shopping: <ShoppingListGenerator userId={user.id} />
  }), [user.id, selectedDate, bodyTrackingDate, copyFromDate, showCopyFromDatePicker, copyToDate, showCopyToDatePicker]);

  const { data: nutritionSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/nutrition/summary', user.id, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/summary?date=${selectedDate}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch nutrition summary');
      }
      return response.json();
    }
  });

  const { data: nutritionLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['/api/nutrition/logs', user.id, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/logs?date=${selectedDate}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch nutrition logs');
      }
      return response.json();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (logId: number) => {
      return await apiRequest("DELETE", `/api/nutrition/log/${logId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', user.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', user.id] });
      toast({
        title: "Success",
        description: "Food log deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete food log",
        variant: "destructive"
      });
    }
  });

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return <Sunrise className="h-4 w-4" />;
      case 'lunch': return <Sun className="h-4 w-4" />;
      case 'dinner': return <Moon className="h-4 w-4" />;
      case 'snack': return <Apple className="h-4 w-4" />;
      default: return <Utensils className="h-4 w-4" />;
    }
  };

  const formatMealType = (mealType: string) => {
    return mealType?.charAt(0).toUpperCase() + mealType?.slice(1) || 'Meal';
  };


  if (summaryLoading || logsLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center content-container">
        <div className="text-center">
          <div className="ios-loading-dots flex items-center gap-1 justify-center mb-4">
            <div className="dot w-2 h-2 bg-foreground rounded-full"></div>
            <div className="dot w-2 h-2 bg-foreground rounded-full"></div>
            <div className="dot w-2 h-2 bg-foreground rounded-full"></div>
          </div>
          <p className="text-muted-foreground">Loading nutrition data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground w-full ios-pwa-container">
      <div className="w-full px-2 space-y-2 pl-[0px] pr-[0px] ml-[-4px] mr-[-4px]">
        {/* Ultra-Compact iOS Header */}
        <div className="ios-sticky-header bg-background/95 border-b border-border/10 -mx-2 px-4 py-2 ml-[-8px] mr-[-8px] mb-2">
          <div className="flex items-center justify-between h-[44px]">
            {/* Left: Back Arrow Only */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/')}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] p-0 hover:bg-accent/50  ios-touch-feedback ios-smooth-transform button-press-animation"
            >
              <ArrowLeft className="w-5 h-5 transition-transform duration-150" />
            </Button>
            
            {/* Center: Compact Title with Icon */}
            <div className="flex items-center gap-1.5 min-w-0">
              <Utensils className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 transition-colors duration-200" />
              <h1 className="text-base font-semibold transition-colors duration-200">Nutrition</h1>
            </div>
            
            {/* Right: Context Menu */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowDatePicker(true)}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] p-0 hover:bg-accent/50  ios-touch-feedback ios-smooth-transform button-press-animation invisible"
            >
              <Calendar className="w-5 h-5 transition-transform duration-150" />
            </Button>
          </div>
        </div>

        {/* Enhanced Date Selector - Only show on overview tab */}
        {activeTab === "overview" && (
          <div className="flex items-center justify-center py-1 mt-[-8px] mb-[-8px]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const previousDay = TimezoneUtils.addDays(selectedDate, -1);
                  setSelectedDate(previousDay);
                  queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', user.id] });
                  queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', user.id] });
                }}
                className="ios-touch-feedback ios-smooth-transform p-2 text-foreground/60 hover:text-foreground transition-all duration-200  min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent/30 active:scale-95"
              >
                <ChevronLeft className="h-4 w-4 transition-transform duration-150" />
              </button>
              
              <button
                onClick={() => setShowDatePicker(true)}
                className="ios-touch-feedback ios-smooth-transform flex items-center gap-2 px-4 py-2  hover:bg-accent/50 transition-all duration-200 active:scale-98 min-h-[44px]"
              >
                <span className="text-sm font-medium text-foreground transition-colors duration-150">
                  {TimezoneUtils.isToday(selectedDate) ? 'Today' : 
                   TimezoneUtils.parseUserDate(selectedDate).toLocaleDateString('en-GB', { 
                     day: '2-digit', 
                     month: '2-digit'
                   })}
                </span>
                <ChevronDown className="h-4 w-4 text-foreground/50 transition-transform duration-150" />
              </button>
              
              <button
                onClick={() => {
                  const nextDay = TimezoneUtils.addDays(selectedDate, 1);
                  setSelectedDate(nextDay);
                  queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', user.id] });
                  queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', user.id] });
                }}
                className="ios-touch-feedback ios-smooth-transform p-2 text-foreground/60 hover:text-foreground transition-all duration-200  min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent/30 active:scale-95"
              >
                <ChevronRight className="h-4 w-4 transition-transform duration-150" />
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Nutrition Module */}
        <div className="mt-2 mb-32">
          <AnimatedTabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">

            <AnimatedTabsContent value="overview">
              {memoizedTabs.overview}
            </AnimatedTabsContent>

            <AnimatedTabsContent value="builder">
              {memoizedTabs.builder}
            </AnimatedTabsContent>

            <AnimatedTabsContent value="advanced">
              {memoizedTabs.advanced}
            </AnimatedTabsContent>

            <AnimatedTabsContent value="body">
              {memoizedTabs.body}
            </AnimatedTabsContent>

            <AnimatedTabsContent value="progression">
              {memoizedTabs.progression}
            </AnimatedTabsContent>

            <AnimatedTabsContent value="shopping">
              {memoizedTabs.shopping}
            </AnimatedTabsContent>
          </AnimatedTabs>
        </div>

        {/* Nutrition Logger Modal */}
        {showLogger && (
          <div style={{ position: 'relative', zIndex: 9999 }}>
            <NutritionLogger 
              userId={user.id}
              selectedDate={loggerSelectedDate}
              mealType={persistentMealType}
              onMealTypeChange={(newMealType) => {
                console.log('Nutrition page: Received meal type change:', newMealType);
                setPersistentMealType(newMealType);
              }}
              onComplete={() => {
                console.log('NutritionLogger onComplete called, setting showLogger to false');
                setShowLogger(false);
                setLoggerSelectedDate(undefined);
                queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', user.id] });
                queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', user.id] });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}