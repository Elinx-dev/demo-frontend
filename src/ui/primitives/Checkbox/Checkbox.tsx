import React, { useId, useRef, useEffect, type CSSProperties } from "react";
import { useTheme } from "@/ui/theme/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "success" | "danger" | "warning";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type" | "onChange"> {
  label?: React.ReactNode;
  /** Sub-label shown below the main label */
  description?: string;
  name?: string;
  error?: string;
  helperText?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  /** Indeterminate state - visually shows a dash (used in select-all patterns) */
  indeterminate?: boolean;
  onChange?: (checked: boolean, e: React.ChangeEvent<HTMLInputElement>) => void;
  /** RHF register - passed explicitly, no context hook */
  register?: (name: string) => React.InputHTMLAttributes<HTMLInputElement> & { ref: React.Ref<HTMLInputElement> };
  disabled?: boolean;
  size?: Size;
  variant?: Variant;
  /** Custom active color (overrides variant) */
  activeColor?: string;
  className?: string;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<Size, { box: number; font: number; descFont: number; radius: number; stroke: number }> = {
  sm: { box: 14, font: 12, descFont: 11, radius: 3, stroke: 2 },
  md: { box: 18, font: 14, descFont: 12, radius: 4, stroke: 2.5 },
  lg: { box: 22, font: 15, descFont: 13, radius: 5, stroke: 3 },
};

// ─── Checkmark SVG ────────────────────────────────────────────────────────────

const Checkmark = ({ size, stroke }: { size: number; stroke: number }) => (
  <svg
    width={size} height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    style={{ display: "block", flexShrink: 0 }}
  >
    <polyline
      points="3,8 6.5,11.5 13,4.5"
      stroke="#fff"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Indeterminate dash
const Dash = ({ size, stroke }: { size: number; stroke: number }) => (
  <svg
    width={size} height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    style={{ display: "block", flexShrink: 0 }}
  >
    <line
      x1="3.5" y1="8" x2="12.5" y2="8"
      stroke="#fff"
      strokeWidth={stroke}
      strokeLinecap="round"
    />
  </svg>
);

// ─── Checkbox ─────────────────────────────────────────────────────────────────

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
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

    // ── Indeterminate - must be set via DOM property, not attribute ────────
    useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    // ── Sizing ────────────────────────────────────────────────────────────
    const { box, font, descFont, radius, stroke } = sizeMap[size];

    // ── Derive visual state ───────────────────────────────────────────────
    const isChecked = checked ?? internalRef.current?.checked ?? !!defaultChecked;
    const isActive = isChecked || indeterminate;
    const hasError = !!error;

    // ── Box style ─────────────────────────────────────────────────────────
    const boxStyle: CSSProperties = {
      width: box,
      height: box,
      borderRadius: radius,
      border: `1.5px solid ${hasError ? dangerColor :
        isActive ? accentColor :
          borderColor
        }`,
      background: isActive
        ? (disabled ? `${accentColor}88` : accentColor)
        : (disabled ? `${borderColor}22` : surfaceBg),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
      boxShadow: hasError ? `0 0 0 2px ${dangerColor}33` : "none",
      boxSizing: "border-box" as const,
    };

    // ─────────────────────────────────────────────────────────────────────
    return (
      <div
        className={className}
        style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}
      >
        <div style={{ display: "flex", alignItems: description ? "flex-start" : "center", gap: 8 }}>

          {/* Hidden native input - source of truth for forms & a11y */}
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
              // ✅ Visually hidden but accessible (sr-only pattern)
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

          {/* Custom visual box - clicking triggers real input */}
          <div
            role="presentation"
            style={boxStyle}
            onClick={() => !disabled && internalRef.current?.click()}
            onMouseEnter={e => {
              if (!disabled && !isActive)
                (e.currentTarget as HTMLElement).style.borderColor = accentColor;
            }}
            onMouseLeave={e => {
              if (!disabled && !isActive)
                (e.currentTarget as HTMLElement).style.borderColor = hasError ? dangerColor : borderColor;
            }}
          >
            {indeterminate
              ? <Dash size={box} stroke={stroke} />
              : isChecked
                ? <Checkmark size={box} stroke={stroke} />
                : null
            }
          </div>

          {/* Label + description */}
          {(label || description) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {label && (
                <label
                  htmlFor={inputId}
                  style={{
                    fontSize: font,
                    fontWeight: 500,
                    color: disabled ? mutedColor : textColor,
                    cursor: disabled ? "not-allowed" : "pointer",
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
                  userSelect: "none",
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

Checkbox.displayName = "Checkbox";

//Example usage:
// Basic
{/* <Checkbox label="Accept Terms" checked={accept} onChange={(v) => setAccept(v)} /> */ }

// With description
{/* <Checkbox
    label="Marketing emails"
    description="Receive product updates and offers"
    checked={marketing} onChange={(v) => setMarketing(v)}
/> */}

// Sizes
{/* <Checkbox label="Small"  size="sm" checked={a} onChange={v => setA(v)} />
<Checkbox label="Medium" size="md" checked={b} onChange={v => setB(v)} /> */}
{/* <Checkbox label="Large"  size="lg" checked={c} onChange={v => setC(v)} /> */ }

// Variants
{/* <Checkbox label="Success" variant="success" checked={v} onChange={v => setV(v)} /> */ }
{/* <Checkbox label="Danger"  variant="danger"  checked={v} onChange={v => setV(v)} /> */ }

// Indeterminate (select-all pattern)
{/* <Checkbox label="Select All" indeterminate={someSelected} checked={allSelected} onChange={v => toggleAll(v)} /> */ }

// Error state
{/* <Checkbox label="I agree to terms" error="You must accept to continue" checked={terms} onChange={v => setTerms(v)} /> */ }

// Disabled
{/* <Checkbox label="Unavailable option" disabled checked={false} onChange={() => {}} /> */ }

// With RHF
{/* <Checkbox label="Veg Only" name="isVeg" register={form.register} error={form.formState.errors.isVeg?.message} /> */ }