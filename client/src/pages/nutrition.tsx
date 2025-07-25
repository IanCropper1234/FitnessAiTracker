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
import { IOSDatePicker } from "@/components/ui/ios-date-picker";
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
}

export function Nutrition({ user }: NutritionProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLogger, setShowLogger] = useState(false);
  const [loggerSelectedDate, setLoggerSelectedDate] = useState<string>();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(TimezoneUtils.getCurrentDate());

  const today = TimezoneUtils.getCurrentDate();

  const { data: nutritionSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/nutrition/summary', user.id, today],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/summary/${user.id}?date=${today}`);
      return response.json();
    }
  });

  const { data: nutritionLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['/api/nutrition/logs', user.id, today],
    queryFn: async () => {
      const response = await fetch(`/api/nutrition/logs/${user.id}?date=${today}`);
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
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white mx-auto mb-4"></div>
          <p className="text-body-sm">Loading nutrition data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground w-full ios-pwa-container">
      <div className="w-full px-2 space-y-4">
        {/* Ultra-Compact iOS Header */}
        <div className="ios-sticky-header bg-background/95 border-b border-border/10 -mx-2 px-4 py-2 ml-[-8px] mr-[-8px] mb-6">
          <div className="flex items-center justify-between h-[44px]">
            {/* Left: Back Arrow Only */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] p-0 hover:bg-accent/50 rounded-lg ios-touch-feedback"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            {/* Center: Compact Title with Icon */}
            <div className="flex items-center gap-1.5 min-w-0">
              <Utensils className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <h1 className="text-base font-semibold">Nutrition</h1>
            </div>
            
            {/* Right: Context Menu */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowDatePicker(true)}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] p-0 hover:bg-accent/50 rounded-lg ios-touch-feedback"
            >
              <Calendar className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Compact Date Selector */}
        <div className="flex items-center justify-center py-1 pt-[0px] pb-[0px] mt-[-20px] mb-[-20px]">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const previousDay = TimezoneUtils.addDays(selectedDate, -1);
                setSelectedDate(previousDay);
                queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', user.id] });
                queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', user.id] });
              }}
              className="ios-touch-feedback p-1 text-blue-500/70 hover:text-blue-500 transition-colors rounded-md min-h-[32px] min-w-[32px] flex items-center justify-center"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            
            <button
              onClick={() => setShowDatePicker(true)}
              className="ios-touch-feedback flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
            >
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {TimezoneUtils.isToday(selectedDate) ? 'Today' : 
                 TimezoneUtils.parseUserDate(selectedDate).toLocaleDateString('en-GB', { 
                   day: '2-digit', 
                   month: '2-digit'
                 })}
              </span>
              <ChevronDown className="h-3 w-3 text-blue-500/70" />
            </button>
            
            <button
              onClick={() => {
                const nextDay = TimezoneUtils.addDays(selectedDate, 1);
                setSelectedDate(nextDay);
                queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', user.id] });
                queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', user.id] });
              }}
              className="ios-touch-feedback p-1 text-blue-500/70 hover:text-blue-500 transition-colors rounded-md min-h-[32px] min-w-[32px] flex items-center justify-center"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Enhanced Nutrition Module */}
        <div className="mt-4">
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
              <BodyTracking userId={user.id} />
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

        {/* iOS Date Picker Modal */}
        <IOSDatePicker 
          selectedDate={selectedDate}
          onDateChange={(newDate) => {
            setSelectedDate(newDate);
            setShowDatePicker(false);
            // Invalidate queries to refresh data for the new date
            queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', user.id] });
            queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', user.id] });
          }}
          size="lg"
          showDatePicker={showDatePicker}
          setShowDatePicker={setShowDatePicker}
        />

        {/* Floating Nutrition Menu */}
        <FloatingNutritionMenu 
          onTabSelect={setActiveTab}
          activeTab={activeTab}
        />
      </div>
    </div>
  );
}