import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { History, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);
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

  const getSpecialMethodDisplay = (data: SpecialMethodHistoryData) => {
    const config = data.specialConfig as any;
    
    switch (data.specialMethod) {
      case 'myorep_match':
        return `MyoRep Match: ${config?.targetReps || 15}r • ${config?.miniSets || 3} mini-sets • ${config?.restSeconds || 20}s`;
      case 'myorep_no_match':
        return `MyoRep No Match: ${config?.targetReps || 12}r • ${config?.miniSets || 3} mini-sets • ${config?.restSeconds || 15}s`;
      case 'drop_set':
        const dropSets = config?.dropSets || 3;
        return `Drop Set: ${dropSets} drops • ${config?.dropRestSeconds || 10}s rest`;
      case 'giant_set':
        return `Giant Set: ${config?.totalTargetReps || 40} total reps • ${config?.miniSetReps || 5}r mini-sets`;
      case 'superset':
        return `Superset: ${config?.targetReps || 12}r • ${config?.restSeconds || 60}s`;
      default:
        return `${data.specialMethod}: ${data.weight}kg • ${data.reps}r • RPE ${data.rpe}`;
    }
  };

  return (
    <div className="bg-blue-500/10 border border-blue-500/20 overflow-hidden mt-1">
      {/* Collapsed Header - Always Visible */}
      <div 
        className="flex items-center justify-between gap-2 p-1.5 cursor-pointer hover:bg-blue-500/20 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <History className="h-3 w-3 text-blue-400 flex-shrink-0" />
          <div className="text-xs text-blue-300 truncate">
            Last: {latestSpecialMethod.specialMethod.replace('_', ' ')} ({formatDate(latestSpecialMethod.date)})
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="h-3 w-3 text-blue-400" />
          ) : (
            <ChevronDown className="h-3 w-3 text-blue-400" />
          )}
        </div>
      </div>

      {/* Expanded Content - Only Visible When Expanded */}
      {isExpanded && (
        <div className="border-t border-blue-500/20 p-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-blue-300/90 leading-tight flex-1 min-w-0">
              {getSpecialMethodDisplay(latestSpecialMethod)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleApplyHistoricalData();
              }}
              disabled={isLoading || isApplying}
              className="ios-touch-feedback h-6 px-2 py-0 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 hover:text-blue-100 border border-blue-500/30 flex-shrink-0"
            >
              {isLoading || isApplying ? (
                <div className="ios-loading-dots flex items-center gap-1">
                  <div className="dot w-1 h-1 bg-blue-200 rounded-full"></div>
                  <div className="dot w-1 h-1 bg-blue-200 rounded-full"></div>
                  <div className="dot w-1 h-1 bg-blue-200 rounded-full"></div>
                </div>
              ) : (
                "Use"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};