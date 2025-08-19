import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

// Error reporting service (placeholder for external service)
class ErrorReportingService {
  static report(error: Error, errorInfo: ErrorInfo, context: any = {}) {
    // In production, this would send to Sentry, LogRocket, etc.
    console.group('🔴 Error Boundary Report');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Context:', context);
    console.groupEnd();

    // Store in localStorage for debugging
    try {
      const errorReport = {
        timestamp: new Date().toISOString(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        errorInfo,
        context,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      const existingReports = JSON.parse(localStorage.getItem('trainpro_error_reports') || '[]');
      existingReports.push(errorReport);
      
      // Keep only last 10 reports
      const recentReports = existingReports.slice(-10);
      localStorage.setItem('trainpro_error_reports', JSON.stringify(recentReports));
    } catch (storageError) {
      console.warn('Could not store error report:', storageError);
    }
  }
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    
    // Store error info
    this.setState({ 
      error,
      errorInfo 
    });

    // Report error
    ErrorReportingService.report(error, errorInfo, {
      level,
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId
    });

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Auto-recovery for component-level errors
    if (level === 'component') {
      this.resetTimeoutId = window.setTimeout(() => {
        this.handleReset();
      }, 5000);
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: ''
    });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback, showDetails = false, level = 'component' } = this.props;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      // Critical level errors - full page
      if (level === 'critical') {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <CardTitle className="text-red-900 dark:text-red-100">
                      Application Error
                    </CardTitle>
                    <CardDescription>
                      Something went wrong and the app needs to restart
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We apologize for the inconvenience. The error has been logged and will be investigated.
                </p>
                
                {showDetails && error && (
                  <Alert variant="destructive">
                    <Bug className="h-4 w-4" />
                    <AlertTitle>Technical Details</AlertTitle>
                    <AlertDescription className="font-mono text-xs mt-2">
                      <div className="space-y-1">
                        <div><strong>Error ID:</strong> {errorId}</div>
                        <div><strong>Message:</strong> {error.message}</div>
                        {error.stack && (
                          <details className="mt-2">
                            <summary className="cursor-pointer">Stack Trace</summary>
                            <pre className="text-xs mt-1 overflow-x-auto whitespace-pre-wrap">
                              {error.stack}
                            </pre>
                          </details>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button onClick={this.handleRefresh} className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Restart App
                  </Button>
                  <Button variant="outline" onClick={this.handleGoHome}>
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      // Page level errors
      if (level === 'page') {
        return (
          <div className="container mx-auto px-4 py-8 max-w-2xl">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Page Error</AlertTitle>
              <AlertDescription>
                This page encountered an error and cannot be displayed properly.
              </AlertDescription>
            </Alert>
            
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Error ID: <code className="font-mono">{errorId}</code>
              </p>
              
              <div className="flex gap-2">
                <Button onClick={this.handleReset}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={this.handleGoHome}>
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {showDetails && error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium">Technical Details</summary>
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <div className="font-mono text-xs space-y-2">
                      <div><strong>Message:</strong> {error.message}</div>
                      {error.stack && (
                        <div>
                          <strong>Stack:</strong>
                          <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              )}
            </div>
          </div>
        );
      }

      // Component level errors - inline fallback
      return (
        <div className="p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Component Error
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                This section could not load properly.
              </p>
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={this.handleReset}
                  className="h-8 px-3 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for programmatic error reporting
export function useErrorReporting() {
  const reportError = React.useCallback((error: Error, context?: any) => {
    ErrorReportingService.report(error, { componentStack: '' }, context);
  }, []);

  return { reportError };
}

// Async error boundary for handling Promise rejections
export function setupGlobalErrorHandling() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = new Error(`Unhandled Promise Rejection: ${event.reason}`);
    ErrorReportingService.report(error, { componentStack: 'Global Handler' }, {
      type: 'unhandledrejection',
      reason: event.reason
    });
  });

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    const error = new Error(event.message);
    error.stack = `${event.filename}:${event.lineno}:${event.colno}`;
    ErrorReportingService.report(error, { componentStack: 'Global Handler' }, {
      type: 'global-error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
}