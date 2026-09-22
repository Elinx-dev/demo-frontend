import { usePolicy, type CanonicalAction } from "@/ui-policy/hooks/usePolicy";
import { Button } from "@/ui/primitives/Button/Button";
import type { ReactNode } from "react";

type PolicyButtonProps = {
    action: CanonicalAction;
    entityType?: string;
    entityId?: string;
    entityStatus?: string;
    children: ReactNode;
} & Omit<React.ComponentProps<typeof Button>, "children">;

export const PolicyButton = ({
    action,
    entityType,
    entityId,
    entityStatus,
    children,
    ...rest
}: PolicyButtonProps) => {
    const policy = usePolicy({
        action,
        entity: entityType
            ? {
                type: entityType,
                id: entityId,
                status: entityStatus,
            }
            : undefined,
    });

    /* ===== HIDDEN ===== */
    if (policy.visible === false) return null;

    /* ===== ENABLED (DEFAULT SAFE) ===== */
    const isEnabled = policy.enabled !== false;

    return (
        <Button
            disabled={!isEnabled}
            reason={!isEnabled ? policy.reason : undefined}
            {...rest}
        >
            {children}
        </Button>
    );
};
