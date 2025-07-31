import React, { useState, useEffect, useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, GripVertical } from 'lucide-react';
import { getCardById } from './dashboard-card-library';
import { DashboardEditor } from './dashboard-editor';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardCardItem {
  id: string;
  layout: Layout;
}

interface DraggableDashboardProps {
  nutritionData?: any;
  trainingData?: any;
  className?: string;
}

const DEFAULT_CARDS = ['calories', 'protein', 'training-sessions', 'adherence'];

export function DraggableDashboard({ 
  nutritionData, 
  trainingData,
  className = ""
}: DraggableDashboardProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>(DEFAULT_CARDS);
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({});

  // Generate layout from selected cards
  const generateLayout = (cardIds: string[]): Layout[] => {
    return cardIds.map((cardId, index) => {
      const card = getCardById(cardId);
      return {
        i: cardId,
        x: (index % 4) * 2, // 4 columns max, 2 units per card
        y: Math.floor(index / 4) * 2,
        w: card?.defaultSize.w || 2,
        h: card?.defaultSize.h || 2,
        minW: 2,
        minH: 2,
        maxW: 4,
        maxH: 4
      };
    });
  };

  // Initialize layouts
  useEffect(() => {
    const initialLayout = generateLayout(selectedCards);
    setLayouts({
      lg: initialLayout,
      md: initialLayout,
      sm: initialLayout.map(item => ({ ...item, w: Math.min(item.w, 3) })),
      xs: initialLayout.map(item => ({ ...item, w: 4, x: 0 }))
    });
  }, [selectedCards]);

  const handleLayoutChange = (layout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    setLayouts(allLayouts);
  };

  const handleAddCard = (cardId: string) => {
    if (!selectedCards.includes(cardId)) {
      setSelectedCards(prev => [...prev, cardId]);
    }
  };

  const handleRemoveCard = (cardId: string) => {
    setSelectedCards(prev => prev.filter(id => id !== cardId));
  };

  const handleSaveLayout = () => {
    // Save to localStorage or API
    localStorage.setItem('dashboard-layout', JSON.stringify(layouts));
    localStorage.setItem('dashboard-cards', JSON.stringify(selectedCards));
    setIsEditMode(false);
  };

  const handleResetLayout = () => {
    setSelectedCards(DEFAULT_CARDS);
    const resetLayout = generateLayout(DEFAULT_CARDS);
    setLayouts({
      lg: resetLayout,
      md: resetLayout,
      sm: resetLayout.map(item => ({ ...item, w: Math.min(item.w, 3) })),
      xs: resetLayout.map(item => ({ ...item, w: 4, x: 0 }))
    });
  };

  // Load saved layout on mount
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboard-layout');
    const savedCards = localStorage.getItem('dashboard-cards');
    
    if (savedLayout && savedCards) {
      try {
        setLayouts(JSON.parse(savedLayout));
        setSelectedCards(JSON.parse(savedCards));
      } catch (error) {
        console.error('Error loading saved dashboard layout:', error);
      }
    }
  }, []);

  const renderCard = (cardId: string) => {
    const card = getCardById(cardId);
    if (!card) return null;

    const CardComponent = card.component;
    const data = card.type === 'nutrition' ? nutritionData : trainingData;

    return (
      <Card 
        key={cardId}
        className={`relative overflow-hidden transition-all duration-200 ${
          isEditMode ? 'ring-2 ring-blue-300 ring-opacity-50' : ''
        } bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800`}
      >
        {isEditMode && (
          <>
            <div className="absolute top-2 left-2 z-10">
              <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2 z-10 h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveCard(cardId);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        )}
        <CardComponent data={data} />
      </Card>
    );
  };

  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480 };
  const cols = { lg: 8, md: 6, sm: 4, xs: 4 };

  return (
    <div className={`relative ${className}`}>
      <DashboardEditor
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        selectedCards={selectedCards}
        onAddCard={handleAddCard}
        onRemoveCard={handleRemoveCard}
        onSaveLayout={handleSaveLayout}
        onResetLayout={handleResetLayout}
      />

      <div className={`${isEditMode ? 'pt-20 pb-16' : ''} transition-all duration-300`}>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          breakpoints={breakpoints}
          cols={cols}
          rowHeight={60}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          margin={[8, 8]}
          containerPadding={[0, 0]}
          compactType="vertical"
          preventCollision={false}
          useCSSTransforms={true}
          transformScale={1}
          autoSize={true}
        >
          {selectedCards.map(cardId => renderCard(cardId))}
        </ResponsiveGridLayout>
      </div>

      {isEditMode && (
        <div className="fixed inset-0 bg-black/20 pointer-events-none z-30" />
      )}
    </div>
  );
}