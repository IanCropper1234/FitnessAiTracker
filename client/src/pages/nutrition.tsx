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
  Home
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
    <div className="min-h-screen bg-background text-foreground w-full">
      <div className="w-full px-2 py-4 space-y-4">
        {/* iOS-optimized Header Navigation for iPhone SE/12 mini */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/20 -mx-2 px-3 py-3 ml-[-8px] mr-[-8px] mt-[-15px] mb-[-15px] pt-[0px] pb-[0px] pl-[12.000001px] pr-[12.000001px]">
          <div className="flex items-center justify-between min-h-[44px]">
            {/* Left: Back to Dashboard */}
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/dashboard')}
                className="flex items-center gap-1.5 px-2 py-2 min-h-[44px] hover:bg-accent rounded-lg ios-touch-feedback"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium hidden xs:inline">Back</span>
              </Button>
            </div>
            
            {/* Center: Page Title with Icon */}
            <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
              <Utensils className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <h1 className="text-lg font-semibold">Nutrition</h1>
            </div>
            
            {/* Right: Home Button - Perfect alignment match */}
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/dashboard')}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] px-2 py-2 hover:bg-accent rounded-lg ios-touch-feedback"
              >
                <Home className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          
        </div>



        {/* Enhanced Nutrition Module */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

            <TabsContent value="overview">
              <IntegratedNutritionOverview 
                userId={user.id} 
                onShowLogger={(selectedDate) => {
                  console.log('onShowLogger called from IntegratedNutritionOverview with date:', selectedDate, 'setting showLogger to true');
                  setLoggerSelectedDate(selectedDate);
                  setShowLogger(true);
                }}
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

        {/* Floating Nutrition Menu */}
        <FloatingNutritionMenu 
          onTabSelect={setActiveTab}
          activeTab={activeTab}
        />
      </div>
    </div>
  );
}