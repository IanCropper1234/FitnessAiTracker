import { 
  Target, 
  TrendingUp, 
  Activity, 
  Calendar, 
  Dumbbell, 
  Heart, 
  Zap, 
  Scale, 
  Timer, 
  Award,
  BarChart3,
  Users,
  Flame,
  Moon,
  Droplets,
  ThermometerSun,
  Apple,
  Utensils
} from "lucide-react";

export interface DashboardCardConfig {
  id: string;
  type: 'nutrition' | 'training' | 'health' | 'progress';
  title: string;
  description: string;
  icon: any;
  defaultSize: { w: number; h: number };
  color: string;
  component: any;
}

// Individual Card Components
export const CaloriesCard = ({ data }: any) => (
  <div className="h-full flex flex-col justify-between p-3">
    <div className="flex items-center justify-between mb-2">
      <Target className="h-4 w-4 text-blue-600" />
      <span className="text-xs text-gray-500">Today</span>
    </div>
    <div className="flex-1 flex flex-col justify-center">
      <div className="text-2xl font-bold text-center">
        {Math.round(data?.totalCalories || 0)}
      </div>
      <div className="text-xs text-gray-500 text-center">
        /{Math.round(data?.goalCalories || 2000)} cal
      </div>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
      <div 
        className="bg-blue-600 h-1 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, (data?.totalCalories / data?.goalCalories) * 100 || 0)}%` }}
      />
    </div>
  </div>
);

export const ProteinCard = ({ data }: any) => (
  <div className="h-full flex flex-col justify-between p-3">
    <div className="flex items-center justify-between mb-2">
      <TrendingUp className="h-4 w-4 text-green-600" />
      <span className="text-xs text-gray-500">Protein</span>
    </div>
    <div className="flex-1 flex flex-col justify-center">
      <div className="text-2xl font-bold text-center">
        {Math.round(data?.totalProtein || 0)}g
      </div>
      <div className="text-xs text-gray-500 text-center">
        /{Math.round(data?.goalProtein || 150)}g
      </div>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
      <div 
        className="bg-green-600 h-1 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, (data?.totalProtein / data?.goalProtein) * 100 || 0)}%` }}
      />
    </div>
  </div>
);

export const TrainingSessionsCard = ({ data }: any) => (
  <div className="h-full flex flex-col justify-between p-3">
    <div className="flex items-center justify-between mb-2">
      <Dumbbell className="h-4 w-4 text-orange-600" />
      <span className="text-xs text-gray-500">Sessions</span>
    </div>
    <div className="flex-1 flex flex-col justify-center">
      <div className="text-2xl font-bold text-center">
        {data?.totalSessions || 0}
      </div>
      <div className="text-xs text-gray-500 text-center">
        This week
      </div>
    </div>
  </div>
);

export const AdherenceCard = ({ data }: any) => (
  <div className="h-full flex flex-col justify-between p-3">
    <div className="flex items-center justify-between mb-2">
      <Award className="h-4 w-4 text-purple-600" />
      <span className="text-xs text-gray-500">Adherence</span>
    </div>
    <div className="flex-1 flex flex-col justify-center">
      <div className="text-2xl font-bold text-center">
        {Math.round(data?.adherence || 0)}%
      </div>
      <div className="text-xs text-gray-500 text-center">
        Overall
      </div>
    </div>
  </div>
);

export const WeightCard = ({ data }: any) => (
  <div className="h-full flex flex-col justify-between p-3">
    <div className="flex items-center justify-between mb-2">
      <Scale className="h-4 w-4 text-indigo-600" />
      <span className="text-xs text-gray-500">Weight</span>
    </div>
    <div className="flex-1 flex flex-col justify-center">
      <div className="text-2xl font-bold text-center">
        {data?.currentWeight || '--'}
      </div>
      <div className="text-xs text-gray-500 text-center">
        {data?.weightUnit || 'kg'}
      </div>
    </div>
  </div>
);

export const WorkoutVolumeCard = ({ data }: any) => (
  <div className="h-full flex flex-col justify-between p-3">
    <div className="flex items-center justify-between mb-2">
      <BarChart3 className="h-4 w-4 text-red-600" />
      <span className="text-xs text-gray-500">Volume</span>
    </div>
    <div className="flex-1 flex flex-col justify-center">
      <div className="text-2xl font-bold text-center">
        {Math.round(data?.totalVolume || 0)}
      </div>
      <div className="text-xs text-gray-500 text-center">
        kg total
      </div>
    </div>
  </div>
);

export const CarbsCard = ({ data }: any) => (
  <div className="h-full flex flex-col justify-between p-3">
    <div className="flex items-center justify-between mb-2">
      <Zap className="h-4 w-4 text-yellow-600" />
      <span className="text-xs text-gray-500">Carbs</span>
    </div>
    <div className="flex-1 flex flex-col justify-center">
      <div className="text-2xl font-bold text-center">
        {Math.round(data?.totalCarbs || 0)}g
      </div>
      <div className="text-xs text-gray-500 text-center">
        /{Math.round(data?.goalCarbs || 200)}g
      </div>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
      <div 
        className="bg-yellow-600 h-1 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, (data?.totalCarbs / data?.goalCarbs) * 100 || 0)}%` }}
      />
    </div>
  </div>
);

export const FatCard = ({ data }: any) => (
  <div className="h-full flex flex-col justify-between p-3">
    <div className="flex items-center justify-between mb-2">
      <Droplets className="h-4 w-4 text-pink-600" />
      <span className="text-xs text-gray-500">Fat</span>
    </div>
    <div className="flex-1 flex flex-col justify-center">
      <div className="text-2xl font-bold text-center">
        {Math.round(data?.totalFat || 0)}g
      </div>
      <div className="text-xs text-gray-500 text-center">
        /{Math.round(data?.goalFat || 70)}g
      </div>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
      <div 
        className="bg-pink-600 h-1 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, (data?.totalFat / data?.goalFat) * 100 || 0)}%` }}
      />
    </div>
  </div>
);

export const WorkoutDurationCard = ({ data }: any) => (
  <div className="h-full flex flex-col justify-between p-3">
    <div className="flex items-center justify-between mb-2">
      <Timer className="h-4 w-4 text-teal-600" />
      <span className="text-xs text-gray-500">Duration</span>
    </div>
    <div className="flex-1 flex flex-col justify-center">
      <div className="text-2xl font-bold text-center">
        {Math.round(data?.averageSessionLength || 0)}
      </div>
      <div className="text-xs text-gray-500 text-center">
        min avg
      </div>
    </div>
  </div>
);

export const StreakCard = ({ data }: any) => (
  <div className="h-full flex flex-col justify-between p-3">
    <div className="flex items-center justify-between mb-2">
      <Flame className="h-4 w-4 text-orange-500" />
      <span className="text-xs text-gray-500">Streak</span>
    </div>
    <div className="flex-1 flex flex-col justify-center">
      <div className="text-2xl font-bold text-center">
        {data?.streak || 0}
      </div>
      <div className="text-xs text-gray-500 text-center">
        days
      </div>
    </div>
  </div>
);

// Available Cards Configuration
export const AVAILABLE_CARDS: DashboardCardConfig[] = [
  {
    id: 'calories',
    type: 'nutrition',
    title: 'Calories',
    description: 'Daily calorie intake vs goals',
    icon: Target,
    defaultSize: { w: 2, h: 2 },
    color: 'blue',
    component: CaloriesCard
  },
  {
    id: 'protein',
    type: 'nutrition',
    title: 'Protein',
    description: 'Daily protein intake',
    icon: TrendingUp,
    defaultSize: { w: 2, h: 2 },
    color: 'green',
    component: ProteinCard
  },
  {
    id: 'carbs',
    type: 'nutrition',
    title: 'Carbs',
    description: 'Daily carbohydrate intake',
    icon: Zap,
    defaultSize: { w: 2, h: 2 },
    color: 'yellow',
    component: CarbsCard
  },
  {
    id: 'fat',
    type: 'nutrition',
    title: 'Fat',
    description: 'Daily fat intake',
    icon: Droplets,
    defaultSize: { w: 2, h: 2 },
    color: 'pink',
    component: FatCard
  },
  {
    id: 'training-sessions',
    type: 'training',
    title: 'Training Sessions',
    description: 'Weekly workout count',
    icon: Dumbbell,
    defaultSize: { w: 2, h: 2 },
    color: 'orange',
    component: TrainingSessionsCard
  },
  {
    id: 'adherence',
    type: 'progress',
    title: 'Adherence',
    description: 'Overall nutrition adherence',
    icon: Award,
    defaultSize: { w: 2, h: 2 },
    color: 'purple',
    component: AdherenceCard
  },
  {
    id: 'weight',
    type: 'health',
    title: 'Weight',
    description: 'Current body weight',
    icon: Scale,
    defaultSize: { w: 2, h: 2 },
    color: 'indigo',
    component: WeightCard
  },
  {
    id: 'workout-volume',
    type: 'training',
    title: 'Workout Volume',
    description: 'Total training volume',
    icon: BarChart3,
    defaultSize: { w: 2, h: 2 },
    color: 'red',
    component: WorkoutVolumeCard
  },
  {
    id: 'workout-duration',
    type: 'training',
    title: 'Workout Duration',
    description: 'Average session length',
    icon: Timer,
    defaultSize: { w: 2, h: 2 },
    color: 'teal',
    component: WorkoutDurationCard
  },
  {
    id: 'streak',
    type: 'progress',
    title: 'Streak',
    description: 'Current logging streak',
    icon: Flame,
    defaultSize: { w: 2, h: 2 },
    color: 'orange',
    component: StreakCard
  }
];

export const getCardById = (id: string): DashboardCardConfig | undefined => {
  return AVAILABLE_CARDS.find(card => card.id === id);
};

export const getCardsByType = (type: string): DashboardCardConfig[] => {
  return AVAILABLE_CARDS.filter(card => card.type === type);
};