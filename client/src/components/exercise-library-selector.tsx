import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Target, Clock, RotateCcw, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

interface Exercise {
  id: number;
  name: string;
  category: string;
  muscleGroups: string[];
  primaryMuscle: string;
  equipment: string;
  movementPattern: string;
  difficulty: string;
}

interface ExerciseConfig {
  exerciseId: number;
  exerciseName: string;
  sets: number;
  repsRange: string;
  weight: number;
  restPeriod: number;
  notes?: string;
}

interface ExerciseLibrarySelectorProps {
  onAddExercise: (exercise: ExerciseConfig) => void;
  selectedExercises: ExerciseConfig[];
  onRemoveExercise: (exerciseId: number) => void;
}

export function ExerciseLibrarySelector({ 
  onAddExercise, 
  selectedExercises, 
  onRemoveExercise 
}: ExerciseLibrarySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const exercisesPerPage = 12;
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exerciseConfig, setExerciseConfig] = useState<ExerciseConfig>({
    exerciseId: 0,
    exerciseName: "",
    sets: 3,
    repsRange: "8-12",
    weight: 0,
    restPeriod: 60,
    notes: ""
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter]);

  // Fetch exercises
  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['/api/training/exercises'],
  });

  // Memoized: Filter exercises based on search and category
  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise: Exercise) => {
      const matchesSearch = debouncedSearchQuery === "" ||
        exercise.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        exercise.muscleGroups?.some(mg => mg.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === "all" || exercise.category === categoryFilter;
      const notAlreadySelected = !selectedExercises.some(se => se.exerciseId === exercise.id);
      
      return matchesSearch && matchesCategory && notAlreadySelected;
    });
  }, [exercises, debouncedSearchQuery, categoryFilter, selectedExercises]);

  // Memoized: Paginated exercises
  const paginatedExercises = useMemo(() => {
    const startIndex = (currentPage - 1) * exercisesPerPage;
    const endIndex = startIndex + exercisesPerPage;
    return filteredExercises.slice(startIndex, endIndex);
  }, [filteredExercises, currentPage, exercisesPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredExercises.length / exercisesPerPage);

  // Memoized: Get unique categories for filter
  const categories = useMemo(() => {
    return [...new Set(exercises.map((ex: Exercise) => ex.category))];
  }, [exercises]);

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setExerciseConfig({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: 3,
      repsRange: "8-12",
      weight: 0,
      restPeriod: getDefaultRestPeriod(exercise.category),
      notes: ""
    });
    setShowConfigDialog(true);
  };

  const getDefaultRestPeriod = (category: string): number => {
    switch (category) {
      case 'compound': return 120; // 2 minutes for compound movements
      case 'isolation': return 60;  // 1 minute for isolation
      case 'cardio': return 30;     // 30 seconds for cardio
      default: return 90;           // 90 seconds default
    }
  };

  const handleSaveConfiguration = () => {
    if (selectedExercise) {
      onAddExercise(exerciseConfig);
      setShowConfigDialog(false);
      setSelectedExercise(null);
      setSearchQuery(""); // Clear search after adding
    }
  };

  const getMuscleGroupColor = (muscleGroup: string) => {
    const colors = {
      'chest': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'back': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'shoulders': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'biceps': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'triceps': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'legs': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      'core': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    };
    return colors[muscleGroup as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading exercise library...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Selected Exercises Summary */}
      {selectedExercises.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Selected Exercises ({selectedExercises.length})</h4>
            </div>
            <div className="space-y-2">
              {selectedExercises.map((exercise) => (
                <div key={exercise.exerciseId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 ">
                  <div className="flex-1">
                    <span className="font-medium">{exercise.exerciseName}</span>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {exercise.sets} sets × {exercise.repsRange} reps
                      {exercise.weight > 0 && ` @ ${exercise.weight}kg`}
                      | {exercise.restPeriod}s rest
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveExercise(exercise.exerciseId)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search exercises by name or muscle group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Counter and Pagination Info */}
      {filteredExercises.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
          <span className="font-medium">
            {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
            {totalPages > 1 && (
              <span className="ml-2 text-xs opacity-75">
                (Page {currentPage} of {totalPages})
              </span>
            )}
          </span>
          {totalPages > 1 && (
            <span className="text-xs opacity-75">
              Showing {Math.min((currentPage - 1) * exercisesPerPage + 1, filteredExercises.length)}-{Math.min(currentPage * exercisesPerPage, filteredExercises.length)} of {filteredExercises.length}
            </span>
          )}
        </div>
      )}

      {/* Exercise Library */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchQuery || categoryFilter !== "all" 
              ? "No exercises found matching your criteria"
              : "All exercises are already selected"
            }
          </div>
        ) : (
          paginatedExercises.map((exercise: Exercise) => (
            <Card key={exercise.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-medium">{exercise.name}</h5>
                      <Badge variant="outline" className="text-xs">
                        {exercise.category}
                      </Badge>
                      {exercise.equipment && (
                        <Badge variant="secondary" className="text-xs">
                          {exercise.equipment}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {exercise.muscleGroups?.map((muscle, i) => (
                        <Badge key={i} className={getMuscleGroupColor(muscle) + " text-xs"}>
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleExerciseSelect(exercise)}
                    className="ml-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="h-8 px-3"
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
                  onClick={() => setCurrentPage(pageNum)}
                  className="h-8 w-8 p-0 text-xs"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="h-8 px-3"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Exercise Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Exercise: {selectedExercise?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sets">Sets</Label>
                <Input
                  id="sets"
                  type="number"
                  value={exerciseConfig.sets}
                  onChange={(e) => setExerciseConfig(prev => ({ ...prev, sets: parseInt(e.target.value) || 1 }))}
                  min="1"
                  max="10"
                />
              </div>
              <div>
                <Label htmlFor="reps">Reps Range</Label>
                <Input
                  id="reps"
                  value={exerciseConfig.repsRange}
                  onChange={(e) => setExerciseConfig(prev => ({ ...prev, repsRange: e.target.value }))}
                  placeholder="e.g., 8-12 or 10,8,6"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Starting Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={exerciseConfig.weight}
                  onChange={(e) => setExerciseConfig(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <Label htmlFor="rest">Rest Period (seconds)</Label>
                <Input
                  id="rest"
                  type="number"
                  value={exerciseConfig.restPeriod}
                  onChange={(e) => setExerciseConfig(prev => ({ ...prev, restPeriod: parseInt(e.target.value) || 60 }))}
                  min="30"
                  max="300"
                  step="15"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={exerciseConfig.notes || ""}
                onChange={(e) => setExerciseConfig(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Exercise notes or modifications..."
              />
            </div>

            {/* Quick Rest Period Presets */}
            <div>
              <Label className="text-sm">Quick Rest Presets:</Label>
              <div className="flex gap-2 mt-1">
                {[60, 90, 120, 180].map((seconds) => (
                  <Button
                    key={seconds}
                    variant="outline"
                    size="sm"
                    onClick={() => setExerciseConfig(prev => ({ ...prev, restPeriod: seconds }))}
                    className={exerciseConfig.restPeriod === seconds ? "bg-blue-100 dark:bg-blue-900" : ""}
                  >
                    {seconds < 120 ? `${seconds}s` : `${seconds/60}m`}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfiguration}>
              <Plus className="h-4 w-4 mr-1" />
              Add Exercise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}