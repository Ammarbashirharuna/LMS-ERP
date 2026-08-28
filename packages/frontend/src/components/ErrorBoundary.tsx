import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9] p-8">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-[#C4432B]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1F1B16] mb-2">
              {this.props.fallbackTitle || "Something went wrong"}
            </h1>
            <p className="text-[#6B6560] mb-6">
              An unexpected error occurred. Your data is safe. You can try reloading the page or going back.
            </p>
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-[#6B6560] cursor-pointer hover:text-[#1F1B16]">
                  Error details
                </summary>
                <pre className="mt-2 text-xs text-[#C4432B] bg-red-50 p-3 rounded-lg overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 border border-[#E7E4DE] rounded-xl text-[#1F1B16] font-semibold hover:bg-[#F3F2EF] transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-[#FF6B35] text-white font-semibold rounded-xl hover:bg-[#E85A2A] transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
