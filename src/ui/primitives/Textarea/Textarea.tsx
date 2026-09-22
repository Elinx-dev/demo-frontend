import React, { useId, useState } from "react";
import { useTheme } from "@/ui/theme/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg";
type Variant = "outline" | "filled" | "underline" | "ghost";
type Status = "default" | "error" | "success" | "warning";
type Resize = "none" | "vertical" | "horizontal" | "both";

export interface TextareaProps
    extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
    label?: string;
    /** Used for RHF registration + label↔textarea linking */
    name?: string;
    /** Manual error message */
    error?: string;
    /** Helper text shown below (hidden when error present) */
    helperText?: string;
    /** RHF register - pass explicitly from parent, never via context hook */
    register?: (name: string) => React.TextareaHTMLAttributes<HTMLTextAreaElement> & { ref: React.Ref<HTMLTextAreaElement> };
    status?: Status;
    size?: Size;
    variant?: Variant;
    /** Resize handle behavior. Default: "vertical" */
    resize?: Resize;
    /** Show character count (requires maxLength) */
    showCount?: boolean;
    /** Auto-grow to fit content (disables fixed rows) */
    autoResize?: boolean;
    /** Min rows when autoResize is true. Default: 3 */
    minRows?: number;
    /** Max rows when autoResize is true */
    maxRows?: number;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<Size, { font: number; px: number; py: number; radius: number }> = {
    sm: { font: 12, px: 10, py: 8, radius: 6 },
    md: { font: 14, px: 14, py: 10, radius: 8 },
    lg: { font: 15, px: 16, py: 12, radius: 10 },
};

// ─── Status Icons ─────────────────────────────────────────────────────────────

const ErrorIcon = ({ size, color }: { size: number; color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const SuccessIcon = ({ size, color }: { size: number; color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="9 12 11 14 15 10" />
    </svg>
);

// ─── Textarea ─────────────────────────────────────────────────────────────────

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        {
            label,
            name,
            error,
            helperText,
            register,
            status = "default",
            size = "md",
            variant = "outline",
            resize = "vertical",
            showCount = false,
            autoResize = false,
            minRows = 3,
            maxRows,
            className = "",
            style,
            disabled = false,
            readOnly = false,
            maxLength,
            rows,
            value,
            defaultValue,
            onChange,
            onFocus,
            onBlur,
            ...rest
        },
        forwardedRef
    ) => {
        // const { theme } = useTheme();
        const c = useTheme().theme.colors;
        const inputId = useId();
        const id = name ?? inputId;

        const [focused, setFocused] = useState(false);
        const [internalValue, setInternalValue] = useState(
            typeof defaultValue === "string" ? defaultValue : ""
        );

        const isControlled = value !== undefined;
        const currentValue = isControlled ? String(value ?? "") : internalValue;
        const charCount = currentValue.length;

        // ── RHF ref merge ─────────────────────────────────────────────────────
        // ✅ register passed as prop - no useFormContext() hook violation
        const rhfProps = register && name ? register(name) : {};
        const { ref: rhfRef, ...rhfRest } = rhfProps as {
            ref?: React.Ref<HTMLTextAreaElement>;
            [k: string]: unknown;
        };

        const mergedRef = (node: HTMLTextAreaElement | null) => {
            if (typeof rhfRef === "function") rhfRef(node);
            else if (rhfRef) (rhfRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
            if (typeof forwardedRef === "function") forwardedRef(node);
            else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
            // Auto-resize on mount
            if (node && autoResize) adjustHeight(node);
        };

        // ── Auto-resize height ────────────────────────────────────────────────
        const lineHeight = sizeMap[size].font * 1.6;
        const minHeight = lineHeight * minRows;
        const maxHeight = maxRows ? lineHeight * maxRows : undefined;

        const adjustHeight = (el: HTMLTextAreaElement) => {
            el.style.height = "auto";
            const next = el.scrollHeight;
            el.style.height = maxHeight
                ? `${Math.min(next, maxHeight)}px`
                : `${next}px`;
        };

        // ── Colors ────────────────────────────────────────────────────────────
        const accentColor = c.accent ?? "#6366f1";
        const dangerColor = c.danger ?? "#ef4444";
        const successColor = c.success ?? "#22c55e";
        const warningColor = "#f59e0b";
        const borderColor = c.primaryBorder ?? "#d1d5db";
        const textColor = c.text ?? "#111827";
        const mutedColor = c.textMuted ?? "#9ca3af";
        const surfaceBg = c.surface ?? "#ffffff";
        const surfaceAlt = c.primaryLight ?? "#f9fafb";

        // ── Effective status ──────────────────────────────────────────────────
        const effectiveStatus: Status = error ? "error" : status;

        const statusColorMap: Record<Status, string> = {
            default: accentColor,
            error: dangerColor,
            success: successColor,
            warning: warningColor,
        };
        const statusBorderMap: Record<Status, string> = {
            default: borderColor,
            error: dangerColor,
            success: successColor,
            warning: warningColor,
        };

        const focusColor = statusColorMap[effectiveStatus];
        const borderVal = focused
            ? focusColor
            : statusBorderMap[effectiveStatus];

        // ── Variant styles ────────────────────────────────────────────────────
        const { font, px, py, radius } = sizeMap[size];

        const textareaStyle: React.CSSProperties = (() => {
            const base: React.CSSProperties = {
                display: "block",
                width: "100%",
                boxSizing: "border-box",
                fontFamily: "inherit",
                fontSize: font,
                lineHeight: 1.6,
                color: disabled ? mutedColor : textColor,
                padding: `${py}px ${px}px`,
                borderRadius: radius,
                outline: "none",
                resize: autoResize ? "none" : resize,
                transition: "box-shadow 0.15s, border-color 0.15s, background 0.15s",
                opacity: disabled ? 0.55 : 1,
                cursor: disabled ? "not-allowed" : readOnly ? "default" : "text",
                minHeight: autoResize ? minHeight : undefined,
                maxHeight: autoResize ? maxHeight : undefined,
                ...((!autoResize && !rows) && { minHeight: lineHeight * minRows }),
                ...style,
            };

            switch (variant) {
                case "filled":
                    return {
                        ...base,
                        background: focused ? surfaceBg : surfaceAlt,
                        border: `1.5px solid ${focused ? focusColor : "transparent"}`,
                        boxShadow: focused ? `0 0 0 3px ${focusColor}22` : "none",
                    };
                case "underline":
                    return {
                        ...base,
                        borderRadius: 0,
                        background: "transparent",
                        border: "none",
                        borderBottom: `2px solid ${borderVal}`,
                        paddingLeft: 0,
                        paddingRight: 0,
                        boxShadow: "none",
                        resize: "none",
                    };
                case "ghost":
                    return {
                        ...base,
                        background: focused ? surfaceAlt : "transparent",
                        border: "none",
                        boxShadow: "none",
                    };
                default: // outline
                    return {
                        ...base,
                        background: disabled ? surfaceAlt : surfaceBg,
                        border: `1.5px solid ${borderVal}`,
                        boxShadow: focused ? `0 0 0 3px ${focusColor}22` : "none",
                    };
            }
        })();

        // ── Handlers ──────────────────────────────────────────────────────────
        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            if (!isControlled) setInternalValue(e.target.value);
            if (autoResize) adjustHeight(e.target);
            onChange?.(e);
            (rhfRest as { onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }).onChange?.(e);
        };

        const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
            setFocused(true);
            onFocus?.(e);
        };

        const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
            setFocused(false);
            onBlur?.(e);
            (rhfRest as { onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void }).onBlur?.(e);
        };

        const hasError = !!error;
        const showHelper = !hasError && !!helperText;

        // ─────────────────────────────────────────────────────────────────────
        return (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4 }} className={className}>

                {/* Label */}
                {label && (
                    <label
                        htmlFor={id}   // ✅ links label click → textarea focus
                        style={{
                            fontSize: font - 1,
                            fontWeight: 500,
                            color: focused ? focusColor : textColor,
                            userSelect: "none",
                            transition: "color 0.15s",
                            cursor: "default",
                        }}
                    >
                        {label}
                    </label>
                )}

                {/* Textarea */}
                <div style={{ position: "relative" }}>
                    <textarea
                        id={id}
                        name={name}
                        ref={mergedRef}
                        disabled={disabled}
                        readOnly={readOnly}
                        maxLength={maxLength}
                        rows={autoResize ? undefined : rows ?? minRows}
                        value={isControlled ? value : internalValue}
                        style={textareaStyle}
                        onChange={handleChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        aria-invalid={hasError}
                        aria-describedby={
                            hasError ? `${id}-error` :
                                helperText ? `${id}-helper` : undefined
                        }
                        {...(rhfRest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                        {...rest}
                    />

                    {/* Status icon - top-right corner */}
                    {!disabled && effectiveStatus !== "default" && (
                        <span style={{
                            position: "absolute",
                            top: py,
                            right: px * 0.75,
                            pointerEvents: "none",
                        }}>
                            {effectiveStatus === "error"
                                ? <ErrorIcon size={font + 2} color={dangerColor} />
                                : effectiveStatus === "success"
                                    ? <SuccessIcon size={font + 2} color={successColor} />
                                    : null
                            }
                        </span>
                    )}
                </div>

                {/* Footer row - error/helper left, char count right */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                        {/* Error */}
                        {hasError && (
                            <p id={`${id}-error`} role="alert"
                                style={{ fontSize: font - 2, color: dangerColor, margin: 0, lineHeight: 1.4 }}>
                                {error}
                            </p>
                        )}
                        {/* Helper */}
                        {showHelper && (
                            <p id={`${id}-helper`}
                                style={{ fontSize: font - 2, color: mutedColor, margin: 0, lineHeight: 1.4 }}>
                                {helperText}
                            </p>
                        )}
                    </div>

                    {/* Char count */}
                    {showCount && maxLength && (
                        <span style={{
                            fontSize: font - 2,
                            color: charCount >= maxLength ? dangerColor : mutedColor,
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                        }}>
                            {charCount} / {maxLength}
                        </span>
                    )}
                </div>
            </div>
        );
    }
);

Textarea.displayName = "Textarea";

//example usuage:

{/* <Textarea
    label="Description"
    placeholder="Start typing - I'll grow with you..."
    value={autoGrow}
    onChange={(e) => setAutoGrow(e.target.value)}
    autoResize
    minRows={2}
    maxRows={8}
    helperText="Expands up to 8 rows"
/> */}