import { useState } from "react";
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
}

export function Nutrition({ user, activeTab: externalActiveTab, onTabChange, selectedDate, setSelectedDate, showDatePicker, setShowDatePicker, bodyTrackingDate, setBodyTrackingDate, showBodyDatePicker, setShowBodyDatePicker }: NutritionProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLogger, setShowLogger] = useState(false);
  const [loggerSelectedDate, setLoggerSelectedDate] = useState<string>();
  const [, setLocation] = useLocation();
  const activeTab = externalActiveTab || "overview";
  const setActiveTab = onTabChange || (() => {});

  const { data: nutritionSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/nutrition/summary', user.id, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/summary/${user.id}?date=${selectedDate}`);
      return response.json();
    }
  });

  const { data: nutritionLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['/api/nutrition/logs', user.id, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/logs/${user.id}?date=${selectedDate}`);
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
        <LoadingState message="Loading nutrition data..." type="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground w-full ios-pwa-container">
      <div className="w-full px-2 space-y-4 pl-[0px] pr-[0px] ml-[-4px] mr-[-4px]">
        {/* Ultra-Compact iOS Header */}
        <div className="ios-sticky-header bg-background/95 border-b border-border/10 -mx-2 px-4 py-2 ml-[-8px] mr-[-8px] mb-6">
          <div className="flex items-center justify-between h-[44px]">
            {/* Left: Back Arrow Only */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] p-0 hover:bg-accent/50 rounded-lg ios-touch-feedback ios-smooth-transform button-press-animation"
            >
              <ArrowLeft className="w-5 h-5 transition-transform duration-150" />
            </Button>
            
            {/* Center: Compact Title with Icon */}
            <div className="flex items-center gap-1.5 min-w-0 text-left pl-[0px] pr-[0px] ml-[105px] mr-[105px]">
              <Utensils className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 transition-colors duration-200" />
              <h1 className="text-base font-semibold transition-colors duration-200">Nutrition</h1>
            </div>
            
            {/* Right: Context Menu - Hidden per user request */}
          </div>
        </div>

        {/* Compact Date Selector - Only show on overview tab */}
        {activeTab === "overview" && (
          <div className="flex items-center justify-center py-1 mt-[-20px] mb-[-20px] pt-[0px] pb-[0px]">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const previousDay = TimezoneUtils.addDays(selectedDate, -1);
                  setSelectedDate(previousDay);
                  queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', user.id] });
                  queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', user.id] });
                }}
                className="ios-touch-feedback ios-smooth-transform p-1 text-foreground/60 hover:text-foreground transition-all duration-200 rounded-md min-h-[32px] min-w-[32px] flex items-center justify-center hover:bg-accent/30 active:scale-95"
              >
                <ChevronLeft className="h-3 w-3 transition-transform duration-150" />
              </button>
              
              <button
                onClick={() => setShowDatePicker(true)}
                className="ios-touch-feedback ios-smooth-transform flex items-center gap-1 px-2 py-1 rounded-md hover:bg-accent/50 transition-all duration-200 active:scale-98"
              >
                <span className="text-xs font-medium text-foreground transition-colors duration-150">
                  {TimezoneUtils.isToday(selectedDate) ? 'Today' : 
                   TimezoneUtils.parseUserDate(selectedDate).toLocaleDateString('en-GB', { 
                     day: '2-digit', 
                     month: '2-digit'
                   })}
                </span>
                <ChevronDown className="h-3 w-3 text-foreground/50 transition-transform duration-150" />
              </button>
              
              <button
                onClick={() => {
                  const nextDay = TimezoneUtils.addDays(selectedDate, 1);
                  setSelectedDate(nextDay);
                  queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', user.id] });
                  queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', user.id] });
                }}
                className="ios-touch-feedback ios-smooth-transform p-1 text-foreground/60 hover:text-foreground transition-all duration-200 rounded-md min-h-[32px] min-w-[32px] flex items-center justify-center hover:bg-accent/30 active:scale-95"
              >
                <ChevronRight className="h-3 w-3 transition-transform duration-150" />
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Nutrition Module */}
        <div className="mt-4 mb-32">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

            <TabsContent value="overview">
              <IntegratedNutritionOverview 
                userId={user.id} 
                selectedDate={selectedDate}
                onShowLogger={(selectedDate) => {
                  console.log('onShowLogger called from IntegratedNutritionOverview with date:', selectedDate, 'setting showLogger to true');
                  setLoggerSelectedDate(selectedDate);
                  setShowLogger(true);
                }}
                onDatePickerOpen={() => setShowDatePicker(true)}
              />
            </TabsContent>

            <TabsContent value="builder">
              <DietBuilder userId={user.id} />
            </TabsContent>

            <TabsContent value="advanced">
              <AdvancedMacroManagement userId={user.id} />
            </TabsContent>

            <TabsContent value="body">
              <BodyTracking 
                userId={user.id}
                selectedDate={bodyTrackingDate}
                setSelectedDate={setBodyTrackingDate}
                showDatePicker={showBodyDatePicker}
                setShowDatePicker={setShowBodyDatePicker}
              />
            </TabsContent>

            <TabsContent value="progression">
              <NutritionProgression userId={user.id} />
            </TabsContent>

            <TabsContent value="shopping">
              <ShoppingListGenerator userId={user.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Nutrition Logger Modal */}
        {showLogger && (
          <div style={{ position: 'relative', zIndex: 9999 }}>
            <NutritionLogger 
              userId={user.id}
              selectedDate={loggerSelectedDate}
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