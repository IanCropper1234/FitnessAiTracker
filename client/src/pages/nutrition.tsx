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
import { UserProfile } from "@/components/user-profile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Trash2, Calendar } from "lucide-react";

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
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white pb-20">
      <div className="container mx-auto p-4 space-y-6">
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



        {/* Enhanced Nutrition Module */}
        <div className="mt-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <TabsTrigger 
                value="overview" 
                className="text-xs sm:text-sm px-1 sm:px-2 py-2 data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 rounded-md transition-all"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="foodlog" 
                className="text-xs sm:text-sm px-1 sm:px-2 py-2 data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 rounded-md transition-all"
              >
                Food Log
              </TabsTrigger>
              <TabsTrigger 
                value="builder" 
                className="text-xs sm:text-sm px-1 sm:px-2 py-2 data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 rounded-md transition-all"
              >
                Diet Plan
              </TabsTrigger>
              <TabsTrigger 
                value="body" 
                className="text-xs sm:text-sm px-1 sm:px-2 py-2 data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 rounded-md transition-all"
              >
                Body
              </TabsTrigger>
              <TabsTrigger 
                value="progression" 
                className="text-xs sm:text-sm px-1 sm:px-2 py-2 data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 rounded-md transition-all"
              >
                Progress
              </TabsTrigger>
              <TabsTrigger 
                value="profile" 
                className="text-xs sm:text-sm px-1 sm:px-2 py-2 data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 rounded-md transition-all"
              >
                Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <MacroOverview userId={user.id} />
            </TabsContent>

            <TabsContent value="foodlog">
              <DailyFoodLog userId={user.id} />
            </TabsContent>

            <TabsContent value="builder">
              <DietBuilder userId={user.id} />
            </TabsContent>

            <TabsContent value="body">
              <BodyTracking userId={user.id} />
            </TabsContent>

            <TabsContent value="progression">
              <NutritionProgression userId={user.id} />
            </TabsContent>

            <TabsContent value="profile">
              <UserProfile userId={user.id} />
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