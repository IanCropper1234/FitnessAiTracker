import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Eye, Database, Share, Lock } from "lucide-react";
import { useLocation } from "wouter";

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/profile')}
            className="h-8 w-8 bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 p-0 ios-button touch-target transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-2 flex-1 justify-center">
            <Shield className="w-4 h-4 text-foreground/70" />
            <h1 className="text-sm font-semibold text-foreground truncate">Privacy Policy</h1>
          </div>
          
          <div className="w-8"></div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              TrainPro Privacy Policy
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Information We Collect
              </h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>We collect information you provide directly to us, such as:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Account information (email, name, profile picture)</li>
                  <li>Fitness data (workouts, body measurements, goals)</li>
                  <li>Nutrition data (food intake, dietary preferences)</li>
                  <li>Device information for app functionality</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Database className="w-4 h-4" />
                How We Use Your Information
              </h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>We use your information to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Provide personalized fitness and nutrition recommendations</li>
                  <li>Track your progress and generate analytics</li>
                  <li>Improve our AI-powered coaching features</li>
                  <li>Send you important updates about the service</li>
                  <li>Ensure the security of your account</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Share className="w-4 h-4" />
                Information Sharing
              </h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>We do not sell, trade, or otherwise transfer your personal information to third parties except:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>With your explicit consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and safety</li>
                  <li>With trusted service providers who assist in app operations</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Data Security
              </h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>We implement industry-standard security measures including:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>End-to-end encryption for sensitive data</li>
                  <li>Secure authentication systems</li>
                  <li>Regular security audits and updates</li>
                  <li>Limited access to personal information</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">Your Rights</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>You have the right to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Access and download your data</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your account and data</li>
                  <li>Opt out of non-essential communications</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">Health Data</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>TrainPro may integrate with Apple Health and other health platforms. Health data is:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Only accessed with your explicit permission</li>
                  <li>Used solely for fitness tracking and recommendations</li>
                  <li>Never shared with third parties</li>
                  <li>Stored securely and encrypted</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">Contact Us</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>If you have questions about this Privacy Policy, contact us at:</p>
                <p className="font-medium">privacy@trainpro.app</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}