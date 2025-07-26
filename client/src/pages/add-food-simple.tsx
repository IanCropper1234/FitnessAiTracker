import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Plus } from "lucide-react";

interface User {
  id: number;
  email: string;
  name: string;
}

interface AddFoodProps {
  user: User;
}

export function AddFood({ user }: AddFoodProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground ios-pwa-container">
      <div className="container mx-auto p-4 space-y-4">
        {/* Ultra-Compact Header */}
        <div className="h-11 flex items-center justify-between px-1 ios-smooth-transform">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/nutrition')}
            className="h-8 w-8 rounded-full bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 p-0 ios-button touch-target"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-2 flex-1 justify-center">
            <Plus className="w-4 h-4 text-foreground/70" />
            <h1 className="text-sm font-semibold text-foreground">Add Food</h1>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/dashboard')}
            className="h-8 w-8 rounded-full bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 p-0 ios-button touch-target"
          >
            <Home className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-center py-8">
          <h2 className="text-lg font-semibold mb-4">Add Food Page</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Food addition functionality will be implemented here.
          </p>
          <p className="text-sm text-gray-500">User: {user.email}</p>
        </div>
      </div>
    </div>
  );
}