import React, { useId, useRef, useEffect, type CSSProperties } from "react";
import { useTheme } from "@/ui/theme/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "success" | "danger" | "warning";
type Layout = "card" | "inline" | "pill";

export interface AdvancedCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type" | "onChange"> {
  label?: React.ReactNode;
  /** Supporting text below label */
  description?: React.ReactNode;
  /** Left side icon */
  icon?: React.ReactNode;
  /** Right side badge text */
  badge?: string;
  /** Badge background color override */
  badgeColor?: string;
  name?: string;
  error?: string;
  helperText?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean, e: React.ChangeEvent<HTMLInputElement>) => void;
  /** RHF register - passed explicitly */
  register?: (name: string) => React.InputHTMLAttributes<HTMLInputElement> & { ref: React.Ref<HTMLInputElement> };
  disabled?: boolean;
  size?: Size;
  variant?: Variant;
  /** Custom active color - overrides variant */
  activeColor?: string;
  /** Visual layout style. Default: "card" */
  layout?: Layout;
  /** Place checkmark on the right side */
  checkRight?: boolean;
  /** Stretch to full width */
  fullWidth?: boolean;
  className?: string;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<Size, {
  box: number; stroke: number; radius: number;
  cardRadius: number; pad: number;
  labelFont: number; descFont: number; badgeFont: number; iconSize: number;
}> = {
  sm: { box: 14, stroke: 2, radius: 3, cardRadius: 8, pad: 10, labelFont: 12, descFont: 11, badgeFont: 10, iconSize: 16 },
  md: { box: 18, stroke: 2.5, radius: 4, cardRadius: 10, pad: 14, labelFont: 14, descFont: 12, badgeFont: 11, iconSize: 20 },
  lg: { box: 20, stroke: 3, radius: 5, cardRadius: 12, pad: 18, labelFont: 15, descFont: 13, badgeFont: 12, iconSize: 24 },
};

// ─── SVG icons ────────────────────────────────────────────────────────────────

const Checkmark = ({ size, stroke }: { size: number; stroke: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: "block" }}>
    <polyline points="3,8 6.5,11.5 13,4.5" stroke="#fff" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Dash = ({ size, stroke }: { size: number; stroke: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: "block" }}>
    <line x1="3.5" y1="8" x2="12.5" y2="8" stroke="#fff" strokeWidth={stroke} strokeLinecap="round" />
  </svg>
);

// ─── AdvancedCheckbox ─────────────────────────────────────────────────────────

export const AdvancedCheckbox = React.forwardRef<HTMLInputElement, AdvancedCheckboxProps>(
  (
    {
      label,
      description,
      icon,
      badge,
      badgeColor,
      name,
      error,
      helperText,
      checked,
      defaultChecked,
      indeterminate = false,
      onChange,
      register,
      disabled = false,
      size = "md",
      variant = "primary",
      activeColor: activeColorProp,
      layout = "card",
      checkRight = false,
      fullWidth = false,
      className = "",
      ...rest
    },
    forwardedRef
  ) => {
    const { theme } = useTheme();
    const c = theme.colors;
    const autoId = useId();
    const inputId = name ?? autoId;
    const internalRef = useRef<HTMLInputElement>(null);
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

    // ── RHF ref merge ─────────────────────────────────────────────────────
    const rhfProps = register && name ? register(name) : {};
    const { ref: rhfRef, ...rhfRest } = rhfProps as {
      ref?: React.Ref<HTMLInputElement>;
      [k: string]: unknown;
    };

    const mergedRef = (node: HTMLInputElement | null) => {
      internalRef.current = node;
      if (typeof rhfRef === "function") rhfRef(node);
      else if (rhfRef) (rhfRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
    };

    // ── Indeterminate (must be DOM property, not HTML attribute) ──────────
    useEffect(() => {
      if (internalRef.current) internalRef.current.indeterminate = indeterminate;
    }, [indeterminate]);

    // ── Sizing ────────────────────────────────────────────────────────────
    const { box, stroke, radius, cardRadius, pad, labelFont, descFont, badgeFont, iconSize } = sizeMap[size];

    // ── Derived state ─────────────────────────────────────────────────────
    const isChecked = checked ?? internalRef.current?.checked ?? !!defaultChecked;
    const isActive = isChecked || indeterminate;
    const hasError = !!error;

    // ── Reusable checkbox tick box ────────────────────────────────────────
    const CheckBox = (
      <div style={{
        width: box,
        height: box,
        borderRadius: radius,
        flexShrink: 0,
        border: `1.5px solid ${hasError ? dangerColor : isActive ? accentColor : borderColor}`,
        background: isActive
          ? (disabled ? `${accentColor}88` : accentColor)
          : (disabled ? `${borderColor}22` : surfaceBg),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s",
        boxSizing: "border-box" as const,
        marginTop: description ? 2 : 0,
      }}>
        {indeterminate
          ? <Dash size={box} stroke={stroke} />
          : isChecked
            ? <Checkmark size={box} stroke={stroke} />
            : null
        }
      </div>
    );

    // ── Layout-specific wrapper style ─────────────────────────────────────
    const wrapperStyle: CSSProperties = (() => {
      const shared: CSSProperties = {
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        userSelect: "none",
        transition: "all 0.15s",
      };

      if (layout === "pill") {
        return {
          ...shared,
          display: "inline-flex",
          alignItems: "center",
          gap: pad * 0.5,
          padding: `${pad * 0.45}px ${pad}px`,
          borderRadius: 9999,
          border: `1.5px solid ${isActive ? accentColor : hovered && !disabled ? accentColor : borderColor}`,
          background: isActive
            ? (disabled ? `${accentColor}88` : accentColor)
            : hovered && !disabled ? `${accentColor}08` : surfaceBg,
        };
      }

      if (layout === "inline") {
        return {
          ...shared,
          display: "inline-flex",
          alignItems: description ? "flex-start" : "center",
          gap: pad * 0.6,
        };
      }

      // card (default)
      return {
        ...shared,
        display: "flex",
        alignItems: description ? "flex-start" : "center",
        gap: pad * 0.75,
        padding: pad,
        borderRadius: cardRadius,
        border: `1.5px solid ${hasError ? dangerColor :
          isActive ? accentColor :
            hovered && !disabled ? accentColor :
              borderColor
          }`,
        background: isActive
          ? `${accentColor}0a`
          : hovered && !disabled
            ? `${accentColor}05`
            : disabled ? surfaceAlt : surfaceBg,
        boxShadow: isActive && !disabled
          ? `0 0 0 3px ${accentColor}18`
          : hasError
            ? `0 0 0 3px ${dangerColor}18`
            : "none",
        width: fullWidth ? "100%" : "auto",
        boxSizing: "border-box" as const,
      };
    })();

    // Pill uses white text when active
    const resolvedLabelColor =
      layout === "pill" && isActive ? "#fff" :
        disabled ? mutedColor : textColor;

    const resolvedDescColor =
      layout === "pill" && isActive ? "rgba(255,255,255,0.75)" :
        disabled ? `${mutedColor}80` : mutedColor;

    // ─────────────────────────────────────────────────────────────────────
    return (
      <div
        className={className}
        style={{ display: fullWidth ? "block" : "inline-flex", flexDirection: "column", gap: 4 }}
      >
        {/* Hidden native input - accessibility + form source of truth */}
        <input
          id={inputId}
          ref={mergedRef}
          type="checkbox"
          name={name}
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          aria-invalid={hasError}
          aria-checked={indeterminate ? "mixed" : checked}
          aria-describedby={
            hasError ? `${inputId}-error` :
              helperText ? `${inputId}-helper` : undefined
          }
          onChange={(e) => onChange?.(e.target.checked, e)}
          style={{
            position: "absolute", width: 1, height: 1,
            padding: 0, margin: -1, overflow: "hidden",
            clip: "rect(0,0,0,0)", border: 0,
          }}
          {...(rhfRest as React.InputHTMLAttributes<HTMLInputElement>)}
          {...rest}
        />

        {/* Visual card / inline / pill */}
        <label
          htmlFor={inputId}
          style={wrapperStyle}
          onMouseEnter={() => !disabled && setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Checkmark - left side (default) */}
          {!checkRight && layout !== "pill" && CheckBox}

          {/* Icon */}
          {icon && (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              width: iconSize,
              height: iconSize,
              color: layout === "pill" && isActive
                ? "rgba(255,255,255,0.9)"
                : isActive ? accentColor : mutedColor,
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
                  fontWeight: 600,
                  color: resolvedLabelColor,
                  lineHeight: 1.4,
                  transition: "color 0.15s",
                }}>
                  {label}
                </span>
              )}
              {description && layout !== "pill" && (
                <span style={{
                  fontSize: descFont,
                  color: resolvedDescColor,
                  lineHeight: 1.5,
                  transition: "color 0.15s",
                }}>
                  {description}
                </span>
              )}
            </div>
          )}

          {/* Badge */}
          {badge && layout !== "pill" && (
            <span style={{
              fontSize: badgeFont,
              fontWeight: 600,
              color: badgeColor ? "#fff" : isActive ? accentColor : mutedColor,
              background: badgeColor ?? (isActive ? `${accentColor}18` : `${borderColor}55`),
              borderRadius: 9999,
              padding: `2px ${badgeFont}px`,
              flexShrink: 0,
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}>
              {badge}
            </span>
          )}

          {/* Checkmark - right side */}
          {checkRight && layout !== "pill" && CheckBox}

          {/* Pill dot indicator */}
          {layout === "pill" && (
            <span style={{
              width: box * 0.5,
              height: box * 0.5,
              borderRadius: "50%",
              flexShrink: 0,
              background: isActive ? "rgba(255,255,255,0.8)" : borderColor,
              transition: "background 0.15s",
            }} />
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

AdvancedCheckbox.displayName = "AdvancedCheckbox";

//Exaample Usage:
// Card (default) - plan selection
{/* <AdvancedCheckbox
    label="Veg Only"
    description="Show only vegetarian meals"
    checked={isVeg} onChange={(v) => setIsVeg(v)}
/> */}

// With icon + badge
{/* <AdvancedCheckbox
    icon={<LeafIcon size={20} />}
    label="Organic"
    description="Certified organic ingredients only"
    badge="Popular"
    checked={organic} onChange={(v) => setOrganic(v)}
/> */}

// Checkmark on right
{/* <AdvancedCheckbox
    label="Pro Plan" description="$29/month"
    checkRight fullWidth
    checked={plan === "pro"} onChange={() => setPlan("pro")}
/> */}

// Pill layout
{/* <AdvancedCheckbox layout="pill" label="Spicy 🌶️" checked={spicy} onChange={(v) => setSpicy(v)} /> */ }

// Inline layout (behaves close to Checkbox but with icon/badge support)
{/* <AdvancedCheckbox layout="inline" label="Accept Terms" checked={terms} onChange={(v) => setTerms(v)} /> */ }

// Error state
{/* <AdvancedCheckbox
    label="I agree" error="You must accept to continue"
    checked={agreed} onChange={(v) => setAgreed(v)}
/> */}

// Variants
{/* <AdvancedCheckbox label="Success" variant="success" checked={v} onChange={(v) => setV(v)} /> */ }

// Sizes
{/* <AdvancedCheckbox label="Small" size="sm" checked={v} onChange={(v) => setV(v)} /> */ }
{/* <AdvancedCheckbox label="Large" size="lg" checked={v} onChange={(v) => setV(v)} description="More padding and bigger tick" /> */ }