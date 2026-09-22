import type { ComponentProps } from "react";
import { usePolicy } from "@/ui-policy/hooks/usePolicy";
import type { CanonicalAction } from "@/ui-policy/hooks/usePolicy";
import { Input } from "../Input/Input";

type PolicyInputProps = {
    action: CanonicalAction;
    entityType?: string;
    entityId?: string;
    entityStatus?: string;
} & ComponentProps<typeof Input>;

export const PolicyInput = ({
    action,
    entityType,
    entityId,
    entityStatus,
    ...props
}: PolicyInputProps) => {
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

    if (!policy.visible) return null;

    return (
        <Input
            {...props}
            disabled={!policy.enabled || policy.readonly}
            title={policy.reason}
        />
    );
};
