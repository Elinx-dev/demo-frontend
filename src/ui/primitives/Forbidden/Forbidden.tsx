import type { ReactNode } from "react";

type ForbiddenProps = {
    title?: string;
    description?: string;
    action?: ReactNode;
};

export const Forbidden = ({
    title = "Access denied",
    description = "You do not have permission to view this resource.",
    action,
}: ForbiddenProps) => {
    return (
        <div
            className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg"
            style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--color-danger-border)",
                color: "var(--color-danger-text)",
            }}
        >
            <div className="text-lg font-semibold mb-1">
                {title}
            </div>

            <div className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                {description}
            </div>

            {action && (
                <div>
                    {action}
                </div>
            )}
        </div>
    );
};
