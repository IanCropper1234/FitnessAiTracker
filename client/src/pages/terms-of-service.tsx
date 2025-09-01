import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, AlertTriangle, Shield, Gavel } from "lucide-react";
import { useLocation } from "wouter";

export default function TermsOfService() {
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
            <FileText className="w-4 h-4 text-foreground/70" />
            <h1 className="text-sm font-semibold text-foreground truncate">Terms of Service</h1>
          </div>
          
          <div className="w-8"></div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              TrainPro Terms of Service
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>By using TrainPro, you agree to these terms. If you disagree with any part, please discontinue use of the service.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">2. Service Description</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>TrainPro provides:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>AI-powered fitness and nutrition coaching</li>
                  <li>Workout tracking and exercise recommendations</li>
                  <li>Nutrition analysis and meal planning</li>
                  <li>Progress tracking and analytics</li>
                  <li>Evidence-based periodization methodology</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                3. Health and Medical Disclaimer
              </h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Important Health Notice:</p>
                  <ul className="list-disc pl-5 space-y-1 text-yellow-700 dark:text-yellow-300">
                    <li>TrainPro is not a medical service and does not provide medical advice</li>
                    <li>Consult healthcare professionals before starting any fitness program</li>
                    <li>Stop exercising and seek medical attention if you experience pain or discomfort</li>
                    <li>Results may vary and are not guaranteed</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">4. User Responsibilities</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>You agree to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Provide accurate information about your fitness level and health</li>
                  <li>Use the service responsibly and at your own risk</li>
                  <li>Not share your account credentials with others</li>
                  <li>Respect other users and maintain appropriate conduct</li>
                  <li>Not attempt to reverse engineer or misuse the service</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">5. Intellectual Property</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>TrainPro and its content are protected by intellectual property laws. You may not:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Copy, modify, or distribute our content without permission</li>
                  <li>Use our trademarks or branding without authorization</li>
                  <li>Create derivative works based on our service</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                6. Limitation of Liability
              </h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>TrainPro's liability is limited to the maximum extent permitted by law. We are not liable for:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Injuries or health issues resulting from exercise</li>
                  <li>Indirect, incidental, or consequential damages</li>
                  <li>Loss of data or service interruptions</li>
                  <li>Third-party content or services</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">7. Subscription and Billing</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>If you subscribe to premium features:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Subscriptions auto-renew unless cancelled</li>
                  <li>Cancellation takes effect at the end of the billing period</li>
                  <li>Refunds are subject to Apple's App Store policies</li>
                  <li>Pricing may change with 30 days notice</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">8. Privacy</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">9. Termination</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>We may terminate or suspend your account for violations of these terms. You may cancel your account at any time through the app settings.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Gavel className="w-4 h-4" />
                10. Changes to Terms
              </h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>We may update these terms periodically. Continued use of the service constitutes acceptance of any changes.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">11. Contact Information</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Questions about these terms? Contact us at:</p>
                <p className="font-medium">legal@trainpro.app</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}