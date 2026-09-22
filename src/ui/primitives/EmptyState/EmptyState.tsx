import type { ReactNode } from "react";

type EmptyStateProps = {
    title: string;
    description?: string;
    action?: ReactNode;
};

export const EmptyState = ({ title, description, action }: EmptyStateProps) => {
    return (
        <div
            className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg"
            style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--color-primary-border)",
                color: "var(--text-muted)",
            }}
        >
            <div className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>
                {title}
            </div>

            {description && (
                <div className="text-sm mb-4">
                    {description}
                </div>
            )}

            {action && (
                <div>
                    {action}
                </div>
            )}
        </div>
    );
};
