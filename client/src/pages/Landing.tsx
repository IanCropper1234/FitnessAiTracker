import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Welcome to TrainPro
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Your AI-powered fitness companion for intelligent training and nutrition management. 
          Get personalized recommendations based on evidence-based methodology.
        </p>
        <div className="space-y-4">
          <Button 
            size="lg" 
            className="px-8 py-3 text-lg"
            onClick={() => window.location.href = '/api/login'}
          >
            Sign In with Replit
          </Button>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sign in to access your personalized fitness dashboard
          </p>
        </div>
      </div>
    </div>
  );
}