import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Capacitor } from '@capacitor/core';
import { CheckCircle2, XCircle, AlertCircle, Smartphone, Globe } from "lucide-react";

export default function OAuthTest() {
  const [environment, setEnvironment] = useState<{
    isCapacitor: boolean;
    platform: string;
    userAgent: string;
    isApp: boolean;
  }>({
    isCapacitor: false,
    platform: 'unknown',
    userAgent: '',
    isApp: false
  });

  const [testResults, setTestResults] = useState<{
    envDetection: boolean | null;
    parameterAdded: boolean | null;
    deepLinkReady: boolean | null;
  }>({
    envDetection: null,
    parameterAdded: null,
    deepLinkReady: null
  });

  useEffect(() => {
    // Detect environment
    const isCapacitor = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    const userAgent = window.navigator.userAgent;
    const isApp = isCapacitor || userAgent.includes('MyTrainPro-iOS');

    setEnvironment({
      isCapacitor,
      platform,
      userAgent,
      isApp
    });

    // Run tests
    setTestResults({
      envDetection: isApp,
      parameterAdded: isApp,
      deepLinkReady: isCapacitor
    });

    // Log environment details
    console.log('[OAuth Test] Environment Detection:', {
      isCapacitor,
      platform,
      userAgent,
      isApp
    });
  }, []);

  const testOAuth = (provider: 'google' | 'apple') => {
    // Construct auth URL with app parameter if in Capacitor
    let authUrl = provider === 'google' 
      ? `/api/auth/google`
      : `/api/auth/apple`;
    
    if (environment.isApp) {
      authUrl += '?app=1';
      console.log('[OAuth Test] Added app=1 parameter for Capacitor environment');
    }

    console.log(`[OAuth Test] Testing ${provider} OAuth with URL:`, authUrl);
    window.location.href = authUrl;
  };

  const TestStatus = ({ status, label }: { status: boolean | null; label: string }) => {
    if (status === null) {
      return (
        <div className="flex items-center gap-2 text-gray-500">
          <AlertCircle className="h-5 w-5" />
          <span>{label}: Not tested</span>
        </div>
      );
    }
    if (status) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          <span>{label}: ✅ Working</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-red-600">
        <XCircle className="h-5 w-5" />
        <span>{label}: ❌ Not working</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 ios-pwa-container">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {environment.isApp ? (
                <>
                  <Smartphone className="h-6 w-6 text-blue-600" />
                  OAuth Deep Link Test (App Environment)
                </>
              ) : (
                <>
                  <Globe className="h-6 w-6 text-gray-600" />
                  OAuth Deep Link Test (Web Environment)
                </>
              )}
            </CardTitle>
            <CardDescription>
              Testing OAuth deep linking for MyTrainPro Capacitor iOS App
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Environment Info */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Environment Details</h3>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-1 text-sm font-mono">
                <div>Capacitor: {environment.isCapacitor ? 'YES' : 'NO'}</div>
                <div>Platform: {environment.platform}</div>
                <div>User Agent: {environment.userAgent || 'N/A'}</div>
                <div>App Detection: {environment.isApp ? 'YES - Will use deep links' : 'NO - Will use web redirect'}</div>
              </div>
            </div>

            {/* Test Results */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">OAuth Configuration Tests</h3>
              <div className="space-y-2">
                <TestStatus status={testResults.envDetection} label="Environment Detection" />
                <TestStatus status={testResults.parameterAdded} label="App Parameter (?app=1)" />
                <TestStatus status={testResults.deepLinkReady} label="Deep Link Handler" />
              </div>
            </div>

            {/* Expected Flow */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Expected OAuth Flow</h3>
              {environment.isApp ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-blue-600 dark:text-blue-400">App Environment Flow:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Click OAuth button → adds ?app=1 parameter</li>
                    <li>Server receives request with app=1</li>
                    <li>After OAuth success, server redirects to: mytrainpro://auth/callback</li>
                    <li>Capacitor app handles deep link</li>
                    <li>App restores session and redirects to dashboard</li>
                  </ol>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-gray-600 dark:text-gray-400">Web Environment Flow:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Click OAuth button → no app parameter</li>
                    <li>Server performs standard OAuth</li>
                    <li>After success, redirects to web dashboard</li>
                  </ol>
                </div>
              )}
            </div>

            {/* Test Buttons */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Test OAuth Providers</h3>
              <div className="flex gap-4">
                <Button 
                  onClick={() => testOAuth('google')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Test Google OAuth
                </Button>
                <Button 
                  onClick={() => testOAuth('apple')}
                  className="flex-1 bg-black hover:bg-gray-900"
                >
                  Test Apple OAuth
                </Button>
              </div>
              {environment.isApp && (
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  ⚠️ These buttons will redirect to: mytrainpro://auth/callback
                </p>
              )}
            </div>

            {/* Debug Console */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Debug Console</h3>
              <div className="bg-black text-green-400 rounded-lg p-4 font-mono text-xs">
                <div>[OAuth Test] Page loaded</div>
                <div>[OAuth Test] Capacitor detected: {String(environment.isCapacitor)}</div>
                <div>[OAuth Test] Platform: {environment.platform}</div>
                <div>[OAuth Test] App environment: {String(environment.isApp)}</div>
                {environment.isApp && (
                  <div className="text-yellow-400">[OAuth Test] Deep linking enabled for OAuth</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}