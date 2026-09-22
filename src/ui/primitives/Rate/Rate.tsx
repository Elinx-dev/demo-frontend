import {
    useState,
    useRef,
    useCallback,
    type CSSProperties,
    type KeyboardEvent,
} from "react";
import { useTheme } from "../../theme/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Variant = "star" | "heart" | "circle" | "thumb" | "custom";
type Direction = "ltr" | "rtl";

export interface RateProps {
    /** Total number of rating items. Default: 5 */
    count?: number;
    /** Current value (controlled) */
    value?: number;
    /** Default value (uncontrolled) */
    defaultValue?: number;
    /** Callback when value changes */
    onChange?: (value: number) => void;
    /** Callback when hovering over an item */
    onHoverChange?: (value: number | null) => void;
    /** Allow half-step ratings */
    allowHalf?: boolean;
    /** Allow clicking the same value to clear (reset to 0) */
    allowClear?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Read-only - shows value but no interaction */
    readOnly?: boolean;
    /** Icon size */
    size?: Size;
    /** Icon shape variant */
    variant?: Variant;
    /** Active (filled) color - defaults to theme accent */
    activeColor?: string;
    /** Inactive color - defaults to theme border color */
    inactiveColor?: string;
    /** Custom icon renderer - receives { filled, half, index } */
    renderIcon?: (props: {
        filled: boolean;
        half: boolean;
        index: number;
        active: boolean;
    }) => React.ReactNode;
    /** Tooltip labels per index, e.g. ["Poor","Fair","Good","Great","Excellent"] */
    tooltips?: string[];
    /** Show numeric value label next to the icons */
    showValue?: boolean;
    /** Character to display (for variant="custom" text chars) */
    character?: string;
    /** Reading direction */
    direction?: Direction;
    /** Additional class on the root wrapper */
    className?: string;
    /** Accessible label for the group */
    label?: string;
}

// ─── Size Map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<Size, { px: number; gap: number; font: number }> = {
    xs: { px: 14, gap: 2, font: 11 },
    sm: { px: 18, gap: 3, font: 12 },
    md: { px: 24, gap: 4, font: 13 },
    lg: { px: 32, gap: 6, font: 15 },
    xl: { px: 44, gap: 8, font: 17 },
};

// ─── SVG Icons (pure inline - zero deps) ──────────────────────────────────────

const StarIcon = ({ filled, half, size, activeColor, inactiveColor }: {
    filled: boolean; half: boolean; size: number;
    activeColor: string; inactiveColor: string;
}) => (
    <svg
        width={size} height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ display: "block", flexShrink: 0 }}
    >
        {/* Gradient def for half fill */}
        <defs>
            <linearGradient id={`half-star-${size}`} x1="0" x2="1" y1="0" y2="0">
                <stop offset="50%" stopColor={activeColor} />
                <stop offset="50%" stopColor={inactiveColor} />
            </linearGradient>
        </defs>
        <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill={
                filled ? activeColor
                    : half ? `url(#half-star-${size})`
                        : inactiveColor
            }
            stroke={filled || half ? activeColor : inactiveColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const HeartIcon = ({ filled, half, size, activeColor, inactiveColor }: {
    filled: boolean; half: boolean; size: number;
    activeColor: string; inactiveColor: string;
}) => (
    <svg
        width={size} height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ display: "block", flexShrink: 0 }}
    >
        <defs>
            <linearGradient id={`half-heart-${size}`} x1="0" x2="1" y1="0" y2="0">
                <stop offset="50%" stopColor={activeColor} />
                <stop offset="50%" stopColor={inactiveColor} />
            </linearGradient>
        </defs>
        <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            fill={
                filled ? activeColor
                    : half ? `url(#half-heart-${size})`
                        : inactiveColor
            }
            stroke={filled || half ? activeColor : inactiveColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const CircleIcon = ({ filled, half, size, activeColor, inactiveColor }: {
    filled: boolean; half: boolean; size: number;
    activeColor: string; inactiveColor: string;
}) => (
    <svg
        width={size} height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ display: "block", flexShrink: 0 }}
    >
        <defs>
            <linearGradient id={`half-circle-${size}`} x1="0" x2="1" y1="0" y2="0">
                <stop offset="50%" stopColor={activeColor} />
                <stop offset="50%" stopColor={inactiveColor} />
            </linearGradient>
        </defs>
        <circle
            cx="12" cy="12" r="9"
            fill={
                filled ? activeColor
                    : half ? `url(#half-circle-${size})`
                        : inactiveColor
            }
            stroke={filled || half ? activeColor : inactiveColor}
            strokeWidth="1.5"
        />
    </svg>
);

const ThumbIcon = ({ filled, size, activeColor, inactiveColor }: {
    filled: boolean; half: boolean; size: number;
    activeColor: string; inactiveColor: string;
}) => (
    <svg
        width={size} height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ display: "block", flexShrink: 0 }}
    >
        <path
            d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"
            fill={filled ? activeColor : inactiveColor}
            stroke={filled ? activeColor : inactiveColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
            fill={filled ? activeColor : inactiveColor}
            stroke={filled ? activeColor : inactiveColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

// ─── Helper ───────────────────────────────────────────────────────────────────

// function cx(...parts: (string | undefined | false | null)[]): string {
//     return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
// }

// ─── Rate Component ───────────────────────────────────────────────────────────

export const Rate = ({
    count = 5,
    value,
    defaultValue = 0,
    onChange,
    onHoverChange,
    allowHalf = false,
    allowClear = true,
    disabled = false,
    readOnly = false,
    size = "md",
    variant = "star",
    activeColor,
    inactiveColor,
    renderIcon,
    tooltips,
    showValue = false,
    character,
    direction = "ltr",
    className = "",
    label = "Rating",
}: RateProps) => {
    const { theme } = useTheme();
    const c = theme.colors;

    // ── Resolved colors ───────────────────────────────────────────────────────
    const resolvedActive = activeColor ?? c.accent ?? "#f59e0b";
    const resolvedInactive = inactiveColor ?? c.primaryBorder ?? "#d1d5db";

    // ── State ─────────────────────────────────────────────────────────────────
    const isControlled = value !== undefined;
    const [internal, setInternal] = useState<number>(defaultValue);
    const current = isControlled ? (value ?? 0) : internal;

    const [hovered, setHovered] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Displayed value: hovered takes visual priority
    const displayValue = hovered ?? current;

    // ── Interaction helpers ───────────────────────────────────────────────────
    const isInteractive = !disabled && !readOnly;

    const getValueFromEvent = useCallback(
        (index: number, isHalfEvent: boolean): number => {
            if (allowHalf && isHalfEvent) return index + 0.5;
            return index + 1;
        },
        [allowHalf]
    );

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLSpanElement>, index: number) => {
            if (!isInteractive) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const isHalf = allowHalf && (e.clientX - rect.left) < rect.width / 2;
            const val = getValueFromEvent(index, isHalf);
            setHovered(val);
            onHoverChange?.(val);
        },
        [isInteractive, allowHalf, getValueFromEvent, onHoverChange]
    );

    const handleMouseLeave = useCallback(() => {
        if (!isInteractive) return;
        setHovered(null);
        onHoverChange?.(null);
    }, [isInteractive, onHoverChange]);

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLSpanElement>, index: number) => {
            if (!isInteractive) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const isHalf = allowHalf && (e.clientX - rect.left) < rect.width / 2;
            const newVal = getValueFromEvent(index, isHalf);
            // Clear if clicking same value
            const finalVal = allowClear && newVal === current ? 0 : newVal;
            if (!isControlled) setInternal(finalVal);
            onChange?.(finalVal);
        },
        [isInteractive, allowHalf, allowClear, current, isControlled, getValueFromEvent, onChange]
    );

    // ── Keyboard support ──────────────────────────────────────────────────────
    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLDivElement>) => {
            if (!isInteractive) return;
            const step = allowHalf ? 0.5 : 1;
            let next = current;

            if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                e.preventDefault();
                next = Math.min(count, current + step);
            } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                e.preventDefault();
                next = Math.max(0, current - step);
            } else if (e.key === "Home") {
                e.preventDefault();
                next = 0;
            } else if (e.key === "End") {
                e.preventDefault();
                next = count;
            } else {
                return;
            }

            if (!isControlled) setInternal(next);
            onChange?.(next);
        },
        [isInteractive, allowHalf, current, count, isControlled, onChange]
    );

    // ── Icon renderer ─────────────────────────────────────────────────────────
    const { px: iconSize, gap, font: fontSize } = sizeMap[size];

    const renderItem = (index: number) => {
        const filled = displayValue >= index + 1;
        const half = !filled && allowHalf && displayValue >= index + 0.5;
        const active = hovered !== null
            ? (direction === "ltr" ? index < hovered : index >= count - hovered)
            : filled || half;

        if (renderIcon) {
            return renderIcon({ filled, half, index, active });
        }

        if (variant === "custom" && character) {
            return (
                <span
                    style={{
                        fontSize: iconSize,
                        color: filled || half ? resolvedActive : resolvedInactive,
                        lineHeight: 1,
                        display: "block",
                        transition: "color 0.15s",
                    }}
                >
                    {character}
                </span>
            );
        }

        const iconProps = {
            filled,
            half,
            size: iconSize,
            activeColor: resolvedActive,
            inactiveColor: resolvedInactive,
        };

        switch (variant) {
            case "heart": return <HeartIcon  {...iconProps} />;
            case "circle": return <CircleIcon {...iconProps} />;
            case "thumb": return <ThumbIcon  {...iconProps} />;
            default: return <StarIcon   {...iconProps} />;
        }
    };

    // ── Styles ────────────────────────────────────────────────────────────────
    const containerStyle: CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        gap: `${gap * 2}px`,
        flexDirection: direction === "rtl" ? "row-reverse" : "row",
        outline: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
    };

    const itemStyle = (index: number): CSSProperties => {
        const filled = displayValue >= index + 1;
        const half = !filled && allowHalf && displayValue >= index + 0.5;

        return {
            display: "inline-flex",
            alignItems: "center",
            cursor: disabled ? "not-allowed"
                : readOnly ? "default"
                    : "pointer",
            opacity: disabled ? 0.5 : 1,
            transition: "transform 0.12s ease, filter 0.12s ease",
            transform:
                !disabled && !readOnly && hovered !== null &&
                    (hovered >= index + 1 || (allowHalf && hovered >= index + 0.5))
                    ? "scale(1.18)"
                    : "scale(1)",
            filter:
                filled || half
                    ? "drop-shadow(0 1px 2px rgba(0,0,0,0.15))"
                    : "none",
        };
    };

    // ── Tooltip label ─────────────────────────────────────────────────────────
    const tooltipIndex = hovered !== null
        ? Math.ceil(hovered) - 1
        : Math.ceil(current) - 1;

    const activeTooltip =
        tooltips && tooltipIndex >= 0 ? tooltips[tooltipIndex] : undefined;

    // ── Value label ───────────────────────────────────────────────────────────
    const valueLabel = displayValue > 0 ? displayValue : null;

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <span
            style={{ display: "inline-flex", alignItems: "center", gap: `${gap * 2}px` }}
            className={className}
        >
            <div
                ref={containerRef}
                role="slider"
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={count}
                aria-valuenow={current}
                aria-valuetext={activeTooltip ?? String(current)}
                aria-disabled={disabled}
                aria-readonly={readOnly}
                tabIndex={isInteractive ? 0 : -1}
                style={containerStyle}
                onMouseLeave={handleMouseLeave}
                onKeyDown={handleKeyDown}
            >
                {Array.from({ length: count }, (_, i) => (
                    <span
                        key={i}
                        title={tooltips?.[i]}
                        style={itemStyle(i)}
                        onMouseMove={(e) => handleMouseMove(e, i)}
                        onClick={(e) => handleClick(e, i)}
                    >
                        {renderItem(i)}
                    </span>
                ))}
            </div>

            {/* Tooltip label */}
            {activeTooltip && (
                <span
                    style={{
                        fontSize: fontSize,
                        color: resolvedActive,
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        transition: "opacity 0.15s",
                        pointerEvents: "none",
                    }}
                >
                    {activeTooltip}
                </span>
            )}

            {/* Numeric value label */}
            {showValue && !activeTooltip && valueLabel !== null && (
                <span
                    style={{
                        fontSize: fontSize,
                        color: resolvedActive,
                        fontWeight: 600,
                        pointerEvents: "none",
                        minWidth: "2ch",
                    }}
                >
                    {valueLabel}
                </span>
            )}
        </span>
    );
};


//Example usage:
// Basic star rating
{/* <Rate defaultValue={3} onChange={(val) => console.log(val)} /> */ }

// Controlled half-star with tooltips
{/* <Rate
    value={rating} onChange={setRating}
    allowHalf
    tooltips={["Terrible", "Bad", "Okay", "Good", "Amazing"]}
/> */}

// Heart variant, large, read-only
{/* <Rate value={4} variant="heart" size="lg" readOnly /> */ }

// Emoji characters
{/* <Rate defaultValue={3} variant="custom" character="🔥" size="lg" /> */ }

// Custom icon renderer
{/* <Rate
    defaultValue={2}
    renderIcon={({ filled }) => (
        <DiamondIcon color={filled ? "#a855f7" : "#e5e7eb"} size={24} />
    )}
/> */}

// Show numeric value label
{/* <Rate defaultValue={4.5} allowHalf showValue size="sm" /> */ }

// Theme color override
{/* <Rate defaultValue={3} activeColor="#ef4444" inactiveColor="#fecaca" /> */ }