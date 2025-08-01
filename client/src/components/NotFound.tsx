import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";

export function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-center">
        <CardHeader>
          <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900  flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <CardTitle className="text-2xl font-bold text-black dark:text-white">
            404 - Page Not Found
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            The page you're looking for doesn't exist.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => setLocation("/")}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}