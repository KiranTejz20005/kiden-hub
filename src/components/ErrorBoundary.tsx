import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorCount: 0,
  };

  public static getDerivedStateFromError(error: Error): Omit<State, 'errorInfo' | 'errorCount'> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console with full error details
    console.error('=== ERROR BOUNDARY CAUGHT ERROR ===');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('===================================');

    // Update state with error info and increment error count
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In development, you might want to log to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendErrorToLoggingService(error, errorInfo);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      // If custom fallback provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              The app encountered an error. Try refreshing the page or returning home.
            </p>
            
            {/* Show error message in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6">
                <p className="text-xs text-destructive font-semibold mb-2">Error Details:</p>
                <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg mb-2 font-mono break-all max-h-32 overflow-auto">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <>
                    <p className="text-xs text-destructive font-semibold mb-2 mt-3">Component Stack:</p>
                    <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg font-mono break-all max-h-32 overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Error count indicator */}
            {this.state.errorCount > 1 && (
              <p className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 p-2 rounded mb-6">
                Error #: {this.state.errorCount} (Multiple errors detected)
              </p>
            )}

            <div className="flex gap-3 flex-col">
              <Button onClick={this.handleReload} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" className="gap-2">
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
