import type { CSSProperties, ButtonHTMLAttributes, ReactNode } from "react";
import { useTheme } from "../../theme/ThemeContext";

type Variant = "primary" | "secondary" | "outline" | "danger" | "success" | "ghost";
type Size = "xs" | "sm" | "md" | "lg";
type Shape = "circle" | "rounded" | "square";

export interface ActionIconButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** The icon to render inside the button (any ReactNode - SVG, component, etc.) */
    icon: ReactNode;
    variant?: Variant;
    size?: Size;
    shape?: Shape;
    /** Tooltip / accessible label - always required for icon-only buttons */
    label: string;
    /** If true, shows a loading spinner instead of the icon */
    loading?: boolean;
    /** Shown in title when disabled */
    reason?: string;
    /** Show a small badge dot (e.g. notification indicator) */
    badge?: boolean;
    /** Badge color override */
    badgeColor?: string;
}

const sizeMap: Record<Size, { box: string; icon: string; text: string }> = {
    xs: { box: "w-6 h-6", icon: "w-3 h-3", text: "text-xs" },
    sm: { box: "w-8 h-8", icon: "w-4 h-4", text: "text-sm" },
    md: { box: "w-10 h-10", icon: "w-5 h-5", text: "text-base" },
    lg: { box: "w-12 h-12", icon: "w-6 h-6", text: "text-lg" },
};

const shapeMap: Record<Shape, string> = {
    circle: "rounded-full",
    rounded: "rounded-lg",
    square: "rounded-none",
};

/** Minimal CSS spinner, no external deps */
const Spinner = ({ size }: { size: string }) => (
    <svg
        className={`animate-spin ${size}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
    >
        <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor"
            strokeWidth="4"
        />
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
    </svg>
);

export const ActionIconButton = ({
    icon,
    variant = "primary",
    size = "md",
    shape = "circle",
    label,
    loading = false,
    disabled,
    reason,
    badge = false,
    badgeColor,
    style,
    className,
    ...rest
}: ActionIconButtonProps) => {
    const { theme } = useTheme();
    const c = theme.colors;

    // ── inline styles (theme-driven, mirrors Button logic) ──────────────────
    const styles: CSSProperties = className ? {} : {
        background:
            variant === "primary"
                ? `linear-gradient(135deg, ${c.primaryDark}, ${c.accent})`
                : variant === "danger"
                    ? `linear-gradient(135deg, ${c.danger}, #f87171)`
                    : variant === "success"
                        ? `linear-gradient(135deg, ${c.success}, #4ade80)`
                        : variant === "outline" || variant === "ghost"
                            ? "transparent"
                            : c.primaryLight,

        color:
            variant === "outline" || variant === "ghost"
                ? c.primary
                : "#ffffff",

        border:
            variant === "outline"
                ? `1px solid ${c.primaryBorder}`
                : "none",

        flexShrink: 0,
    };

    const { box, icon: iconSize, text } = sizeMap[size];

    return (
        // Wrapper keeps badge positioning in the normal flow
        <span className="relative inline-flex items-center justify-center">
            <button
                {...rest}
                disabled={disabled || loading}
                title={disabled ? (reason ?? label) : label}
                aria-label={label}
                aria-busy={loading}
                style={{ ...styles, ...style }}
                className={`
                    relative inline-flex items-center justify-center
                    font-medium shadow-sm
                    transition-all duration-200
                    hover:shadow-md hover:brightness-110
                    active:scale-95
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
                    ${box} ${text} ${shapeMap[shape]} ${className}
                `}
            >
                {loading ? <Spinner size={iconSize} /> : (
                    <span className={`${iconSize} flex items-center justify-center`} aria-hidden="true">
                        {icon}
                    </span>
                )}
            </button>

            {/* Badge dot */}
            {badge && !loading && (
                <span
                    aria-hidden="true"
                    style={{ background: badgeColor ?? c.danger }}
                    className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white"
                />
            )}
        </span>
    );
};

// Usage example:
// <ActionIconButton icon={<TrashIcon />} label="Delete item" variant="danger" />