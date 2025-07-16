import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/components/language-provider";
import { BottomNavigation } from "@/components/bottom-navigation";
import { MacroChart } from "@/components/macro-chart";
import { NutritionLogger } from "@/components/nutrition-logger";
import { Plus, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function Nutrition() {
  const { t } = useLanguage();
  const [showLogger, setShowLogger] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem("fitai-user") || "{}");
  const userId = user.id;

  const { data: nutritionSummary } = useQuery({
    queryKey: ["/api/nutrition/summary", userId, format(selectedDate, "yyyy-MM-dd")],
    enabled: !!userId,
  });

  const { data: nutritionLogs } = useQuery({
    queryKey: ["/api/nutrition/logs", userId, format(selectedDate, "yyyy-MM-dd")],
    enabled: !!userId,
  });

  if (!userId) return null;

  const groupedLogs = nutritionLogs?.reduce((acc: any, log: any) => {
    const mealType = log.mealType || "other";
    if (!acc[mealType]) acc[mealType] = [];
    acc[mealType].push(log);
    return acc;
  }, {}) || {};

  const mealTypes = [
    { key: "breakfast", label: t("nutrition.breakfast") },
    { key: "lunch", label: t("nutrition.lunch") },
    { key: "dinner", label: t("nutrition.dinner") },
    { key: "snack", label: t("nutrition.snack") },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 safe-area-top">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">{t("nutrition.title")}</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogger(!showLogger)}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Log Food Section */}
        {showLogger && (
          <NutritionLogger
            userId={userId}
            onComplete={() => setShowLogger(false)}
          />
        )}

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">{t("nutrition.summary")}</TabsTrigger>
            <TabsTrigger value="logs">Food Log</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            {/* Macro Summary */}
            {nutritionSummary && (
              <Card className="card-surface">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {t("nutrition.macro_goals")}
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <MacroChart
                    protein={nutritionSummary.totalProtein}
                    carbs={nutritionSummary.totalCarbs}
                    fat={nutritionSummary.totalFat}
                    goalProtein={nutritionSummary.goalProtein}
                    goalCarbs={nutritionSummary.goalCarbs}
                    goalFat={nutritionSummary.goalFat}
                  />

                  {/* Detailed Breakdown */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">{t("nutrition.calories")}</span>
                      <div className="text-right">
                        <div className="font-bold">
                          {nutritionSummary.totalCalories} / {nutritionSummary.goalCalories}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {nutritionSummary.goalCalories - nutritionSummary.totalCalories} {t("nutrition.remaining")}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium macro-protein">{t("nutrition.protein")}</span>
                      <div className="text-right">
                        <div className="font-bold">
                          {Math.round(nutritionSummary.totalProtein)}g / {Math.round(nutritionSummary.goalProtein)}g
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round(nutritionSummary.goalProtein - nutritionSummary.totalProtein)}g {t("nutrition.remaining")}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium macro-carbs">{t("nutrition.carbs")}</span>
                      <div className="text-right">
                        <div className="font-bold">
                          {Math.round(nutritionSummary.totalCarbs)}g / {Math.round(nutritionSummary.goalCarbs)}g
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round(nutritionSummary.goalCarbs - nutritionSummary.totalCarbs)}g {t("nutrition.remaining")}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium macro-fat">{t("nutrition.fat")}</span>
                      <div className="text-right">
                        <div className="font-bold">
                          {Math.round(nutritionSummary.totalFat)}g / {Math.round(nutritionSummary.goalFat)}g
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round(nutritionSummary.goalFat - nutritionSummary.totalFat)}g {t("nutrition.remaining")}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            {/* Daily Logs by Meal */}
            {mealTypes.map((mealType) => {
              const logs = groupedLogs[mealType.key] || [];
              const mealCalories = logs.reduce((sum: number, log: any) => sum + Number(log.calories), 0);

              return (
                <Card key={mealType.key} className="card-surface">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{mealType.label}</CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(mealCalories)} kcal
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {logs.length > 0 ? (
                      <div className="space-y-3">
                        {logs.map((log: any) => (
                          <div key={log.id} className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{log.foodName}</div>
                              <div className="text-sm text-muted-foreground">
                                {log.quantity}{log.unit}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{Math.round(Number(log.calories))} kcal</div>
                              <div className="text-xs text-muted-foreground">
                                P: {Math.round(Number(log.protein))}g • 
                                C: {Math.round(Number(log.carbs))}g • 
                                F: {Math.round(Number(log.fat))}g
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No foods logged for {mealType.label.toLowerCase()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}
