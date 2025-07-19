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
import { Plus, Search, Trash2, Calendar, Target, Zap, Trophy, TrendingUp, Activity, Flame, Apple, Heart, Scale, Clipboard, ChevronDown, Check } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  const [activeTab, setActiveTab] = useState("overview");

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



        {/* Athletic Nutrition Hub - iOS Style Expandable */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* iOS-style Dropdown Tab Selector */}
            <div className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-14 px-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 border-2 border-blue-100 dark:border-gray-700 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300 min-w-[200px]"
                  >
                    <div className="flex items-center gap-3">
                      {activeTab === "overview" && <Target className="h-5 w-5 text-blue-500" />}
                      {activeTab === "foodlog" && <Clipboard className="h-5 w-5 text-green-500" />}
                      {activeTab === "builder" && <Apple className="h-5 w-5 text-orange-500" />}
                      {activeTab === "advanced" && <Flame className="h-5 w-5 text-red-500" />}
                      {activeTab === "body" && <Scale className="h-5 w-5 text-purple-500" />}
                      {activeTab === "progression" && <TrendingUp className="h-5 w-5 text-teal-500" />}
                      {activeTab === "shopping" && <Heart className="h-5 w-5 text-pink-500" />}
                      <span className="font-semibold">
                        {activeTab === "overview" && "Performance Hub"}
                        {activeTab === "foodlog" && "Fuel Tracking"}
                        {activeTab === "builder" && "Nutrition Plan"}
                        {activeTab === "advanced" && "Elite Coach"}
                        {activeTab === "body" && "Body Metrics"}
                        {activeTab === "progression" && "Progress Analytics"}
                        {activeTab === "shopping" && "Meal Planning"}
                      </span>
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-2 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl">
                  <DropdownMenuItem 
                    onClick={() => setActiveTab("overview")}
                    className="flex items-center gap-3 p-4 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all"
                  >
                    <Target className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <div className="font-semibold">Performance Hub</div>
                      <div className="text-xs text-gray-500">Daily macro overview</div>
                    </div>
                    {activeTab === "overview" && <Check className="h-4 w-4 text-blue-500" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setActiveTab("foodlog")}
                    className="flex items-center gap-3 p-4 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer transition-all"
                  >
                    <Clipboard className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <div className="font-semibold">Fuel Tracking</div>
                      <div className="text-xs text-gray-500">Log your meals</div>
                    </div>
                    {activeTab === "foodlog" && <Check className="h-4 w-4 text-green-500" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setActiveTab("builder")}
                    className="flex items-center gap-3 p-4 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer transition-all"
                  >
                    <Apple className="h-5 w-5 text-orange-500" />
                    <div className="flex-1">
                      <div className="font-semibold">Nutrition Plan</div>
                      <div className="text-xs text-gray-500">Build your diet strategy</div>
                    </div>
                    {activeTab === "builder" && <Check className="h-4 w-4 text-orange-500" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setActiveTab("advanced")}
                    className="flex items-center gap-3 p-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-all"
                  >
                    <Flame className="h-5 w-5 text-red-500" />
                    <div className="flex-1">
                      <div className="font-semibold">Elite Coach</div>
                      <div className="text-xs text-gray-500">RP methodology</div>
                    </div>
                    {activeTab === "advanced" && <Check className="h-4 w-4 text-red-500" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setActiveTab("body")}
                    className="flex items-center gap-3 p-4 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-all"
                  >
                    <Scale className="h-5 w-5 text-purple-500" />
                    <div className="flex-1">
                      <div className="font-semibold">Body Metrics</div>
                      <div className="text-xs text-gray-500">Track your physique</div>
                    </div>
                    {activeTab === "body" && <Check className="h-4 w-4 text-purple-500" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setActiveTab("progression")}
                    className="flex items-center gap-3 p-4 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-900/20 cursor-pointer transition-all"
                  >
                    <TrendingUp className="h-5 w-5 text-teal-500" />
                    <div className="flex-1">
                      <div className="font-semibold">Progress Analytics</div>
                      <div className="text-xs text-gray-500">View trends & charts</div>
                    </div>
                    {activeTab === "progression" && <Check className="h-4 w-4 text-teal-500" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setActiveTab("shopping")}
                    className="flex items-center gap-3 p-4 rounded-xl hover:bg-pink-50 dark:hover:bg-pink-900/20 cursor-pointer transition-all"
                  >
                    <Heart className="h-5 w-5 text-pink-500" />
                    <div className="flex-1">
                      <div className="font-semibold">Meal Planning</div>
                      <div className="text-xs text-gray-500">Shopping lists & recipes</div>
                    </div>
                    {activeTab === "shopping" && <Check className="h-4 w-4 text-pink-500" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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