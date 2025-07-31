import { queryClient } from '@/lib/queryClient';

// Clear all cached data for all users
export const clearAllUserCache = () => {
  console.log('Clearing all React Query cache...');
  
  // Clear all queries from cache
  queryClient.clear();
  
  // Force a full cache invalidation
  queryClient.invalidateQueries();
  
  console.log('Cache cleared successfully');
};

// Clear specific user's cache
export const clearUserCache = (userId: number) => {
  console.log(`Clearing cache for user ${userId}...`);
  
  // Nutrition-related cache keys
  queryClient.removeQueries({ queryKey: ['/api/nutrition/logs', userId] });
  queryClient.removeQueries({ queryKey: ['/api/nutrition/summary', userId] });
  queryClient.removeQueries({ queryKey: ['/api/nutrition/history', userId] });
  queryClient.removeQueries({ queryKey: ['/api/nutrition/quick-add', userId] });
  queryClient.removeQueries({ queryKey: ['/api/diet-goals', userId] });
  queryClient.removeQueries({ queryKey: ['/api/weight-goals', userId] });
  queryClient.removeQueries({ queryKey: ['/api/body-metrics', userId] });
  queryClient.removeQueries({ queryKey: ['/api/meal-timing', userId] });
  queryClient.removeQueries({ queryKey: ['/api/meal-plans/saved', userId] });
  queryClient.removeQueries({ queryKey: ['/api/activities', userId] });
  
  console.log(`Cache cleared for user ${userId}`);
};