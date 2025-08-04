import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface NutrientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodName: string;
  micronutrients: any;
}

const NutrientDetailsModal: React.FC<NutrientDetailsModalProps> = ({
  isOpen,
  onClose,
  foodName,
  micronutrients
}) => {
  if (!micronutrients) return null;

  const renderNutrientSection = (title: string, nutrients: any, unit?: string) => {
    if (!nutrients || Object.keys(nutrients).length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
        <div className="grid grid-cols-1 gap-1.5">
          {Object.entries(nutrients).map(([key, value]: [string, any]) => (
            <div
              key={key}
              className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
            >
              <span className="text-xs text-gray-700 dark:text-gray-300 capitalize">
                {key.replace(/_/g, ' ')}
              </span>
              <Badge variant="outline" className="text-xs">
                {typeof value === 'number' ? value.toFixed(1) : value}{unit || ''}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">
            Nutritional Details - {foodName}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {micronutrients.vitamins && (
              <>
                {renderNutrientSection("Vitamins", micronutrients.vitamins)}
                <Separator />
              </>
            )}
            
            {micronutrients.minerals && (
              <>
                {renderNutrientSection("Minerals", micronutrients.minerals, "mg")}
                <Separator />
              </>
            )}
            
            {micronutrients.other && (
              renderNutrientSection("Other Nutrients", micronutrients.other)
            )}
            
            {!micronutrients.vitamins && !micronutrients.minerals && !micronutrients.other && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <p className="text-xs">No detailed micronutrient data available</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default NutrientDetailsModal;