import {
    Controller,
    type Control,
    type FieldValues,
    type Path,
} from "react-hook-form";
import { PolicyInput } from "../PolicyInput/PolicyInput";
import type { CanonicalAction } from "@/ui-policy/hooks/usePolicy";
import { useEffect } from "react";
import { useSRAnnounce } from "@/app/ScreenReaderProvider";

/* =========================
 * RHF Adapter Props
 * =======================*/
type RHFInputProps<T extends FieldValues> = {
    name: Path<T>;
    control: Control<T>;
    rules?: Record<string, unknown>;
    action: CanonicalAction;
    entity?: {
        type: string;
        id?: string;
        status?: string;
    };
} & Record<string, any>; // passthrough (label, placeholder, etc.)

/* =========================
 * Component
 * =======================*/
export const RHFInput = <T extends FieldValues>({
    name,
    control,
    rules,
    action,
    entity,
    ...props
}: RHFInputProps<T>) => (
    <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field, fieldState }) => {
            const announce = useSRAnnounce();
            const errorId = `${name}-error`;

            // 🔥 announce error when it appears
            useEffect(() => {
                if (fieldState.error?.message) {
                    announce(fieldState.error.message);
                }
            }, [fieldState.error?.message]);

            return (
                <div className="space-y-1">
                    <PolicyInput
                        {...field}
                        {...props}
                        action={action}
                        entityType={entity?.type}
                        entityId={entity?.id}
                        entityStatus={entity?.status}

                        // ✅ Accessibility additions
                        aria-invalid={!!fieldState.error}
                        aria-describedby={
                            fieldState.error
                                ? errorId
                                : props.helperText
                                    ? `${name}-helper`
                                    : undefined
                        }
                    />

                    {fieldState.error && (
                        <p
                            id={errorId}
                            role="alert"
                            aria-live="assertive"
                            className="text-xs text-red-500"
                        >
                            {fieldState.error.message}
                        </p>
                    )}
                </div>
            );
        }}
    />
);
