import { Button } from "@/ui/primitives/Button/Button";

type ErrorFallbackProps = {
    title?: string;
    message?: string;
    onRetry?: () => void;
};

/**
 * ErrorFallback
 * -------------
 * Lightweight, reusable error UI
 *
 * Use cases:
 * - Route-level error boundaries
 * - Suspense fallbacks
 * - Async data failures
 * - Policy-denied states (optional)
 *
 * ❗ No business logic here
 */
export const ErrorFallback = ({
    title = "Unable to load",
    message = "Something went wrong while loading this section.",
    onRetry,
}: ErrorFallbackProps) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="text-lg font-semibold text-red-600">
                {title}
            </div>

            <div className="text-sm text-gray-600 max-w-md">
                {message}
            </div>

            {onRetry && (
                <Button variant="primary" size="sm" onClick={onRetry}>
                    Try again
                </Button>
            )}
        </div>
    );
};
