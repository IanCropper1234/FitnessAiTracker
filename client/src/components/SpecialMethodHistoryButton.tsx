import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { History, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface SpecialMethodHistoryData {
  specialMethod: string;
  specialConfig: any;
  date: string;
  weight: number;
  reps: string;
  rpe: number;
}

interface SpecialMethodHistoryButtonProps {
  exerciseId: number;
  userId: number;
  setNumber: number;
  currentSpecialMethod: string;
  onApplyHistoricalData: (data: SpecialMethodHistoryData) => void;
}

export const SpecialMethodHistoryButton: React.FC<SpecialMethodHistoryButtonProps> = ({
  exerciseId,
  userId,
  setNumber,
  currentSpecialMethod,
  onApplyHistoricalData
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();

  // Fetch latest special training method data for this exercise, set, and method
  const { data: latestSpecialMethod, isLoading } = useQuery<SpecialMethodHistoryData | null>({
    queryKey: ['/api/training/exercise-special-history', exerciseId, userId, setNumber, currentSpecialMethod],
    queryFn: async () => {
      if (!exerciseId || !userId || !currentSpecialMethod || currentSpecialMethod === 'standard') return null;
      
      const params = new URLSearchParams({
        userId: userId.toString(),
        limit: '1',
        setNumber: setNumber.toString(),
        specialMethod: currentSpecialMethod
      });
      
      const response = await fetch(`/api/training/exercise-special-history/${exerciseId}?${params}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.length > 0 ? data[0] : null;
    },
    enabled: !!exerciseId && !!userId && !!currentSpecialMethod && currentSpecialMethod !== 'standard'
  });

  // Debug logging
  console.log('SpecialMethodHistoryButton render:', {
    exerciseId,
    setNumber,
    currentSpecialMethod,
    hasLatestData: !!latestSpecialMethod,
    isLoading,
    queryEnabled: !!exerciseId && !!userId && !!currentSpecialMethod && currentSpecialMethod !== 'standard'
  });

  const handleApplyHistoricalData = async () => {
    if (!latestSpecialMethod) {
      toast({
        title: "No Historical Data",
        description: "No previous special training method data found for this exercise.",
        variant: "destructive",
      });
      return;
    }

    setIsApplying(true);
    
    try {
      onApplyHistoricalData(latestSpecialMethod);
      
      toast({
        title: "Applied Historical Data",
        description: `Applied ${latestSpecialMethod.specialMethod} configuration for Set ${setNumber} from ${new Date(latestSpecialMethod.date).toLocaleDateString()}`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply historical data",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  // Only show button if there's historical data available
  if (!latestSpecialMethod) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleApplyHistoricalData}
      disabled={isLoading || isApplying}
      className="ios-touch-feedback h-6 w-6 p-0 hover:bg-muted/50"
      title={`Apply ${latestSpecialMethod.specialMethod} config for Set ${setNumber} from ${new Date(latestSpecialMethod.date).toLocaleDateString()}`}
    >
      {isLoading || isApplying ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <History className="h-3 w-3 text-muted-foreground hover:text-foreground" />
      )}
    </Button>
  );
};