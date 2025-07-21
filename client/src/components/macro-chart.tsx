import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface MacroChartProps {
  protein: number;
  carbs: number;
  fat: number;
  goalProtein?: number;
  goalCarbs?: number;
  goalFat?: number;
}

export function MacroChart({ 
  protein, 
  carbs, 
  fat, 
  goalProtein = 0, 
  goalCarbs = 0, 
  goalFat = 0 
}: MacroChartProps) {
  // Calculate calories from macros (4 cal/g protein, 4 cal/g carbs, 9 cal/g fat)
  const proteinCals = protein * 4;
  const carbsCals = carbs * 4;
  const fatCals = fat * 9;
  const totalCals = proteinCals + carbsCals + fatCals;

  const data = [
    {
      name: "Protein",
      value: proteinCals,
      grams: protein,
      goal: goalProtein,
      color: "#ef4444"
    },
    {
      name: "Carbs", 
      value: carbsCals,
      grams: carbs,
      goal: goalCarbs,
      color: "#3b82f6"
    },
    {
      name: "Fat",
      value: fatCals, 
      grams: fat,
      goal: goalFat,
      color: "#f59e0b"
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalCals > 0 ? Math.round((data.value / totalCals) * 100) : 0;
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-black dark:text-white">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round(data.grams)}g • {Math.round(data.value)} cal ({percentage}%)
          </p>
          {data.goal > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Goal: {Math.round(data.goal)}g
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for very small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${Math.round(percent * 100)}%`}
      </text>
    );
  };

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
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Macro Summary */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {data.map((macro) => (
          <div key={macro.name} className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: macro.color }}
              />
              <span className="text-sm font-medium text-black dark:text-white">
                {macro.name}
              </span>
            </div>
            <div className="text-lg font-bold text-black dark:text-white">
              {Math.round(macro.grams)}g
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {Math.round(macro.value)} cal
            </div>
            {macro.goal > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-500">
                Goal: {Math.round(macro.goal)}g
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total Calories */}
      <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-700">
        <span className="text-sm text-gray-600 dark:text-gray-400">Total: </span>
        <span className="text-lg font-bold text-black dark:text-white">
          {Math.round(totalCals)} calories
        </span>
      </div>
    </div>
  );
}