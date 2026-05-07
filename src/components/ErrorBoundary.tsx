import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error) {
    // error captured by getDerivedStateFromError
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            className="flex items-center gap-3 rounded-lg border border-[#1B2030] bg-[#0F1320] px-4 py-3"
            data-testid="error-boundary-fallback"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#EF4444]" />
            <span className="text-sm text-[#9BA4AE]">
              Failed to load this section.
            </span>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="ml-auto flex items-center gap-1.5 rounded px-2 py-1 text-xs text-[#E6EDF3] hover:bg-[#1C1C1F] transition-colors"
              data-testid="error-boundary-retry"
            >
              <RotateCcw className="h-3 w-3" />
              Retry
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
