import React from "react";
import { FatalError } from "@/ui/primitives/FatalError/FatalError";

type ErrorBoundaryState = {
    hasError: boolean;
    error?: Error;
};

type ErrorBoundaryProps = {
    children: React.ReactNode;
};

/**
 * Global Error Boundary
 * ---------------------
 * - Catches render + lifecycle errors
 * - Prevents white-screen crashes
 * - Shows a controlled fallback UI
 */
export class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    state: ErrorBoundaryState = {
        hasError: false,
    };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("[UI CRASH]", {
            error,
            componentStack: errorInfo.componentStack,
        });
    }

    reset = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 space-y-4">
                    <FatalError
                        title="Something went wrong"
                        message={
                            this.state.error?.message ??
                            "An unexpected error occurred. Please try again."
                        }
                    />

                    {/* Retry handled OUTSIDE primitive */}
                    <button
                        onClick={this.reset}
                        className="px-4 py-2 rounded-md text-sm font-medium
                       bg-blue-600 text-white hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
