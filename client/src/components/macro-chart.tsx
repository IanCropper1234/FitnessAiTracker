import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

interface MacroChartProps {
  protein: number;
  carbs: number;
  fat: number;
  goalProtein: number;
  goalCarbs: number;
  goalFat: number;
}

export function MacroChart({ protein, carbs, fat, goalProtein, goalCarbs, goalFat }: MacroChartProps) {
  const data = [
    { name: "Protein", value: protein, goal: goalProtein, color: "#8b5cf6" },
    { name: "Carbs", value: carbs, goal: goalCarbs, color: "#06b6d4" },
    { name: "Fat", value: fat, goal: goalFat, color: "#f59e0b" },
  ];

  const total = protein + carbs + fat;

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}g`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="mt-4 space-y-2">
        {data.map((macro) => (
          <div key={macro.name} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: macro.color }}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {macro.name}
              </span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {macro.value}g / {macro.goal}g ({Math.round((macro.value / macro.goal) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}