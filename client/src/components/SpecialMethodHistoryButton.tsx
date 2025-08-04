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

  // Only show if there's historical data available
  if (!latestSpecialMethod) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded px-2 py-1 mt-1">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <History className="h-3 w-3 text-blue-400 flex-shrink-0" />
        <span className="text-xs text-blue-300 truncate">
          Set {setNumber} Last: {typeof latestSpecialMethod.weight === 'string' ? parseFloat(latestSpecialMethod.weight) : latestSpecialMethod.weight}kg • {latestSpecialMethod.reps}r • RPE {latestSpecialMethod.rpe} ({formatDate(latestSpecialMethod.date)})
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleApplyHistoricalData}
        disabled={isLoading || isApplying}
        className="ios-touch-feedback h-6 px-2 py-0 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 hover:text-blue-100 border border-blue-500/30 ml-2 flex-shrink-0"
      >
        {isLoading || isApplying ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          "Use"
        )}
      </Button>
    </div>
  );
};