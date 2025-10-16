import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Dumbbell, Activity, TrendingUp, Brain } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
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
              onClick={() => window.location.href = '/auth'}
              data-testid="button-signin"
            >
              Get Started
            </Button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign in to access your personalized fitness dashboard
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <Dumbbell className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Smart Training</h3>
            <p className="text-gray-600 dark:text-gray-300">
              AI-powered workout recommendations tailored to your goals and experience level
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <Activity className="w-10 h-10 text-green-600 dark:text-green-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Nutrition Tracking</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Track macros and calories with AI-assisted food recognition and analysis
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <TrendingUp className="w-10 h-10 text-purple-600 dark:text-purple-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Progress Analytics</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Comprehensive tracking of body composition, strength, and training volume
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <Brain className="w-10 h-10 text-orange-600 dark:text-orange-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Evidence-Based</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Built on scientific periodization principles and auto-regulation methodology
            </p>
          </div>
        </div>

        {/* Footer with Privacy Policy Link */}
        <div className="text-center border-t border-gray-300 dark:border-gray-700 pt-8">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            © {new Date().getFullYear()} TrainPro. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <Link href="/privacy-policy">
              <a className="text-blue-600 dark:text-blue-400 hover:underline" data-testid="link-privacy-policy">
                Privacy Policy
              </a>
            </Link>
            <Link href="/terms-of-service">
              <a className="text-blue-600 dark:text-blue-400 hover:underline" data-testid="link-terms">
                Terms of Service
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}