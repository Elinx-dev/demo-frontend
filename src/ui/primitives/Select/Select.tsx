import React, { useId, useState, useEffect, type CSSProperties } from "react";
import { useTheme } from "@/ui/theme/ThemeContext";
import { useSRAnnounce } from "@/app/ScreenReaderProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg";
type Variant = "outline" | "filled" | "underline" | "ghost";
type Status = "default" | "error" | "success" | "warning";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectGroup {
  groupLabel: string;
  options: SelectOption[];
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  name?: string;
  /** Flat options list */
  options?: SelectOption[];
  /** Grouped options - use instead of options for optgroup support */
  groups?: SelectGroup[];
  placeholder?: string;
  error?: string;
  helperText?: string;
  status?: Status;
  size?: Size;
  variant?: Variant;
  /** RHF register - passed explicitly, no context hook */
  register?: (name: string) => React.SelectHTMLAttributes<HTMLSelectElement> & { ref: React.Ref<HTMLSelectElement> };
  disabled?: boolean;
  className?: string;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<Size, { h: number; font: number; px: number; py: number; radius: number; iconSize: number }> = {
  sm: { h: 32, font: 12, px: 10, py: 6, radius: 6, iconSize: 14 },
  md: { h: 40, font: 14, px: 14, py: 10, radius: 8, iconSize: 16 },
  lg: { h: 48, font: 15, px: 16, py: 12, radius: 10, iconSize: 18 },
};

// ─── Chevron icon ─────────────────────────────────────────────────────────────

const ChevronDown = ({ size, color }: { size: number; color: string }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" style={{ flexShrink: 0, pointerEvents: "none" }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─── Status Icons ─────────────────────────────────────────────────────────────

const ErrorIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const SuccessIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
  </svg>
);

// ─── Select ───────────────────────────────────────────────────────────────────

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      name,
      options = [],
      groups,
      placeholder,
      error,
      helperText,
      status = "default",
      size = "md",
      variant = "outline",
      register,
      disabled = false,
      className = "",
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      style,
      required,
      ...rest
    },
    forwardedRef
  ) => {
    const { theme } = useTheme();
    const announce = useSRAnnounce();
    const c = theme.colors;
    const autoId = useId();
    const id = name ?? autoId;

    const [focused, setFocused] = useState(false);

    // ── RHF ref merge ─────────────────────────────────────────────────────
    const rhfProps = register && name ? register(name) : {};
    const { ref: rhfRef, ...rhfRest } = rhfProps as {
      ref?: React.Ref<HTMLSelectElement>;
      [k: string]: unknown;
    };

    const mergedRef = (node: HTMLSelectElement | null) => {
      if (typeof rhfRef === "function") rhfRef(node);
      else if (rhfRef) (rhfRef as React.MutableRefObject<HTMLSelectElement | null>).current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLSelectElement | null>).current = node;
    };
    const hasError = !!error;

    // 🔥 Announce error
    useEffect(() => {
      if (error) announce(error);
    }, [error]);

    // 🔥 Announce success
    useEffect(() => {
      if (status === "success") {
        announce("Selection accepted");
      }
    }, [status]);
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
    const borderVal = focused ? focusColor : statusBorderMap[effectiveStatus];

    // ── Sizing ────────────────────────────────────────────────────────────
    const { h, font, px, py, radius, iconSize } = sizeMap[size];

    // ── Wrapper style (variant-driven, same as Input) ─────────────────────
    const wrapperStyle: CSSProperties = (() => {
      const base: CSSProperties = {
        position: "relative",
        display: "flex",
        alignItems: "center",
        width: "100%",
        boxSizing: "border-box",
        borderRadius: radius,
        transition: "box-shadow 0.15s, border-color 0.15s, background 0.15s",
        opacity: disabled ? 0.55 : 1,
      };
      switch (variant) {
        case "filled":
          return { ...base, background: focused ? surfaceBg : surfaceAlt, border: `1.5px solid ${focused ? focusColor : "transparent"}`, boxShadow: focused ? `0 0 0 3px ${focusColor}22` : "none" };
        case "underline":
          return { ...base, borderRadius: 0, background: "transparent", border: "none", borderBottom: `2px solid ${borderVal}`, boxShadow: "none" };
        case "ghost":
          return { ...base, background: focused ? surfaceAlt : "transparent", border: "none", boxShadow: "none" };
        default:
          return { ...base, background: disabled ? surfaceAlt : surfaceBg, border: `1.5px solid ${borderVal}`, boxShadow: focused ? `0 0 0 3px ${focusColor}22` : "none" };
      }
    })();

    // ── Native select style ───────────────────────────────────────────────
    // Hide native arrow - we render our own ChevronDown
    const selectStyle: CSSProperties = {
      flex: 1,
      width: "100%",
      height: h,
      border: "none",
      outline: "none",
      background: "transparent",
      fontSize: font,
      color: disabled ? mutedColor : textColor,
      paddingLeft: px,
      // Right padding reserves space for our icons (chevron + status)
      paddingRight: px + iconSize + 8 + (effectiveStatus !== "default" ? iconSize + 4 : 0),
      paddingTop: py,
      paddingBottom: py,
      cursor: disabled ? "not-allowed" : "pointer",
      appearance: "none",
      WebkitAppearance: "none",
      MozAppearance: "none",
      boxSizing: "border-box",
      ...style,
    };

    // ── All options (flat or grouped) ─────────────────────────────────────
    const renderOptions = () => {
      if (groups && groups.length > 0) {
        return groups.map((group) => (
          <optgroup key={group.groupLabel} label={group.groupLabel}>
            {group.options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </optgroup>
        ));
      }
      return options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ));
    };

    // ─────────────────────────────────────────────────────────────────────
    return (
      <div
        className={className}
        style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4 }}
      >
        {/* Label */}
        {label && (
          <label
            htmlFor={id}   // ✅ links label click → select focus
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

        {/* Select wrapper */}
        <div style={wrapperStyle}>
          <select
            id={id}
            name={name}
            ref={mergedRef}
            disabled={disabled}
            value={value}
            defaultValue={value !== undefined ? undefined : (defaultValue ?? (placeholder ? "" : undefined))}
            style={selectStyle}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${id}-error` :
                helperText ? `${id}-helper` : undefined
            }
            aria-label={!label ? placeholder || name : undefined}
            aria-required={required}
            onChange={(e) => {
              onChange?.(e);
              (rhfRest as { onChange?: typeof onChange }).onChange?.(e);
            }}
            onFocus={(e) => { setFocused(true); onFocus?.(e); }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
              (rhfRest as { onBlur?: typeof onBlur }).onBlur?.(e);
            }}
            {...(rhfRest as React.SelectHTMLAttributes<HTMLSelectElement>)}
            {...rest}
          >
            {/* Placeholder option */}
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {renderOptions()}
          </select>

          {/* Right icons - status + chevron */}
          <div style={{
            position: "absolute",
            right: px * 0.75,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 4,
            pointerEvents: "none",
          }}>
            {effectiveStatus === "error" && (
              <ErrorIcon size={iconSize} color={dangerColor} />
            )}
            {effectiveStatus === "success" && (
              <SuccessIcon size={iconSize} color={successColor} />
            )}
            <ChevronDown
              size={iconSize}
              color={focused ? focusColor : mutedColor}
            />
          </div>
        </div>

        {/* Error */}
        {hasError && (
          <p id={`${id}-error`} role="alert"
            style={{ fontSize: font - 2, color: dangerColor, margin: 0, lineHeight: 1.4 }}>
            {error}
          </p>
        )}

        {/* Helper */}
        {!hasError && helperText && (
          <p id={`${id}-helper`}
            style={{ fontSize: font - 2, color: mutedColor, margin: 0, lineHeight: 1.4 }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

//Example usage:
// Basic
{/* <Select label="Meal Type" placeholder="Select meal"
    options={[{ label: "Breakfast", value: "breakfast" }, { label: "Lunch", value: "lunch" }]}
    value={meal} onChange={(e) => setMeal(e.target.value)}
/> */}

// With option groups
{/* <Select label="Category" placeholder="Select category"
    groups={[
        { groupLabel: "Veg", options: [{ label: "Salad", value: "salad" }, { label: "Soup", value: "soup" }] },
        { groupLabel: "Non-Veg", options: [{ label: "Chicken", value: "chicken" }, { label: "Fish", value: "fish" }] },
    ]}
    value={cat} onChange={(e) => setCat(e.target.value)}
/> */}

// Validation states
{/* <Select status="error"   error="Please select an option" options={opts} value={v} onChange={e => setV(e.target.value)} /> */ }
{/* <Select status="success" helperText="Great choice!"       options={opts} value={v} onChange={e => setV(e.target.value)} /> */ }

// Sizes & Variants
{/* <Select size="sm" variant="filled"     options={opts} value={v} onChange={e => setV(e.target.value)} /> */ }
{/* <Select size="lg" variant="underline"  options={opts} value={v} onChange={e => setV(e.target.value)} /> */ }

// With RHF
{/* <Select label="Meal" name="mealType" placeholder="Select meal"
    register={form.register}
    error={form.formState.errors.mealType?.message}
    options={[{ label: "Breakfast", value: "breakfast" }]}
/> */}

// Disabled
{/* <Select label="Region" disabled options={opts} value="us" onChange={() => {}} /> */ }