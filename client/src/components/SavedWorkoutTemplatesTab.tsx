import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Save, 
  Clock, 
  Dumbbell, 
  Trash2, 
  Play, 
  Star,
  Filter
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SavedWorkoutTemplate {
  id: number;
  name: string;
  description: string;
  exerciseTemplates: any[];
  tags: string[];
  estimatedDuration: number;
  difficulty: string;
  usageCount: number;
  lastUsed: string | null;
  createdAt: string;
}

export const SavedWorkoutTemplatesTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");

  // Fetch saved workout templates
  const { data: templates = [], isLoading } = useQuery<SavedWorkoutTemplate[]>({
    queryKey: ['/api/training/saved-workout-templates'],
  });

  // Use template mutation
  const useTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      return apiRequest("POST", `/api/training/saved-workout-templates/${templateId}/use`, {});
    },
    onSuccess: (data: any) => {
      toast({
        title: "Workout Created!",
        description: data?.message || "New workout session created from template.",
      });
      
      // Invalidate cache to refresh workout sessions
      queryClient.invalidateQueries({ queryKey: ["/api/training/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training/saved-workout-templates"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to use workout template.",
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      return apiRequest("DELETE", `/api/training/saved-workout-templates/${templateId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Template Deleted",
        description: "Workout template has been deleted successfully.",
      });
      
      // Invalidate cache to refresh templates
      queryClient.invalidateQueries({ queryKey: ["/api/training/saved-workout-templates"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete workout template.",
        variant: "destructive",
      });
    },
  });

  // Get unique tags for filtering
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    templates.forEach(template => {
      template.tags?.forEach(tag => tags.add(tag));
    });
    return ["all", ...Array.from(tags).sort()];
  }, [templates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = !searchTerm || 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTag = selectedTag === "all" || 
        template.tags?.includes(selectedTag);
      
      return matchesSearch && matchesTag;
    });
  }, [templates, searchTerm, selectedTag]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'advanced': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-sm text-muted-foreground">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search and Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        
        {allTags.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-3 w-3 text-muted-foreground" />
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2 py-1 text-xs border transition-colors ${
                  selectedTag === tag
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {tag === 'all' ? 'All' : tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Templates List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Save className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {searchTerm || selectedTag !== 'all' ? 'No matching templates' : 'No saved templates'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {searchTerm || selectedTag !== 'all' 
                    ? 'Try adjusting your search or filter'
                    : 'Create a workout session and save it as a template to get started'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-sm transition-shadow">
                <CardHeader className="pb-2">
                  <div className="space-y-2">
                    <div>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        {template.name}
                      </CardTitle>
                      {template.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                    </div>
                    <div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getDifficultyColor(template.difficulty)}`}
                      >
                        {template.difficulty}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-3">
                  {/* Template Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Dumbbell className="h-3 w-3" />
                      <span>{template.exerciseTemplates?.length || 0} exercises</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{template.estimatedDuration || 0}min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      <span>Used {template.usageCount || 0}x</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag, index) => (
                        <Badge 
                          key={index}
                          variant="secondary" 
                          className="text-xs px-1.5 py-0.5"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Usage Info */}
                  <div className="text-xs text-muted-foreground">
                    Created {formatDate(template.createdAt)}
                    {template.lastUsed && (
                      <span> • Last used {formatDate(template.lastUsed)}</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => useTemplateMutation.mutate(template.id)}
                      disabled={useTemplateMutation.isPending}
                      className="flex-1 text-xs"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      {useTemplateMutation.isPending ? 'Creating...' : 'Use Template'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this template?')) {
                          deleteTemplateMutation.mutate(template.id);
                        }
                      }}
                      disabled={deleteTemplateMutation.isPending}
                      className="px-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};