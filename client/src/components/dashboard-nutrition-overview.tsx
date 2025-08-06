import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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
  const proteinCals = protein * 4;
  const carbsCals = carbs * 4;
  const fatCals = fat * 9;
  const totalCalories = proteinCals + carbsCals + fatCals;

  // Data for pie chart - showing calorie contributions
  const pieData = [
    {
      name: "Protein",
      value: proteinCals,
      grams: protein,
      goal: goalProtein,
      color: "#ef4444",
      percentage: totalCalories > 0 ? Math.round((proteinCals / totalCalories) * 100) : 0
    },
    {
      name: "Carbs", 
      value: carbsCals,
      grams: carbs,
      goal: goalCarbs,
      color: "#3b82f6",
      percentage: totalCalories > 0 ? Math.round((carbsCals / totalCalories) * 100) : 0
    },
    {
      name: "Fat",
      value: fatCals,
      grams: fat,
      goal: goalFat,
      color: "#10b981",
      percentage: totalCalories > 0 ? Math.round((fatCals / totalCalories) * 100) : 0
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-black dark:text-white">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round(data.grams)}g contributes {Math.round(data.value)} cal
          </p>
          <p className="text-xs text-gray-500">
            {data.percentage}% of total calories
          </p>
          {data.goal > 0 && (
            <p className="text-xs text-gray-500">
              Goal: {Math.round(data.goal)}g
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const nutritionData = [
    {
      name: "Calories",
      current: Math.round(totalCalories),
      target: Math.round(goalCalories),
      bgColor: "bg-blue-500",
      textColor: "text-blue-400",
      lightTextColor: "text-blue-300",
      unit: ""
    },
    {
      name: "Protein", 
      current: Math.round(protein),
      target: Math.round(goalProtein),
      bgColor: "bg-red-500", 
      textColor: "text-red-400",
      lightTextColor: "text-red-300",
      unit: "g"
    },
    {
      name: "Carbs",
      current: Math.round(carbs), 
      target: Math.round(goalCarbs),
      bgColor: "bg-blue-500",
      textColor: "text-blue-400", 
      lightTextColor: "text-blue-300",
      unit: "g"
    },
    {
      name: "Fat",
      current: Math.round(fat),
      target: Math.round(goalFat), 
      bgColor: "bg-emerald-500",
      textColor: "text-emerald-400",
      lightTextColor: "text-emerald-300", 
      unit: "g"
    }
  ];

  return (
    <Card className="bg-gray-900 dark:bg-gray-800 border-gray-700 border shadow-lg">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Circle Chart */}
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-40 mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={1}
                    cornerRadius={3}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-lg font-bold text-white">
                  {Math.round(totalCalories)}
                </div>
                <div className="text-xs text-gray-400">calories</div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-300">
                    {item.name}: {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bars */}
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
        </div>
      </CardContent>
    </Card>
  );
}