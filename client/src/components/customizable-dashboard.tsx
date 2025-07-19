import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Settings, Plus, GripVertical, Eye, EyeOff, Target, TrendingUp, Activity, Calendar, Scale, Zap, Clock, BarChart3 } from "lucide-react";
import { useLanguage } from "./language-provider";
import { MacroChart } from "./macro-chart";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  visible: boolean;
  component: React.ComponentType<any>;
  size: 'small' | 'medium' | 'large';
  order: number;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface CustomizableDashboardProps {
  user: User;
}

// Individual card components
const CaloriesCard = ({ userId }: { userId: number }) => {
  const { t } = useLanguage();
  const { data: nutritionSummary } = useQuery({
    queryKey: ['/api/nutrition/summary', userId],
  });

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {t("calories")} Today
        </CardTitle>
        <Target className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-black dark:text-white">
          {nutritionSummary?.totalCalories || 0}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Goal: {nutritionSummary?.goalCalories || 2000}
        </p>
        <Progress 
          value={nutritionSummary ? (nutritionSummary.totalCalories / nutritionSummary.goalCalories) * 100 : 0} 
          className="mt-2"
        />
      </CardContent>
    </Card>
  );
};

const ProteinCard = ({ userId }: { userId: number }) => {
  const { t } = useLanguage();
  const { data: nutritionSummary } = useQuery({
    queryKey: ['/api/nutrition/summary', userId],
  });

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {t("protein")} (g)
        </CardTitle>
        <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-black dark:text-white">
          {nutritionSummary?.totalProtein || 0}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Goal: {nutritionSummary?.goalProtein || 150}g
        </p>
        <Progress 
          value={nutritionSummary ? (nutritionSummary.totalProtein / nutritionSummary.goalProtein) * 100 : 0} 
          className="mt-2"
        />
      </CardContent>
    </Card>
  );
};

const TrainingSessionsCard = ({ userId }: { userId: number }) => {
  const { t } = useLanguage();
  const { data: trainingStats } = useQuery({
    queryKey: ['/api/training/stats', userId],
  });

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {t("training")} Sessions
        </CardTitle>
        <Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-black dark:text-white">
          {trainingStats?.totalSessions || 0}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          This week
        </p>
      </CardContent>
    </Card>
  );
};

const WeightProgressCard = ({ userId }: { userId: number }) => {
  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics/comprehensive', userId, '30'],
  });

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Weight Progress
        </CardTitle>
        <Scale className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-black dark:text-white">
          {analytics?.overview?.weightChange || "+0kg"}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Last 30 days
        </p>
      </CardContent>
    </Card>
  );
};

const TrainingVolumeCard = ({ userId }: { userId: number }) => {
  const { data: trainingStats } = useQuery({
    queryKey: ['/api/training/stats', userId],
  });

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Total Volume
        </CardTitle>
        <BarChart3 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-black dark:text-white">
          {trainingStats?.totalVolume || 0}kg
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          This week
        </p>
      </CardContent>
    </Card>
  );
};

const RecoveryScoreCard = ({ userId }: { userId: number }) => {
  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics/comprehensive', userId, '7'],
  });

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Recovery Score
        </CardTitle>
        <Zap className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-black dark:text-white">
          {analytics?.feedback?.recoveryScore || "0.0"}/10
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Last 7 days
        </p>
      </CardContent>
    </Card>
  );
};

const MacroOverviewCard = ({ userId }: { userId: number }) => {
  const { t } = useLanguage();
  const { data: nutritionSummary } = useQuery({
    queryKey: ['/api/nutrition/summary', userId],
  });

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 col-span-2">
      <CardHeader>
        <CardTitle className="text-black dark:text-white">{t("nutrition")} Overview</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Today's macro breakdown
        </CardDescription>
      </CardHeader>
      <CardContent>
        {nutritionSummary ? (
          <MacroChart
            protein={nutritionSummary.totalProtein}
            carbs={nutritionSummary.totalCarbs}
            fat={nutritionSummary.totalFat}
            goalProtein={nutritionSummary.goalProtein}
            goalCarbs={nutritionSummary.goalCarbs}
            goalFat={nutritionSummary.goalFat}
          />
        ) : (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            No nutrition data yet. Start logging your meals!
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Sortable card wrapper
function SortableCard({ card, userId }: { card: DashboardCard; userId: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${
        card.size === 'large' ? 'col-span-2' : 'col-span-1'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-10 cursor-move p-1 rounded bg-gray-100 dark:bg-gray-800 opacity-50 hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      </div>
      {React.createElement(card.component, { userId })}
    </div>
  );
}

export function CustomizableDashboard({ user }: CustomizableDashboardProps) {
  const { t } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const [cards, setCards] = useState<DashboardCard[]>([
    {
      id: 'calories',
      title: 'Calories Today',
      description: 'Daily calorie intake tracking',
      icon: Target,
      visible: true,
      component: CaloriesCard,
      size: 'small',
      order: 0,
    },
    {
      id: 'protein',
      title: 'Protein Intake',
      description: 'Daily protein tracking',
      icon: TrendingUp,
      visible: true,
      component: ProteinCard,
      size: 'small',
      order: 1,
    },
    {
      id: 'training-sessions',
      title: 'Training Sessions',
      description: 'Weekly training activity',
      icon: Activity,
      visible: true,
      component: TrainingSessionsCard,
      size: 'small',
      order: 2,
    },
    {
      id: 'weight-progress',
      title: 'Weight Progress',
      description: 'Monthly weight tracking',
      icon: Scale,
      visible: true,
      component: WeightProgressCard,
      size: 'small',
      order: 3,
    },
    {
      id: 'training-volume',
      title: 'Training Volume',
      description: 'Weekly training volume',
      icon: BarChart3,
      visible: false,
      component: TrainingVolumeCard,
      size: 'small',
      order: 4,
    },
    {
      id: 'recovery-score',
      title: 'Recovery Score',
      description: 'Weekly recovery metrics',
      icon: Zap,
      visible: false,
      component: RecoveryScoreCard,
      size: 'small',
      order: 5,
    },
    {
      id: 'macro-overview',
      title: 'Macro Overview',
      description: 'Daily macronutrient breakdown',
      icon: BarChart3,
      visible: true,
      component: MacroOverviewCard,
      size: 'large',
      order: 6,
    },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load saved card configuration from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`dashboard-config-${user.id}`);
    if (saved) {
      try {
        const savedCards = JSON.parse(saved);
        setCards(savedCards);
      } catch (error) {
        console.warn('Failed to load dashboard configuration:', error);
      }
    }
  }, [user.id]);

  // Save card configuration to localStorage
  const saveConfiguration = (newCards: DashboardCard[]) => {
    try {
      localStorage.setItem(`dashboard-config-${user.id}`, JSON.stringify(newCards));
      setCards(newCards);
      console.log('Dashboard configuration saved successfully');
    } catch (error) {
      console.error('Failed to save dashboard configuration:', error);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id && over?.id) {
      const oldIndex = cards.findIndex(card => card.id === active.id);
      const newIndex = cards.findIndex(card => card.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newCards = arrayMove(cards, oldIndex, newIndex).map((card, index) => ({
          ...card,
          order: index,
        }));
        
        saveConfiguration(newCards);
      }
    }
  };

  const toggleCardVisibility = (cardId: string) => {
    const newCards = cards.map(card =>
      card.id === cardId ? { ...card, visible: !card.visible } : card
    );
    saveConfiguration(newCards);
  };

  const visibleCards = cards.filter(card => card.visible).sort((a, b) => a.order - b.order);

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="container mx-auto p-4 space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-[16px]">{t("welcome")}, {user.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {today}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="min-h-[44px] min-w-[44px]"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Dashboard Settings */}
        {showSettings && (
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">Dashboard Settings</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Customize which cards appear on your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((card) => (
                  <div key={card.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <card.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="font-medium">{card.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{card.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={card.visible}
                      onCheckedChange={() => toggleCardVisibility(card.id)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Draggable Dashboard Cards */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleCards.map(card => card.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-1">
              {visibleCards.map((card) => (
                <SortableCard key={card.id} card={card} userId={user.id} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Empty state when no cards visible */}
        {visibleCards.length === 0 && (
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardContent className="text-center py-12">
              <div className="text-gray-600 dark:text-gray-400">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No cards visible</h3>
                <p className="mb-4">Enable some dashboard cards to see your fitness data</p>
                <Button onClick={() => setShowSettings(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}