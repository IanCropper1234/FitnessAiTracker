import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  X, 
  Settings, 
  Grid3x3, 
  Palette,
  Save,
  RotateCcw
} from 'lucide-react';
import { AVAILABLE_CARDS, getCardsByType, type DashboardCardConfig } from './dashboard-card-library';

interface DashboardEditorProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  selectedCards: string[];
  onAddCard: (cardId: string) => void;
  onRemoveCard: (cardId: string) => void;
  onSaveLayout: () => void;
  onResetLayout: () => void;
}

export function DashboardEditor({
  isEditMode,
  onToggleEditMode,
  selectedCards,
  onAddCard,
  onRemoveCard,
  onSaveLayout,
  onResetLayout
}: DashboardEditorProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
      green: 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
      yellow: 'bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300',
      orange: 'bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
      purple: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
      red: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
      pink: 'bg-pink-50 dark:bg-pink-950/50 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300',
      indigo: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
      teal: 'bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300'
    };
    return colorMap[color] || 'bg-gray-50 dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300';
  };

  const CardPreview = ({ card }: { card: DashboardCardConfig }) => {
    const IconComponent = card.icon;
    return (
      <Card className={`relative group cursor-pointer transition-all duration-200 hover:shadow-sm ${
        selectedCards.includes(card.id) ? 'ring-1 ring-gray-400 dark:ring-gray-500 bg-gray-50 dark:bg-gray-800/50' : ''
      } border-gray-200 dark:border-gray-700`}>
        <CardHeader className="pb-1.5 pt-3 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <IconComponent className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
              <CardTitle className="text-xs font-medium">{card.title}</CardTitle>
            </div>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${getColorClass(card.color)}`}>
              {card.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-3 pb-3">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{card.description}</p>
          <div className="flex justify-between items-center">
            {selectedCards.includes(card.id) ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveCard(card.id);
                }}
                className="text-[10px] h-6 px-2"
              >
                <X className="h-2.5 w-2.5 mr-1" />
                Remove
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddCard(card.id);
                }}
                className="text-[10px] h-6 px-2"
              >
                <Plus className="h-2.5 w-2.5 mr-1" />
                Add
              </Button>
            )}
            <span className="text-[10px] text-gray-400">
              {card.defaultSize.w}×{card.defaultSize.h}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!isEditMode) {
    return (
      <Button
        onClick={onToggleEditMode}
        variant="outline"
        size="sm"
        className="fixed top-2 right-2 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200 text-[10px] h-7 px-2"
      >
        <Settings className="h-2.5 w-2.5 mr-1" />
        Edit
      </Button>
    );
  }

  return (
    <>
      {/* Edit Mode Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 dark:bg-gray-950 text-white p-2 shadow-lg border-b border-gray-700 dark:border-gray-800">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-1 min-w-0 flex-shrink">
            <Grid3x3 className="h-3 w-3 flex-shrink-0" />
            <h2 className="font-medium text-xs truncate">Dashboard Editor</h2>
            <Badge variant="secondary" className="bg-gray-700 text-gray-200 text-[10px] px-1 py-0.5 flex-shrink-0">
              {selectedCards.length}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1 min-w-0">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="text-[10px] h-6 px-1.5 flex-shrink-0">
                  <Plus className="h-2.5 w-2.5 mr-0.5" />
                  <span className="hidden sm:inline">Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Add Dashboard Cards
                  </DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                    <TabsTrigger value="training">Training</TabsTrigger>
                    <TabsTrigger value="health">Health</TabsTrigger>
                    <TabsTrigger value="progress">Progress</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {AVAILABLE_CARDS.map(card => (
                        <CardPreview key={card.id} card={card} />
                      ))}
                    </div>
                  </TabsContent>
                  
                  {['nutrition', 'training', 'health', 'progress'].map(type => (
                    <TabsContent key={type} value={type} className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getCardsByType(type).map(card => (
                          <CardPreview key={card.id} card={card} />
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </DialogContent>
            </Dialog>

            <Button
              onClick={onResetLayout}
              variant="outline"
              size="sm"
              className="bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700 text-[10px] h-6 px-1.5 flex-shrink-0"
            >
              <RotateCcw className="h-2.5 w-2.5 sm:mr-0.5" />
              <span className="hidden sm:inline">Reset</span>
            </Button>

            <Button
              onClick={onSaveLayout}
              variant="secondary"
              size="sm"
              className="text-[10px] h-6 px-1.5 flex-shrink-0"
            >
              <Save className="h-2.5 w-2.5 sm:mr-0.5" />
              <span className="hidden sm:inline">Save</span>
            </Button>

            <Button
              onClick={onToggleEditMode}
              variant="outline"
              size="sm"
              className="bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700 text-[10px] h-6 px-1.5 flex-shrink-0"
            >
              <X className="h-2.5 w-2.5 sm:mr-0.5" />
              <span className="hidden sm:inline">Done</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Mode Instructions */}
      <div className="fixed bottom-3 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900/90 text-white px-2 py-1 rounded text-[10px] backdrop-blur-sm border border-gray-700 max-w-[90vw] text-center">
        Drag to reorder
      </div>
    </>
  );
}