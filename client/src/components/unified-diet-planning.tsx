import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Calculator, Clock, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

// Import existing components
import { DietBuilder } from "@/components/diet-builder";
import { MealPlanner } from "@/components/meal-planner";

interface UnifiedDietPlanningProps {
  userId: number;
}

export function UnifiedDietPlanning({ userId }: UnifiedDietPlanningProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("goals");

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Diet Planning
          </CardTitle>
          <CardDescription>
            Complete RP-based diet planning system: set goals, plan meals, and optimize nutrition timing
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Unified Diet Planning Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Goals & Macros
          </TabsTrigger>
          <TabsTrigger value="meal-planning" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Meal Planning
          </TabsTrigger>
        </TabsList>

        {/* Goals & Macros Tab - Contains Diet Builder functionality */}
        <TabsContent value="goals" className="space-y-6">
          <DietBuilder userId={userId} />
        </TabsContent>

        {/* Meal Planning Tab - Contains Meal Planner functionality */}
        <TabsContent value="meal-planning" className="space-y-6">
          <MealPlanner userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}