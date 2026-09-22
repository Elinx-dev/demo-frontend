import React, { useId, type CSSProperties } from "react";
import { useTheme } from "@/ui/theme/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "success" | "danger" | "warning";

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type" | "onChange"> {
    label?: React.ReactNode;
    description?: string;
    icon?: React.ReactNode;
    badge?: string;
    name?: string;
    value?: string;
    checked?: boolean;
    defaultChecked?: boolean;
    onChange?: (value: string, e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    helperText?: string;
    disabled?: boolean;
    size?: Size;
    variant?: Variant;
    /** Custom active color - overrides variant */
    activeColor?: string;
    /** card = bordered selectable card, simple = plain radio + label */
    layout?: "simple" | "card";
    className?: string;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<Size, {
    dot: number; ring: number;
    cardRadius: number; pad: number;
    labelFont: number; descFont: number; badgeFont: number;
    gap: number; iconSize: number;
}> = {
    sm: { dot: 6, ring: 14, cardRadius: 8, pad: 10, labelFont: 12, descFont: 11, badgeFont: 10, gap: 6, iconSize: 14 },
    md: { dot: 8, ring: 18, cardRadius: 10, pad: 14, labelFont: 14, descFont: 12, badgeFont: 11, gap: 8, iconSize: 18 },
    lg: { dot: 10, ring: 22, cardRadius: 12, pad: 18, labelFont: 15, descFont: 13, badgeFont: 12, gap: 10, iconSize: 22 },
};

// ─── Radio ────────────────────────────────────────────────────────────────────

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
    (
        {
            label,
            description,
            icon,
            badge,
            name,
            value,
            checked,
            defaultChecked,
            onChange,
            error,
            helperText,
            disabled = false,
            size = "md",
            variant = "primary",
            activeColor: activeColorProp,
            layout = "simple",
            className = "",
            ...rest
        },
        forwardedRef
    ) => {
        const { theme } = useTheme();
        const c = theme.colors;
        const autoId = useId();
        const inputId = (value ?? "") + autoId;

        const [hovered, setHovered] = React.useState(false);

        // ── Colors ────────────────────────────────────────────────────────────
        const variantColorMap: Record<Variant, string> = {
            primary: c.accent ?? "#6366f1",
            success: c.success ?? "#22c55e",
            danger: c.danger ?? "#ef4444",
            warning: c.warning ?? "#f59e0b",
        };
        const accentColor = activeColorProp ?? variantColorMap[variant];
        const dangerColor = c.danger ?? "#ef4444";
        const borderColor = c.primaryBorder ?? "#d1d5db";
        const textColor = c.text ?? "#111827";
        const mutedColor = c.textMuted ?? "#9ca3af";
        const surfaceBg = c.surface ?? "#ffffff";
        const surfaceAlt = c.primaryLight ?? "#f9fafb";

        const { dot, ring, cardRadius, pad, labelFont, descFont, badgeFont, gap, iconSize } = sizeMap[size];

        const hasError = !!error;
        // For display - in RadioGroup, checked comes from parent comparison.
        // Standalone: use checked / defaultChecked directly.
        const isChecked = checked ?? false;

        // ── Custom radio circle ───────────────────────────────────────────────
        const RadioCircle = (
            <div style={{
                width: ring,
                height: ring,
                borderRadius: "50%",
                flexShrink: 0,
                border: `1.5px solid ${hasError ? dangerColor :
                    isChecked ? accentColor :
                        disabled ? `${borderColor}88` :
                            hovered ? accentColor :
                                borderColor
                    }`,
                background: disabled ? `${borderColor}22` : surfaceBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
                boxSizing: "border-box" as const,
                marginTop: description ? 2 : 0,
                boxShadow: isChecked && !disabled
                    ? `0 0 0 3px ${accentColor}22`
                    : hasError
                        ? `0 0 0 2px ${dangerColor}33`
                        : "none",
            }}>
                {/* Animated inner dot */}
                <div style={{
                    width: isChecked ? dot : 0,
                    height: isChecked ? dot : 0,
                    borderRadius: "50%",
                    background: disabled ? `${accentColor}77` : accentColor,
                    transition: "width 0.15s ease, height 0.15s ease",
                    flexShrink: 0,
                }} />
            </div>
        );

        // ── Wrapper style ─────────────────────────────────────────────────────
        const wrapperStyle: CSSProperties = layout === "card" ? {
            display: "flex",
            alignItems: description ? "flex-start" : "center",
            gap: pad * 0.7,
            padding: pad,
            borderRadius: cardRadius,
            border: `1.5px solid ${hasError ? dangerColor :
                isChecked ? accentColor :
                    hovered && !disabled ? accentColor :
                        borderColor
                }`,
            background: isChecked
                ? `${accentColor}0a`
                : hovered && !disabled
                    ? `${accentColor}05`
                    : disabled ? surfaceAlt : surfaceBg,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.55 : 1,
            transition: "all 0.15s",
            boxShadow: isChecked && !disabled
                ? `0 0 0 3px ${accentColor}18`
                : hasError
                    ? `0 0 0 3px ${dangerColor}18`
                    : "none",
            userSelect: "none",
            boxSizing: "border-box" as const,
        } : {
            display: "inline-flex",
            alignItems: description ? "flex-start" : "center",
            gap: gap,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.55 : 1,
            userSelect: "none",
            transition: "opacity 0.15s",
        };

        // ─────────────────────────────────────────────────────────────────────
        return (
            <div
                className={className}
                style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}
            >
                {/* Hidden native input - a11y + form submission */}
                <input
                    id={inputId}
                    ref={forwardedRef}
                    type="radio"
                    name={name}
                    value={value}
                    checked={checked}
                    defaultChecked={defaultChecked}
                    disabled={disabled}
                    aria-invalid={hasError}
                    aria-describedby={
                        hasError ? `${inputId}-error` :
                            helperText ? `${inputId}-helper` : undefined
                    }
                    onChange={(e) => onChange?.(e.target.value, e)}
                    style={{
                        position: "absolute", width: 1, height: 1,
                        padding: 0, margin: -1, overflow: "hidden",
                        clip: "rect(0,0,0,0)", border: 0,
                    }}
                    {...rest}
                />

                {/* Visual label */}
                <label
                    htmlFor={inputId}
                    style={wrapperStyle}
                    onMouseEnter={() => !disabled && setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                >
                    {/* Radio circle */}
                    {RadioCircle}

                    {/* Icon */}
                    {icon && (
                        <span style={{
                            display: "inline-flex", alignItems: "center",
                            justifyContent: "center", flexShrink: 0,
                            width: iconSize, height: iconSize,
                            color: isChecked ? accentColor : mutedColor,
                            transition: "color 0.15s",
                        }}>
                            {icon}
                        </span>
                    )}

                    {/* Label + description */}
                    {(label || description) && (
                        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                            {label && (
                                <span style={{
                                    fontSize: labelFont,
                                    fontWeight: 500,
                                    color: disabled ? mutedColor : textColor,
                                    lineHeight: 1.4,
                                    transition: "color 0.15s",
                                }}>
                                    {label}
                                </span>
                            )}
                            {description && (
                                <span style={{
                                    fontSize: descFont,
                                    color: disabled ? `${mutedColor}80` : mutedColor,
                                    lineHeight: 1.4,
                                }}>
                                    {description}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Badge */}
                    {badge && (
                        <span style={{
                            fontSize: badgeFont,
                            fontWeight: 600,
                            color: isChecked ? accentColor : mutedColor,
                            background: isChecked ? `${accentColor}18` : `${borderColor}55`,
                            borderRadius: 9999,
                            padding: `2px ${badgeFont}px`,
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                            transition: "all 0.15s",
                        }}>
                            {badge}
                        </span>
                    )}
                </label>

                {/* Error */}
                {hasError && (
                    <p id={`${inputId}-error`} role="alert"
                        style={{ fontSize: labelFont - 2, color: dangerColor, margin: 0, lineHeight: 1.4 }}>
                        {error}
                    </p>
                )}

                {/* Helper */}
                {!hasError && helperText && (
                    <p id={`${inputId}-helper`}
                        style={{ fontSize: labelFont - 2, color: mutedColor, margin: 0, lineHeight: 1.4 }}>
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Radio.displayName = "Radio";


// Example usuage:
// Standalone (controlled externally - e.g. inside RadioGroup)
{/* <Radio name="diet" value="veg"    label="Vegetarian"   checked={diet === "veg"}    onChange={(v) => setDiet(v)} /> */ }
{/* <Radio name="diet" value="nonveg" label="Non Vegetarian" checked={diet === "nonveg"} onChange={(v) => setDiet(v)} /> */ }

// With description + icon
{/* <Radio
    name="plan" value="pro"
    label="Pro Plan"
    description="$29/month - unlimited access"
    badge="Popular"
    icon={<StarIcon size={18} />}
    checked={plan === "pro"}
    onChange={(v) => setPlan(v)}
    layout="card"
/> */}

// Sizes & Variants
{/* <Radio name="r" value="a" label="Small"   size="sm" checked onChange={() => {}} /> */ }
{/* <Radio name="r" value="b" label="Success" variant="success" checked onChange={() => {}} /> */ }

// Error state
{/* <Radio name="terms" value="yes" label="I agree" error="Required" checked={agreed} onChange={(v) => setAgreed(!!v)} /> */ }

// Use RadioGroup for a group (builds on Radio internally)
{/* <RadioGroup
    name="diet" label="Diet Type"
    value={diet} onChange={(v) => setDiet(v)}
    options={[
        { label: "Veg",     value: "veg" },
        { label: "Non Veg", value: "nonveg" },
    ]}
/> */}