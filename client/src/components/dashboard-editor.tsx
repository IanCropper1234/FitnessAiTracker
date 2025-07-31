import React, { useState } from 'react';
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
      blue: 'bg-blue-100 border-blue-300 text-blue-800',
      green: 'bg-green-100 border-green-300 text-green-800',
      yellow: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      orange: 'bg-orange-100 border-orange-300 text-orange-800',
      purple: 'bg-purple-100 border-purple-300 text-purple-800',
      red: 'bg-red-100 border-red-300 text-red-800',
      pink: 'bg-pink-100 border-pink-300 text-pink-800',
      indigo: 'bg-indigo-100 border-indigo-300 text-indigo-800',
      teal: 'bg-teal-100 border-teal-300 text-teal-800'
    };
    return colorMap[color] || 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const CardPreview = ({ card }: { card: DashboardCardConfig }) => {
    const IconComponent = card.icon;
    return (
      <Card className={`relative group cursor-pointer transition-all duration-200 hover:shadow-md ${
        selectedCards.includes(card.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4" />
              <CardTitle className="text-sm">{card.title}</CardTitle>
            </div>
            <Badge variant="outline" className={getColorClass(card.color)}>
              {card.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-gray-600 mb-3">{card.description}</p>
          <div className="flex justify-between items-center">
            {selectedCards.includes(card.id) ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveCard(card.id);
                }}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Remove
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddCard(card.id);
                }}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            )}
            <span className="text-xs text-gray-500">
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
        className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <Settings className="h-4 w-4 mr-2" />
        Edit Dashboard
      </Button>
    );
  }

  return (
    <>
      {/* Edit Mode Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Grid3x3 className="h-5 w-5" />
            <h2 className="font-semibold">Dashboard Editor</h2>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {selectedCards.length} cards
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Cards
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
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>

            <Button
              onClick={onSaveLayout}
              variant="secondary"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>

            <Button
              onClick={onToggleEditMode}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4 mr-2" />
              Done
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Mode Instructions */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
        Drag cards to reorder • Click "Add Cards" to customize • Changes save automatically
      </div>
    </>
  );
}