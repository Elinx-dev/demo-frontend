import React, { useId, useState } from "react";
import { useTheme } from "@/ui/theme/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg";
type Variant = "outline" | "filled" | "underline" | "ghost";
type Status = "default" | "error" | "success" | "warning";

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label?: string;
  /** Name used for RHF registration AND label htmlFor linking */
  name?: string;
  /** Manual error message (used when RHF context is not available) */
  error?: string;
  /** Helper text shown below input (only when no error) */
  helperText?: string;
  /** React Hook Form register function - pass explicitly, no context hook needed */
  register?: (name: string) => React.InputHTMLAttributes<HTMLInputElement> & {
    ref: React.Ref<HTMLInputElement>;
  };
  /** Validation status - drives border/icon color */
  status?: Status;
  size?: Size;
  variant?: Variant;
  /** Show character count (requires maxLength) */
  showCount?: boolean;
  /** Left icon/element */
  startAdornment?: React.ReactNode;
  /** Right icon/element */
  endAdornment?: React.ReactNode;
  /** Loading spinner on right */
  loading?: boolean;
  /** Hides native spin buttons on number inputs (the up/down arrows) */
  hideSpinButtons?: boolean;
  /** Disables scroll-to-change-value on number inputs */
  disableScroll?: boolean;
  /** Prevents negative numbers from being entered */
  disableNegative?: boolean;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<
  Size,
  { h: number; font: number; px: number; py: number; radius: number }
> = {
  sm: { h: 32, font: 12, px: 10, py: 6, radius: 6 },
  md: { h: 40, font: 14, px: 14, py: 10, radius: 8 },
  lg: { h: 48, font: 15, px: 16, py: 12, radius: 10 },
};

// ─── Spinner ──────────────────────────────────────────────────────────────────

const Spinner = ({ size, color }: { size: number; color: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className="animate-spin"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke={color}
      strokeWidth="3"
      strokeOpacity="0.25"
    />
    <path
      d="M12 2a10 10 0 0 1 10 10"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

// ─── Status Icons ─────────────────────────────────────────────────────────────

const ErrorIcon = ({ size, color }: { size: number; color: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const SuccessIcon = ({ size, color }: { size: number; color: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

// ─── Input Component ──────────────────────────────────────────────────────────

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      // Our custom props
      label,
      name,
      error,
      helperText,
      register,
      status = "default",
      size = "md",
      variant = "outline",
      showCount = false,
      startAdornment,
      endAdornment,
      loading = false,
      hideSpinButtons = false,
      disableScroll = false,
      disableNegative = false,

      // Native input props
      className = "",
      style,
      type = "text",
      disabled = false,
      readOnly = false,
      maxLength,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      ...rest
    },
    forwardedRef,
  ) => {
    const { theme } = useTheme();
    const c = theme.colors;
    const autoId = useId();
    const inputId = name ?? autoId;

    // ── Local focus state for ring effect ─────────────────────────────────
    const [focused, setFocused] = useState(false);
    const [internalValue, setInternalValue] = useState<string>(
      typeof defaultValue === "string" || typeof defaultValue === "number"
        ? String(defaultValue)
        : "",
    );

    const isControlled = value !== undefined;
    const rawCurrentValue = isControlled ? String(value ?? "") : internalValue;

    // ── Clear-for-edit state ────────────────────────────────────────────────
    // At rest (blurred), a "0" value shows as "0" - honest about real data.
    // The moment the field is focused, if its value is "0", we visually
    // clear it so the person types into an empty box instead of having to
    // select/backspace the zero first. The underlying value (and whatever
    // you send in the payload) is untouched by this - it's display-only.
    const [clearedForEdit, setClearedForEdit] = useState(false);

    const isBareZero = type === "number" && rawCurrentValue === "0";
    const currentValue = isBareZero && clearedForEdit ? "" : rawCurrentValue;
    const charCount = currentValue.length;

    // ── Internal ref for scroll blocking ──────────────────────────────────
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    // ── Inject CSS once to hide spin buttons ──────────────────────────────
    React.useEffect(() => {
      if (!hideSpinButtons) return;
      const styleId = "input-no-spin";
      if (!document.getElementById(styleId)) {
        const styleEl = document.createElement("style");
        styleEl.id = styleId;
        styleEl.textContent = `
          input[data-no-spin]::-webkit-outer-spin-button,
          input[data-no-spin]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[data-no-spin] {
            -moz-appearance: textfield;
          }
        `;
        document.head.appendChild(styleEl);
      }
    }, [hideSpinButtons]);

    // ── Block scroll-to-change on number input ─────────────────────────────
    React.useEffect(() => {
      const el = inputRef.current;
      if (!el || !disableScroll || type !== "number") return;
      const handler = (e: WheelEvent) => e.preventDefault();
      el.addEventListener("wheel", handler, { passive: false });
      return () => el.removeEventListener("wheel", handler);
    }, [disableScroll, type]);

    // ── RHF registration (passed explicitly - no hook rule violation) ──────
    const rhfProps = register && name ? register(name) : {};
    const {
      ref: rhfRef,
      onChange: rhfOnChange,
      onBlur: rhfOnBlur,
      ...rhfRest
    } = rhfProps as {
      ref?: React.Ref<HTMLInputElement>;
      onChange?: React.ChangeEventHandler<HTMLInputElement>;
      onBlur?: React.FocusEventHandler<HTMLInputElement>;
      [k: string]: unknown;
    };

    const mergedRef = (node: HTMLInputElement | null) => {
      // Populate internal ref for scroll blocking
      inputRef.current = node;
      // Forward to RHF ref
      if (typeof rhfRef === "function") rhfRef(node);
      else if (rhfRef && typeof rhfRef === "object")
        (rhfRef as React.MutableRefObject<HTMLInputElement | null>).current =
          node;
      // Forward to external ref
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef && typeof forwardedRef === "object")
        (
          forwardedRef as React.MutableRefObject<HTMLInputElement | null>
        ).current = node;
    };

    // ── Colors ────────────────────────────────────────────────────────────
    const accentColor = c.accent ?? "#6366f1";
    const dangerColor = c.danger ?? "#ef4444";
    const successColor = c.success ?? "#22c55e";
    const warningColor = "#f59e0b";
    const borderColor = c.primaryBorder ?? "#d1d5db";
    const textColor = c.text ?? "#111827";
    const mutedColor = "#9ca3af";
    const surfaceBg = c.surface ?? "#ffffff";
    const surfaceAlt = c.primaryLight ?? "#f9fafb";

    // Resolve effective status - error prop always overrides
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
    const { font, px, py, radius } = sizeMap[size];
    const iconSize = font + 2;

    // ── Wrapper style (variant-driven) ────────────────────────────────────
    const wrapperStyle: React.CSSProperties = (() => {
      const hasPrefixSuffix =
        startAdornment ||
        endAdornment ||
        loading ||
        effectiveStatus !== "default";
      const base: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        width: "100%",
        gap: 6,
        paddingLeft: startAdornment ? px * 0.75 : px,
        paddingRight:
          endAdornment || loading || effectiveStatus !== "default"
            ? px * 0.75
            : px,
        paddingTop: py,
        paddingBottom: py,
        borderRadius: radius,
        transition: "box-shadow 0.15s, border-color 0.15s, background 0.15s",
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : readOnly ? "default" : "text",
        boxSizing: "border-box" as const,
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
            paddingLeft: startAdornment ? px * 0.5 : 0,
            paddingRight: hasPrefixSuffix ? px * 0.5 : 0,
            boxShadow: "none",
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

    // ── Native input style (borderless - wrapper holds the border) ─────────
    const inputStyle: React.CSSProperties = {
      flex: 1,
      minWidth: 0,
      border: "none",
      outline: "none",
      background: "transparent",
      fontSize: font,
      color: disabled ? mutedColor : textColor,
      cursor: disabled ? "not-allowed" : readOnly ? "default" : "text",
      lineHeight: 1.5,
      ...style,
    };

    // ── Handle change ─────────────────────────────────────────────────────
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;

      // Block negative numbers - strip any minus sign
      if (disableNegative && type === "number" && val.includes("-")) return;

      // Enforce maxLength
      if (maxLength && val.length > maxLength) {
        val = val.slice(0, maxLength);
        e.target.value = val;
      }

      // Once the person types anything, the "cleared the default zero"
      // display state is no longer relevant - let the real value show.
      if (clearedForEdit) {
        setClearedForEdit(false);
      }

      if (!isControlled) {
        setInternalValue(val);
      }

      onChange?.(e);
      rhfOnChange?.(e);
    };

    // ── Block "-" key for negative numbers ────────────────────────────────
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disableNegative && type === "number" && e.key === "-") {
        e.preventDefault();
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      if (type === "number") {
        if (rawCurrentValue === "0") {
          // Visually clear the default zero so typing starts on a blank field.
          setClearedForEdit(true);
        } else {
          // Select existing text so the next keystroke replaces it.
          e.target.select();
        }
      }
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      setClearedForEdit(false);

      // If the person left a number field empty after we cleared the
      // default zero, snap it back to "0" so the payload always has a
      // real number for your calculations - never undefined/blank.
      if (type === "number" && e.target.value === "" && !isControlled) {
        setInternalValue("0");
        // Build a synthetic event-like object so consumers relying on
        // onChange/onBlur still see the corrected value of "0".
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: "0", name },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onChange?.(syntheticEvent);
        rhfOnChange?.(syntheticEvent);
      }

      onBlur?.(e);
      rhfOnBlur?.(e);
    };

    // ── Error / helper message ────────────────────────────────────────────
    const errorMessage = error;
    const showHelper = !errorMessage && helperText;

    // ─────────────────────────────────────────────────────────────────────

    return (
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
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
            {rest.required && (
              <span style={{ color: textColor, marginLeft: 4 }}>*</span>
            )}
          </label>
        )}

        {/* Input wrapper - holds border/focus ring */}
        <div
          style={wrapperStyle}
          onClick={() => {
            const el = document.getElementById(inputId);
            el?.focus();
          }}
        >
          {/* Prefix */}
          {startAdornment && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                flexShrink: 0,
                color: focused ? focusColor : mutedColor,
                transition: "color 0.15s",
              }}
            >
              {startAdornment}
            </span>
          )}

          {/* Native input */}
          <input
            id={inputId}
            name={name}
            type={type}
            ref={mergedRef}
            disabled={disabled}
            readOnly={readOnly}
            maxLength={maxLength}
            value={currentValue}
            style={inputStyle}
            className={className}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            aria-invalid={effectiveStatus === "error"}
            aria-describedby={
              errorMessage
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            // Scoped attribute for CSS spin-button hiding
            {...(hideSpinButtons && type === "number"
              ? { "data-no-spin": "" }
              : {})}
            {...(rhfRest as React.InputHTMLAttributes<HTMLInputElement>)}
            {...rest}
          />

          {/* Char count */}
          {showCount && maxLength && (
            <span
              style={{
                fontSize: font - 3,
                color: charCount >= maxLength ? dangerColor : mutedColor,
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {charCount}/{maxLength}
            </span>
          )}

          {/* Loading spinner */}
          {loading && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <Spinner size={iconSize} color={accentColor} />
            </span>
          )}

          {/* Status icon (only when not loading) */}
          {!loading && effectiveStatus === "error" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <ErrorIcon size={iconSize} color={dangerColor} />
            </span>
          )}
          {!loading && effectiveStatus === "success" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <SuccessIcon size={iconSize} color={successColor} />
            </span>
          )}

          {/* Suffix */}
          {endAdornment && !loading && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                flexShrink: 0,
                color: mutedColor,
              }}
            >
              {endAdornment}
            </span>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <p
            id={`${inputId}-error`}
            role="alert"
            style={{
              fontSize: font - 2,
              color: dangerColor,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {errorMessage}
          </p>
        )}

        {/* Helper text */}
        {showHelper && (
          <p
            id={`${inputId}-helper`}
            style={{
              fontSize: font - 2,
              color: mutedColor,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

// ─── Example usage ────────────────────────────────────────────────────────────
// <Input
//   type="number"
//   label="Quantity"
//   hideSpinButtons   ← hides up/down arrows
//   disableScroll     ← disables scroll-to-change
//   disableNegative   ← blocks negative numbers
// />
//
// Props are independent - use any combination:
// <Input type="number" hideSpinButtons />
// <Input type="number" disableNegative />
// <Input type="number" disableScroll disableNegative />