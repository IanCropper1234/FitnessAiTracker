import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingStateWithError } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/error-boundary';
import { useOptimizedSearch } from '@/hooks/useOptimizedSearch';

interface Exercise {
  id: number;
  name: string;
  category: string;
  primaryMuscle: string;
  equipment?: string;
  muscleGroups?: string[];
}

interface OptimizedExerciseSearchProps {
  onExerciseSelect: (exercise: Exercise) => void;
  selectedExerciseIds?: number[];
  categoryFilter?: string;
  targetMuscles?: string[];
  showEquipmentFilter?: boolean;
  showCategoryStats?: boolean;
  pageSize?: number;
  className?: string;
}

export function OptimizedExerciseSearch({
  onExerciseSelect,
  selectedExerciseIds = [],
  categoryFilter = 'all',
  targetMuscles = [],
  showEquipmentFilter = false,
  showCategoryStats = true,
  pageSize = 20,
  className = ''
}: OptimizedExerciseSearchProps) {
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter);
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');

  // Fetch exercises with error boundary protection
  const { data: exercises = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/training/exercises'],
    queryFn: async () => {
      const response = await fetch('/api/training/exercises', {
        credentials: 'include'
      });
      
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exercises: ${response.status}`);
      }
      
      return response.json();
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter function for optimized search
  const filterFn = useCallback((exercise: Exercise) => {
    // Safety checks
    if (!exercise?.name || !exercise?.category) return false;

    // Category filter
    if (selectedCategory !== 'all' && exercise.category !== selectedCategory) {
      return false;
    }

    // Equipment filter
    if (showEquipmentFilter && selectedEquipment !== 'all') {
      const exerciseEquipment = exercise.equipment || 'bodyweight';
      if (exerciseEquipment !== selectedEquipment) {
        return false;
      }
    }

    // Target muscle filter
    if (targetMuscles.length > 0) {
      const matchesTarget = targetMuscles.some(muscle => 
        exercise.muscleGroups?.some(mg => 
          mg && mg.toLowerCase().includes(muscle.toLowerCase())
        ) || exercise.primaryMuscle?.toLowerCase().includes(muscle.toLowerCase())
      );
      if (!matchesTarget) return false;
    }

    // Exclude already selected exercises
    if (selectedExerciseIds.includes(exercise.id)) {
      return false;
    }

    return true;
  }, [selectedCategory, selectedEquipment, targetMuscles, selectedExerciseIds, showEquipmentFilter]);

  // Optimized search hook
  const [searchResult, searchControls] = useOptimizedSearch({
    data: exercises,
    searchFields: ['name', 'primaryMuscle', 'category'],
    filterFn,
    pageSize,
    debounceMs: 300,
    maxCacheSize: 50,
    enableCache: true
  });

  const {
    paginatedData,
    totalItems,
    totalPages,
    currentPage,
    isSearching
  } = searchResult;

  // Get unique categories and equipment for filters
  const { categories, equipment } = useMemo(() => {
    const categorySet = new Set<string>();
    const equipmentSet = new Set<string>();

    exercises.forEach((exercise: Exercise) => {
      if (exercise.category) categorySet.add(exercise.category);
      if (exercise.equipment) {
        equipmentSet.add(exercise.equipment);
      } else {
        equipmentSet.add('bodyweight');
      }
    });

    return {
      categories: Array.from(categorySet).sort(),
      equipment: Array.from(equipmentSet).sort()
    };
  }, [exercises]);

  // Loading and error states
  if (isLoading) {
    return (
      <div className={className}>
        <LoadingStateWithError message="Loading exercises..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <LoadingStateWithError 
          error={error as Error}
          onRetry={refetch}
          retryButton="Reload Exercises"
        />
      </div>
    );
  }

  return (
    <ErrorBoundary level="component">
      <div className={`space-y-4 ${className}`}>
        {/* Search and Filter Controls */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              onChange={(e) => searchControls.setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={isSearching}
            />
            {isSearching && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All Categories {showCategoryStats && `(${exercises.length})`}
                </SelectItem>
                {categories.map(category => {
                  const count = exercises.filter((ex: Exercise) => ex.category === category).length;
                  return (
                    <SelectItem key={category} value={category}>
                      {category} {showCategoryStats && `(${count})`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {showEquipmentFilter && (
              <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Equipment</SelectItem>
                  {equipment.map(eq => (
                    <SelectItem key={eq} value={eq}>
                      {eq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {targetMuscles.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                Target: {targetMuscles.join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {isSearching ? (
              'Searching...'
            ) : (
              `${totalItems} exercises found`
            )}
          </span>
          {totalPages > 1 && (
            <span>
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>

        {/* Exercise Grid */}
        <ScrollArea className="h-96">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pr-4">
            {paginatedData.map((exercise: Exercise) => (
              <Card 
                key={exercise.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onExerciseSelect(exercise)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm line-clamp-2">
                      {exercise.name}
                    </h4>
                    
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {exercise.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {exercise.primaryMuscle}
                      </Badge>
                    </div>

                    {exercise.equipment && (
                      <p className="text-xs text-muted-foreground">
                        {exercise.equipment}
                      </p>
                    )}

                    {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {exercise.muscleGroups.slice(0, 2).map((muscle) => (
                          <Badge key={muscle} variant="outline" className="text-xs opacity-70">
                            {muscle}
                          </Badge>
                        ))}
                        {exercise.muscleGroups.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{exercise.muscleGroups.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => searchControls.setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => searchControls.setCurrentPage(pageNum)}
                    className="h-8 w-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => searchControls.setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Cache Stats (Debug Info) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-muted-foreground text-center">
            Cache: {searchControls.getCacheStats().size}/{searchControls.getCacheStats().maxSize} entries
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default OptimizedExerciseSearch;