import { Card, CardContent } from "@/components/ui/card";

interface DashboardNutritionOverviewProps {
  protein: number;
  carbs: number;
  fat: number;
  goalProtein: number;
  goalCarbs: number;
  goalFat: number;
  goalCalories: number;
}

export function DashboardNutritionOverview({ 
  protein, 
  carbs, 
  fat, 
  goalProtein, 
  goalCarbs, 
  goalFat, 
  goalCalories 
}: DashboardNutritionOverviewProps) {
  
  // Calculate calories from macros
  const totalCalories = (protein * 4) + (carbs * 4) + (fat * 9);
  
  const nutritionData = [
    {
      name: "Calories",
      current: Math.round(totalCalories),
      target: Math.round(goalCalories),
      color: "blue",
      bgColor: "bg-blue-500",
      textColor: "text-blue-400",
      lightTextColor: "text-blue-300",
      unit: ""
    },
    {
      name: "Protein", 
      current: Math.round(protein),
      target: Math.round(goalProtein),
      color: "red",
      bgColor: "bg-red-500", 
      textColor: "text-red-400",
      lightTextColor: "text-red-300",
      unit: "g"
    },
    {
      name: "Carbs",
      current: Math.round(carbs), 
      target: Math.round(goalCarbs),
      color: "orange",
      bgColor: "bg-blue-500",
      textColor: "text-blue-400", 
      lightTextColor: "text-blue-300",
      unit: "g"
    },
    {
      name: "Fat",
      current: Math.round(fat),
      target: Math.round(goalFat), 
      color: "green",
      bgColor: "bg-emerald-500",
      textColor: "text-emerald-400",
      lightTextColor: "text-emerald-300", 
      unit: "g"
    }
  ];

  return (
    <Card className="bg-gray-900 dark:bg-gray-800 border-gray-700 border shadow-lg">
      <CardContent className="p-3">
        <div className="space-y-3">
          {nutritionData.map((macro) => {
            const percentage = macro.target > 0 ? Math.min(100, (macro.current / macro.target) * 100) : 0;
            
            return (
              <div key={macro.name} className="flex items-center gap-3">
                <div className={`w-16 text-xs font-medium ${macro.textColor}`}>
                  {macro.name}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="text-sm font-bold text-white min-w-[3rem]">
                    {macro.current}{macro.unit}
                  </div>
                  <div className="text-xs text-gray-400">/</div>
                  <div className="text-xs text-gray-300 min-w-[2.5rem]">
                    {macro.target}{macro.unit}
                  </div>
                  <div className="flex-1 relative">
                    <div className="dashboard-nutrition-progress h-2">
                      <div 
                        className={`dashboard-nutrition-fill h-2 ${macro.bgColor}`}
                        style={{ 
                          width: `${percentage}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className={`text-xs font-medium ${macro.lightTextColor} min-w-[2.5rem] text-right`}>
                    {Math.round(percentage)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}