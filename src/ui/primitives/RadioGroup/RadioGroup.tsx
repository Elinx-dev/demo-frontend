import React, { useId, type CSSProperties } from "react";
import { useTheme } from "@/ui/theme/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "success" | "danger" | "warning";
type Direction = "vertical" | "horizontal";
type Layout = "simple" | "card";

export interface RadioOption {
    label: string;
    value: string;
    description?: string;
    icon?: React.ReactNode;
    badge?: string;
    disabled?: boolean;
}

export interface RadioGroupProps {
    options: RadioOption[];
    /** Controlled selected value */
    value?: string;
    /** Default selected value (uncontrolled) */
    defaultValue?: string;
    onChange?: (value: string, e: React.ChangeEvent<HTMLInputElement>) => void;
    /** Group label shown above */
    label?: string;
    /** name attribute shared across all radios in the group */
    name?: string;
    error?: string;
    helperText?: string;
    /** Disable all options */
    disabled?: boolean;
    size?: Size;
    variant?: Variant;
    direction?: Direction;
    /** Visual style for each option */
    layout?: Layout;
    className?: string;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<Size, {
    dot: number; ring: number; ringRadius: number;
    cardRadius: number; pad: number;
    labelFont: number; descFont: number; badgeFont: number;
    gap: number; groupGap: number; iconSize: number;
}> = {
    sm: { dot: 6, ring: 14, ringRadius: 7, cardRadius: 8, pad: 10, labelFont: 12, descFont: 11, badgeFont: 10, gap: 6, groupGap: 6, iconSize: 14 },
    md: { dot: 8, ring: 18, ringRadius: 9, cardRadius: 10, pad: 14, labelFont: 14, descFont: 12, badgeFont: 11, gap: 8, groupGap: 8, iconSize: 18 },
    lg: { dot: 10, ring: 22, ringRadius: 11, cardRadius: 12, pad: 18, labelFont: 15, descFont: 13, badgeFont: 12, gap: 10, groupGap: 10, iconSize: 22 },
};

// ─── Single Radio Option ──────────────────────────────────────────────────────

interface RadioOptionItemProps {
    option: RadioOption;
    isChecked: boolean;
    isDisabled: boolean;
    inputId: string;
    name: string;
    onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    accentColor: string;
    dangerColor: string;
    borderColor: string;
    textColor: string;
    mutedColor: string;
    surfaceBg: string;
    surfaceAlt: string;
    hasGroupError: boolean;
    size: Size;
    layout: Layout;
}

const RadioOptionItem = ({
    option, isChecked, isDisabled, inputId, name, onSelect,
    accentColor, dangerColor, borderColor, textColor, mutedColor, surfaceBg, surfaceAlt,
    hasGroupError, size, layout,
}: RadioOptionItemProps) => {
    const [hovered, setHovered] = React.useState(false);
    const { dot, ring, cardRadius, pad, labelFont, descFont, badgeFont, gap, iconSize } = sizeMap[size];

    // ── Custom radio circle ───────────────────────────────────────────────────
    const RadioCircle = (
        <div style={{
            width: ring,
            height: ring,
            borderRadius: "50%",
            flexShrink: 0,
            border: `1.5px solid ${hasGroupError ? dangerColor :
                isChecked ? accentColor :
                    isDisabled ? `${borderColor}88` :
                        hovered ? accentColor :
                            borderColor
                }`,
            background: isDisabled ? `${borderColor}22` : surfaceBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s",
            boxSizing: "border-box" as const,
            marginTop: option.description ? 2 : 0,
            boxShadow: isChecked && !isDisabled
                ? `0 0 0 3px ${accentColor}22`
                : "none",
        }}>
            {/* Inner dot - animates in when checked */}
            <div style={{
                width: isChecked ? dot : 0,
                height: isChecked ? dot : 0,
                borderRadius: "50%",
                background: isDisabled ? `${accentColor}88` : accentColor,
                transition: "width 0.15s ease, height 0.15s ease",
                flexShrink: 0,
            }} />
        </div>
    );

    // ── Wrapper style per layout ──────────────────────────────────────────────
    const wrapperStyle: CSSProperties = layout === "card" ? {
        display: "flex",
        alignItems: option.description ? "flex-start" : "center",
        gap: pad * 0.7,
        padding: pad,
        borderRadius: cardRadius,
        border: `1.5px solid ${hasGroupError ? dangerColor :
            isChecked ? accentColor :
                hovered && !isDisabled ? accentColor :
                    borderColor
            }`,
        background: isChecked
            ? `${accentColor}0a`
            : hovered && !isDisabled
                ? `${accentColor}05`
                : isDisabled ? surfaceAlt : surfaceBg,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.55 : 1,
        transition: "all 0.15s",
        boxShadow: isChecked && !isDisabled ? `0 0 0 3px ${accentColor}18` : "none",
        userSelect: "none",
        boxSizing: "border-box" as const,
    } : {
        display: "inline-flex",
        alignItems: option.description ? "flex-start" : "center",
        gap: gap,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.55 : 1,
        userSelect: "none",
        transition: "opacity 0.15s",
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Hidden native input - a11y + form submission */}
            <input
                id={inputId}
                type="radio"
                name={name}
                value={option.value}
                checked={isChecked}
                disabled={isDisabled}
                onChange={onSelect}
                aria-label={option.label}
                style={{
                    position: "absolute", width: 1, height: 1,
                    padding: 0, margin: -1, overflow: "hidden",
                    clip: "rect(0,0,0,0)", border: 0,
                }}
            />

            {/* Visual label */}
            <label
                htmlFor={inputId}
                style={wrapperStyle}
                onMouseEnter={() => !isDisabled && setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {/* Radio circle */}
                {RadioCircle}

                {/* Icon */}
                {option.icon && (
                    <span style={{
                        display: "inline-flex", alignItems: "center",
                        justifyContent: "center", flexShrink: 0,
                        width: iconSize, height: iconSize,
                        color: isChecked ? accentColor : mutedColor,
                        transition: "color 0.15s",
                    }}>
                        {option.icon}
                    </span>
                )}

                {/* Label + description */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{
                        fontSize: labelFont,
                        fontWeight: 500,
                        color: isDisabled ? mutedColor : textColor,
                        lineHeight: 1.4,
                        transition: "color 0.15s",
                    }}>
                        {option.label}
                    </span>
                    {option.description && (
                        <span style={{
                            fontSize: descFont,
                            color: isDisabled ? `${mutedColor}80` : mutedColor,
                            lineHeight: 1.4,
                        }}>
                            {option.description}
                        </span>
                    )}
                </div>

                {/* Badge */}
                {option.badge && (
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
                        {option.badge}
                    </span>
                )}
            </label>
        </div>
    );
};

// ─── RadioGroup ───────────────────────────────────────────────────────────────

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
    (
        {
            options,
            value,
            defaultValue,
            onChange,
            label,
            name,
            error,
            helperText,
            disabled = false,
            size = "md",
            variant = "primary",
            direction = "vertical",
            layout = "simple",
            className = "",
        },
        ref
    ) => {
        const { theme } = useTheme();
        const c = theme.colors;
        const groupId = useId();
        const groupName = name ?? groupId; // ✅ All radios in group share the same name

        // ── Controlled / uncontrolled ─────────────────────────────────────────
        const isControlled = value !== undefined;
        const [internal, setInternal] = React.useState<string>(defaultValue ?? "");
        const selected = isControlled ? (value ?? "") : internal;

        const handleChange = (optValue: string, e: React.ChangeEvent<HTMLInputElement>) => {
            if (!isControlled) setInternal(optValue);
            onChange?.(optValue, e);
        };

        // ── Colors ────────────────────────────────────────────────────────────
        const variantColorMap: Record<Variant, string> = {
            primary: c.accent ?? "#6366f1",
            success: c.success ?? "#22c55e",
            danger: c.danger ?? "#ef4444",
            warning: c.warning ?? "#f59e0b",
        };
        const accentColor = variantColorMap[variant];
        const dangerColor = c.danger ?? "#ef4444";
        const borderColor = c.primaryBorder ?? "#d1d5db";
        const textColor = c.text ?? "#111827";
        const mutedColor = c.textMuted ?? "#9ca3af";
        const surfaceBg = c.surface ?? "#ffffff";
        const surfaceAlt = c.primaryLight ?? "#f9fafb";

        const { labelFont, groupGap } = sizeMap[size];
        const hasError = !!error;

        // ─────────────────────────────────────────────────────────────────────
        return (
            <div
                ref={ref}
                className={className}
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
                role="radiogroup"
                aria-labelledby={label ? `${groupId}-label` : undefined}
                aria-invalid={hasError}
                aria-describedby={
                    hasError ? `${groupId}-error` :
                        helperText ? `${groupId}-helper` : undefined
                }
            >
                {/* Group label */}
                {label && (
                    <span
                        id={`${groupId}-label`}
                        style={{
                            fontSize: labelFont,
                            fontWeight: 600,
                            color: textColor,
                            userSelect: "none",
                        }}
                    >
                        {label}
                    </span>
                )}

                {/* Options list */}
                <div style={{
                    display: "flex",
                    flexDirection: direction === "horizontal" ? "row" : "column",
                    flexWrap: direction === "horizontal" ? "wrap" : "nowrap",
                    gap: groupGap,
                }}>
                    {options.map((option, idx) => {
                        const optionId = `${groupId}-option-${idx}`;
                        const isChecked = selected === option.value;
                        const isDisabled = disabled || !!option.disabled;

                        return (
                            <RadioOptionItem
                                key={option.value}
                                option={option}
                                isChecked={isChecked}
                                isDisabled={isDisabled}
                                inputId={optionId}
                                name={groupName}
                                onSelect={(e) => !isDisabled && handleChange(option.value, e)}
                                accentColor={accentColor}
                                dangerColor={dangerColor}
                                borderColor={borderColor}
                                textColor={textColor}
                                mutedColor={mutedColor}
                                surfaceBg={surfaceBg}
                                surfaceAlt={surfaceAlt}
                                hasGroupError={hasError}
                                size={size}
                                layout={layout}
                            />
                        );
                    })}
                </div>

                {/* Error */}
                {hasError && (
                    <p id={`${groupId}-error`} role="alert"
                        style={{ fontSize: labelFont - 2, color: dangerColor, margin: 0, lineHeight: 1.4 }}>
                        {error}
                    </p>
                )}

                {/* Helper */}
                {!hasError && helperText && (
                    <p id={`${groupId}-helper`}
                        style={{ fontSize: labelFont - 2, color: mutedColor, margin: 0, lineHeight: 1.4 }}>
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

RadioGroup.displayName = "RadioGroup";

// Basic example usage:
{/* <RadioGroup
    label="Diet Type"
    value={diet} onChange={(v) => setDiet(v)}
    options={[{ label: "Veg", value: "veg" }, { label: "Non Veg", value: "nonveg" }]}
/> */}

// Card layout with description + icon
{/* <RadioGroup
    label="Plan" layout="card" direction="horizontal"
    value={plan} onChange={(v) => setPlan(v)}
    options={[
        { label: "Basic",   value: "basic",   description: "Free forever",    badge: "Free" },
        { label: "Pro",     value: "pro",     description: "$29/month",        badge: "Popular" },
        { label: "Enterprise", value: "ent",  description: "Custom pricing",   disabled: true },
    ]}
/> */}

// Error state
{/* <RadioGroup
    label="Gender" error="Please select an option"
    options={[{ label: "Male", value: "m" }, { label: "Female", value: "f" }]}
    value={gender} onChange={(v) => setGender(v)}
/> */}

// Sizes & Variants
{/* <RadioGroup options={opts} value={v} onChange={setV} size="lg" variant="success" /> */ }