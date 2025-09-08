import React from 'react';
import { toast } from 'sonner';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null,
            errorInfo: null,
            retryCount: 0
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        this.setState({
            error,
            errorInfo,
        });

        // Log error to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
            // Example: logErrorToService(error, errorInfo);
        }

        // Show user-friendly error notification
        toast.error('Something went wrong', {
            description: 'The application encountered an error. Please try refreshing the page.',
            duration: 5000,
        });
    }

    handleRetry = () => {
        this.setState(prevState => ({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: prevState.retryCount + 1
        }));
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
                            <p className="text-gray-600 mb-6">
                                The application encountered an unexpected error. This could be due to a network issue or a temporary problem.
                            </p>
                            
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="text-left mb-6 p-4 bg-gray-100 rounded border">
                                    <summary className="cursor-pointer font-semibold">Error Details</summary>
                                    <pre className="mt-2 text-sm text-red-600 overflow-auto">
                                        {this.state.error.toString()}
                                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                                    </pre>
                                </details>
                            )}
                            
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={this.handleRetry}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                    disabled={this.state.retryCount >= 3}
                                >
                                    {this.state.retryCount >= 3 ? 'Max Retries Reached' : 'Try Again'}
                                </button>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                >
                                    Refresh Page
                                </button>
                            </div>
                            
                            {this.state.retryCount >= 3 && (
                                <p className="mt-4 text-sm text-gray-500">
                                    If the problem persists, please contact support.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
