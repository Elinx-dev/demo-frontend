import React from "react";
import { X } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";

// ── Variant covers all design-spec status states ─────────────────────────────
type Variant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "danger"
  | "info"
  | "outline"
  | "custom"
  // Design-spec status variants (use theme tokens)
  | "active"      // statusActive  green
  | "expiring"    // statusExpiring amber
  | "expired"     // statusExpired  red
  | "syncing"     // statusSyncing  blue
  | "draft";      // statusDraft    grey

type Size = "xs" | "sm" | "md" | "lg" | "xl";

interface BadgeProps {
  children?: React.ReactNode;
  variant?: Variant;
  size?: Size;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  dot?: boolean;
  count?: number;
  max?: number;
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  rounded?: string;
  className?: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  soft?: boolean;
  pulse?: boolean;
  disabled?: boolean;
  absolute?: boolean;
  position?: string;
}

const sizeStyles: Record<Size, string> = {
  xs: "text-[10px] px-[6px] py-[2px]",
  sm: "text-[11px] px-[8px] py-[2px]",
  md: "text-[12px] px-[10px] py-[4px]",
  lg: "text-[13px] px-[12px] py-[6px]",
  xl: "text-[14px] px-[16px] py-[8px]",
};

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  iconLeft,
  iconRight,
  dot = false,
  count,
  max = 99,
  removable = false,
  onRemove,
  onClick,
  rounded = "rounded-full",
  className = "",
  bgColor,
  textColor,
  borderColor,
  soft = false,
  pulse = false,
  disabled = false,
  absolute = false,
  position = "",
}) => {
  const { theme } = useTheme();
  const c = theme.colors;

  const isClickable = !!onClick;

  const displayCount =
    typeof count === "number"
      ? count > max
        ? `${max}+`
        : count
      : null;

  // ── Variant → bg/text/border resolution ─────────────────────────────────
  // All semantic variants now use theme tokens, not hardcoded hex
  const variantMap: Record<Variant, { bg: string; text: string; border: string }> = {
    default:  { bg: c.primaryLight,  text: c.text,        border: "transparent" },
    success:  { bg: c.successBg,     text: c.successText,  border: "transparent" },
    warning:  { bg: c.warningBg,     text: c.warningText,  border: "transparent" },
    error:    { bg: c.dangerBg,      text: c.dangerText,   border: "transparent" },
    danger:   { bg: c.dangerBg,      text: c.dangerText,   border: "transparent" },
    info:     { bg: c.infoBg,        text: c.infoText,     border: "transparent" },
    outline:  { bg: "transparent",   text: c.text,         border: c.primaryBorder },
    // Status-specific - use dot-level status colors as text, pale bg
    active:   { bg: "#EEF6E2",       text: c.statusActive,   border: "transparent" },
    expiring: { bg: c.warningBg,     text: c.statusExpiring, border: "transparent" },
    expired:  { bg: c.dangerBg,      text: c.statusExpired,  border: "transparent" },
    syncing:  { bg: c.infoBg,        text: c.statusSyncing,  border: "transparent" },
    draft:    { bg: c.primaryLight,  text: c.textMuted,      border: "transparent" },
    custom:   { bg: bgColor ?? c.surface, text: textColor ?? c.text, border: borderColor ?? c.primaryBorder },
  };

  const resolved = variantMap[variant];

  const themeStyles: React.CSSProperties = {
    backgroundColor: resolved.bg,
    color: resolved.text,
    borderColor: resolved.border,
    borderWidth: resolved.border !== "transparent" ? 1 : 0,
    borderStyle: "solid",
    fontFamily: "var(--ipc-font-sans)",
    fontWeight: 500,
    letterSpacing: "0.01em",
  };

  return (
    <span
      onClick={disabled ? undefined : onClick}
      style={themeStyles}
      className={`
        inline-flex items-center gap-1
        ${sizeStyles[size]}
        ${rounded}
        ${soft ? "opacity-80" : ""}
        ${pulse ? "animate-pulse" : ""}
        ${isClickable && !disabled ? "cursor-pointer hover:opacity-90 transition-opacity duration-[120ms]" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${absolute ? `absolute ${position}` : ""}
        ${className}
      `.trim()}
    >
      {/* Status dot */}
      {dot && (
        <span
          style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", flexShrink: 0 }}
        />
      )}

      {iconLeft && iconLeft}

      {displayCount ?? children}

      {iconRight && iconRight}

      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          style={{
            marginLeft: 2,
            display: "inline-flex",
            alignItems: "center",
            opacity: 0.7,
            cursor: "pointer",
            background: "none",
            border: "none",
            padding: 0,
            color: "currentColor",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
        >
          <X size={10} />
        </button>
      )}
    </span>
  );
};

export default Badge;

