import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutGrid, PieChart as PieChartIcon, BarChart3 } from "lucide-react";

interface MacroChartProps {
  protein: number;
  carbs: number;
  fat: number;
  goalProtein?: number;
  goalCarbs?: number;
  goalFat?: number;
  goalCalories?: number;
}

type ChartType = 'pie' | 'donut' | 'cards' | 'bars';

export function EnhancedMacroChart({ 
  protein, 
  carbs, 
  fat, 
  goalProtein = 0, 
  goalCarbs = 0, 
  goalFat = 0,
  goalCalories = 0 
}: MacroChartProps) {
  const [chartType, setChartType] = useState<ChartType>('donut');

  // Calculate calories from macros
  const proteinCals = protein * 4;
  const carbsCals = carbs * 4;
  const fatCals = fat * 9;
  const totalCals = proteinCals + carbsCals + fatCals;
  const totalGrams = protein + carbs + fat;

  const data = [
    {
      name: "Protein",
      value: proteinCals, // Use calories for chart display
      calories: proteinCals,
      grams: protein,
      goal: goalProtein,
      color: "#ef4444",
      bgColor: "bg-red-500",
      lightColor: "bg-red-100 dark:bg-red-900/20"
    },
    {
      name: "Carbs", 
      value: carbsCals, // Use calories for chart display
      calories: carbsCals,
      grams: carbs,
      goal: goalCarbs,
      color: "#3b82f6",
      bgColor: "bg-blue-500",
      lightColor: "bg-blue-100 dark:bg-blue-900/20"
    },
    {
      name: "Fat",
      value: fatCals, // Use calories for chart display
      calories: fatCals,
      grams: fat,
      goal: goalFat,
      color: "#10b981",
      bgColor: "bg-emerald-500",
      lightColor: "bg-emerald-100 dark:bg-emerald-900/20"
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const calPercentage = totalCals > 0 ? Math.round((data.calories / totalCals) * 100) : 0;
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-black dark:text-white">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round(data.grams)}g contributes {Math.round(data.calories)} cal
          </p>
          <p className="text-xs text-gray-500">
            {calPercentage}% of total calories
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

  // Modern Donut Chart with Center Text
  const DonutChart = () => (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={1}
            cornerRadius={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center Text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-black dark:text-white">
            {Math.round(totalCals)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">calories</div>
          {goalCalories > 0 && (
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {Math.round((totalCals / goalCalories) * 100)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Card-based Layout
  const CardsLayout = () => (
    <div className="grid grid-cols-3 gap-3">
      {data.map((macro) => {
        const percentage = totalCals > 0 ? Math.round((macro.calories / totalCals) * 100) : 0;
        const goalPercentage = macro.goal > 0 ? Math.round((macro.grams / macro.goal) * 100) : 0;
        
        return (
          <Card key={macro.name} className={`${macro.lightColor} border-0 relative overflow-hidden`}>
            <CardContent className="p-4 text-center space-y-2">
              <div className={`w-4 h-4 mx-auto mb-2 ${macro.bgColor}`} />
              <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                {macro.name}
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {percentage}%
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {Math.round(macro.grams)}g
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {Math.round(macro.calories)} cal
              </div>
              {macro.goal > 0 && (
                <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {goalPercentage}% of goal
                </div>
              )}
            </CardContent>
            {/* Progress bar at bottom */}
            {macro.goal > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
                <div 
                  className={`h-full transition-all duration-300 ${macro.bgColor}`}
                  style={{ width: `${Math.min(goalPercentage, 100)}%` }}
                />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );

  // Horizontal Bars Layout
  const BarsLayout = () => (
    <div className="space-y-4">
      {data.map((macro) => {
        const percentage = totalCals > 0 ? Math.round((macro.calories / totalCals) * 100) : 0;
        const goalPercentage = macro.goal > 0 ? Math.round((macro.grams / macro.goal) * 100) : 0;
        // Use goal percentage for progress bar if goal exists, otherwise use macro percentage
        const progressBarWidth = macro.goal > 0 ? Math.min(goalPercentage, 100) : percentage;
        
        return (
          <div key={macro.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 ${macro.bgColor}`} />
                <span className="font-medium text-black dark:text-white text-sm">
                  {macro.name}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-bold text-black dark:text-white">
                  {Math.round(macro.grams)}g
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {percentage}%
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700">
                <div 
                  className={`h-full transition-all duration-500 ${macro.bgColor}`}
                  style={{ width: `${progressBarWidth}%` }}
                />
              </div>
              {macro.goal > 0 && goalPercentage > 100 && (
                <div className="absolute top-0 right-0 h-2 w-1 bg-orange-400 opacity-80" />
              )}
            </div>
            {macro.goal > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Goal: {Math.round(macro.goal)}g</span>
                <span>{goalPercentage}% achieved</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  if (totalCals === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>No data to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart Type Selector */}
      <div className="flex justify-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <Button
          variant={chartType === 'donut' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setChartType('donut')}
          className="h-8"
        >
          <PieChartIcon className="h-3 w-3" />
        </Button>
        <Button
          variant={chartType === 'cards' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setChartType('cards')}
          className="h-8"
        >
          <LayoutGrid className="h-3 w-3" />
        </Button>
        <Button
          variant={chartType === 'bars' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setChartType('bars')}
          className="h-8"
        >
          <BarChart3 className="h-3 w-3" />
        </Button>
      </div>

      {/* Chart Content */}
      <div className="min-h-[200px]">
        {chartType === 'donut' && <DonutChart />}
        {chartType === 'cards' && <CardsLayout />}
        {chartType === 'bars' && <BarsLayout />}
      </div>

      {/* Summary Footer */}
      <div className="text-center border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex justify-center gap-6 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total: </span>
            <span className="font-bold text-black dark:text-white">
              {Math.round(totalCals)} cal
            </span>
          </div>
          {goalCalories > 0 && (
            <div>
              <span className="text-gray-600 dark:text-gray-400">Goal: </span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {Math.round((totalCals / goalCalories) * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}