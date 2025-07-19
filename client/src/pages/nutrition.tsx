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
import { MacroChart } from "@/components/macro-chart";
import { NutritionLogger } from "@/components/nutrition-logger";
import { MacroOverview } from "@/components/macro-overview";
import { DailyFoodLog } from "@/components/daily-food-log";
import { DietBuilder } from "@/components/diet-builder";
import { BodyTracking } from "@/components/body-tracking";
import { NutritionProgression } from "@/components/nutrition-progression";
import { AdvancedMacroManagement } from "@/components/advanced-macro-management";
import { ShoppingListGenerator } from "@/components/shopping-list-generator";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Trash2, Calendar, Target, Zap, Trophy, TrendingUp, Activity, Flame, Apple, Heart, Scale, Clipboard } from "lucide-react";

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

  const today = new Date().toISOString().split('T')[0];

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
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snack': return '🍎';
      default: return '🍽️';
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
          <p>Loading nutrition data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="container mx-auto p-4 space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("nutrition")} Tracking</h1>
            <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <Button 
            onClick={() => setShowLogger(true)}
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("log_food")}
          </Button>
        </div>



        {/* Athletic Nutrition Hub */}
        <div className="mt-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <div className="overflow-x-auto pb-2">
              <TabsList className="inline-flex h-16 p-2 bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl min-w-full border-2 border-blue-100 dark:border-gray-700 shadow-lg">
                <TabsTrigger 
                  value="overview" 
                  className="flex flex-col items-center gap-1 text-xs px-3 py-2 min-h-[56px] min-w-[80px] data-[state=active]:bg-gradient-to-b data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 hover:scale-105 font-semibold"
                >
                  <Target className="h-4 w-4" />
                  Performance
                </TabsTrigger>
                <TabsTrigger 
                  value="foodlog" 
                  className="flex flex-col items-center gap-1 text-xs px-3 py-2 min-h-[56px] min-w-[80px] data-[state=active]:bg-gradient-to-b data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 hover:scale-105 font-semibold"
                >
                  <Clipboard className="h-4 w-4" />
                  Fuel Log
                </TabsTrigger>
                <TabsTrigger 
                  value="builder" 
                  className="flex flex-col items-center gap-1 text-xs px-3 py-2 min-h-[56px] min-w-[80px] data-[state=active]:bg-gradient-to-b data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 hover:scale-105 font-semibold"
                >
                  <Apple className="h-4 w-4" />
                  Game Plan
                </TabsTrigger>
                <TabsTrigger 
                  value="advanced" 
                  className="flex flex-col items-center gap-1 text-xs px-3 py-2 min-h-[56px] min-w-[80px] data-[state=active]:bg-gradient-to-b data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 hover:scale-105 font-semibold"
                >
                  <Flame className="h-4 w-4" />
                  Elite Coach
                </TabsTrigger>
                <TabsTrigger 
                  value="body" 
                  className="flex flex-col items-center gap-1 text-xs px-3 py-2 min-h-[56px] min-w-[80px] data-[state=active]:bg-gradient-to-b data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 hover:scale-105 font-semibold"
                >
                  <Scale className="h-4 w-4" />
                  Physique
                </TabsTrigger>
                <TabsTrigger 
                  value="progression" 
                  className="flex flex-col items-center gap-1 text-xs px-3 py-2 min-h-[56px] min-w-[80px] data-[state=active]:bg-gradient-to-b data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 hover:scale-105 font-semibold"
                >
                  <TrendingUp className="h-4 w-4" />
                  Progress
                </TabsTrigger>
                <TabsTrigger 
                  value="shopping" 
                  className="flex flex-col items-center gap-1 text-xs px-3 py-2 min-h-[56px] min-w-[80px] data-[state=active]:bg-gradient-to-b data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 hover:scale-105 font-semibold"
                >
                  <Heart className="h-4 w-4" />
                  Shopping
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview">
              <MacroOverview userId={user.id} />
            </TabsContent>

            <TabsContent value="foodlog">
              <DailyFoodLog userId={user.id} />
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
          <NutritionLogger 
            userId={user.id}
            onComplete={() => {
              setShowLogger(false);
              queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', user.id] });
              queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', user.id] });
            }}
          />
        )}
      </div>
    </div>
  );
}