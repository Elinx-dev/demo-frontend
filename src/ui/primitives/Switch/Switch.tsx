import React, { useId, useRef, type CSSProperties } from "react";
import { useTheme } from "@/ui/theme/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "success" | "danger" | "warning";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  label?: string;
  /** Sub-label shown below the main label */
  description?: string;
  name?: string;
  error?: string;
  helperText?: string;
  /** Controlled checked state */
  checked?: boolean;
  /** Default checked (uncontrolled) */
  defaultChecked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** RHF register - passed explicitly, no context hook */
  register?: (name: string) => React.InputHTMLAttributes<HTMLInputElement> & { ref: React.Ref<HTMLInputElement> };
  size?: Size;
  /** Active track color variant */
  variant?: Variant;
  /** Custom active color (overrides variant) */
  activeColor?: string;
  disabled?: boolean;
  /** Show label on the left side of the switch */
  labelLeft?: boolean;
  /** Show loading spinner instead of knob */
  loading?: boolean;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<Size, {
  trackW: number; trackH: number;
  knobSize: number; knobOn: number; knobOff: number;
  font: number; descFont: number;
}> = {
  sm: { trackW: 32, trackH: 18, knobSize: 12, knobOn: 16, knobOff: 3, font: 12, descFont: 11 },
  md: { trackW: 44, trackH: 24, knobSize: 18, knobOn: 22, knobOff: 3, font: 14, descFont: 12 },
  lg: { trackW: 56, trackH: 30, knobSize: 22, knobOn: 30, knobOff: 4, font: 15, descFont: 13 },
};

// ─── Spinner ──────────────────────────────────────────────────────────────────

const Spinner = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    className="animate-spin" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeOpacity="0.3" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// ─── Switch ───────────────────────────────────────────────────────────────────

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      description,
      name,
      error,
      helperText,
      checked,
      defaultChecked,
      onChange,
      register,
      size = "md",
      variant = "primary",
      activeColor: activeColorProp,
      disabled = false,
      loading = false,
      labelLeft = false,
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

    // ── Sizing ────────────────────────────────────────────────────────────
    const { trackW, trackH, knobSize, knobOn, knobOff, font, descFont } = sizeMap[size];

    // ── Derive checked state ──────────────────────────────────────────────
    // For controlled mode we use `checked`, uncontrolled uses internal input state.
    // The visual track reads from the actual DOM input via internalRef when uncontrolled.
    const isChecked = checked ?? internalRef.current?.checked ?? !!defaultChecked;

    const hasError = !!error;

    // ── Track style ───────────────────────────────────────────────────────
    const trackStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      flexShrink: 0,
      width: trackW,
      height: trackH,
      borderRadius: 9999,
      border: `1.5px solid ${hasError ? dangerColor : isChecked ? accentColor : borderColor}`,
      background: isChecked
        ? (disabled ? `${accentColor}88` : accentColor)
        : (disabled ? `${borderColor}66` : borderColor),
      cursor: disabled || loading ? "not-allowed" : "pointer",
      transition: "background 0.2s, border-color 0.2s",
      position: "relative",
      boxSizing: "border-box",
      boxShadow: hasError ? `0 0 0 2px ${dangerColor}33` : "none",
      opacity: disabled ? 0.6 : 1,
    };

    // ── Knob style ────────────────────────────────────────────────────────
    const knobStyle: CSSProperties = {
      width: knobSize,
      height: knobSize,
      borderRadius: "50%",
      background: surfaceBg,
      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      transform: `translateX(${isChecked ? knobOn : knobOff}px)`,
      transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    };

    // ── Click handler - delegates to hidden input ─────────────────────────
    const handleTrackClick = () => {
      if (disabled || loading) return;
      internalRef.current?.click();
    };

    // ─────────────────────────────────────────────────────────────────────
    return (
      <div
        className={className}
        style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}
      >
        <div style={{
          display: "flex",
          alignItems: description ? "flex-start" : "center",
          gap: 10,
          flexDirection: labelLeft ? "row-reverse" : "row",
          justifyContent: labelLeft ? "flex-end" : "flex-start",
        }}>

          {/* Hidden native input - source of truth */}
          <input
            id={inputId}
            ref={mergedRef}
            type="checkbox"
            name={name}
            checked={checked}
            defaultChecked={defaultChecked}
            disabled={disabled || loading}
            onChange={onChange}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` :
                helperText ? `${inputId}-helper` : undefined
            }
            style={{
              // Visually hidden but accessible
              position: "absolute",
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: "hidden",
              clip: "rect(0,0,0,0)",
              border: 0,
            }}
            {...(rhfRest as React.InputHTMLAttributes<HTMLInputElement>)}
            {...rest}
          />

          {/* Visual track - clicking delegates to real input */}
          <div
            role="presentation"
            style={trackStyle}
            onClick={handleTrackClick}
          // Keyboard: pressing Space/Enter on the label triggers the input naturally
          >
            <span style={knobStyle}>
              {loading && (
                <Spinner
                  size={Math.round(knobSize * 0.6)}
                  color={isChecked ? accentColor : mutedColor}
                />
              )}
            </span>
          </div>

          {/* Label + description */}
          {(label || description) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {label && (
                <label
                  htmlFor={inputId}   // ✅ click focuses / toggles input
                  style={{
                    fontSize: font,
                    fontWeight: 500,
                    color: disabled ? mutedColor : textColor,
                    cursor: disabled || loading ? "not-allowed" : "pointer",
                    userSelect: "none",
                    lineHeight: 1.4,
                  }}
                >
                  {label}
                </label>
              )}
              {description && (
                <span style={{
                  fontSize: descFont,
                  color: mutedColor,
                  lineHeight: 1.4,
                }}>
                  {description}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {hasError && (
          <p id={`${inputId}-error`} role="alert"
            style={{ fontSize: font - 2, color: dangerColor, margin: 0, lineHeight: 1.4 }}>
            {error}
          </p>
        )}

        {/* Helper */}
        {!hasError && helperText && (
          <p id={`${inputId}-helper`}
            style={{ fontSize: font - 2, color: mutedColor, margin: 0, lineHeight: 1.4 }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Switch.displayName = "Switch";

//Example usage:
// Basic
{/* <Switch label="Dark mode" checked={dark} onChange={e => setDark(e.target.checked)} /> */ }

// With description
{/* <Switch
    label="Email notifications"
    description="Receive updates about your account"
    checked={notify} onChange={e => setNotify(e.target.checked)}
/> */}

// Sizes
{/* <Switch label="Small"  size="sm" checked={a} onChange={e => setA(e.target.checked)} /> */ }
{/* <Switch label="Medium" size="md" checked={b} onChange={e => setB(e.target.checked)} /> */ }
{/* <Switch label="Large"  size="lg" checked={c} onChange={e => setC(e.target.checked)} /> */ }

// Variants
{/* <Switch label="Success" variant="success" checked={v} onChange={e => setV(e.target.checked)} /> */ }
{/* <Switch label="Danger"  variant="danger"  checked={v} onChange={e => setV(e.target.checked)} /> */ }

// Label on left
{/* <Switch label="Wi-Fi" labelLeft checked={wifi} onChange={e => setWifi(e.target.checked)} /> */ }

// Loading state
{/* <Switch label="Saving..." loading checked={v} onChange={e => setV(e.target.checked)} /> */ }

// Disabled
{/* <Switch label="Unavailable" disabled checked={false} onChange={() => {}} /> */ }

// Error state
{/* <Switch label="Terms & Conditions" error="You must accept terms" checked={terms} onChange={e => setTerms(e.target.checked)} /> */ }

// With RHF
{/* <Switch label="Veg Only" name="isVeg" register={form.register} error={form.formState.errors.isVeg?.message} /> */ }