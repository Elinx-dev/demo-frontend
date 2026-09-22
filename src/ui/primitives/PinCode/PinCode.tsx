import React, { useRef, useState, useId, useCallback, useEffect, type CSSProperties } from "react";
import { useTheme } from "@/ui/theme/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg";
type Variant = "outline" | "filled" | "underline" | "ghost";
type Status = "default" | "error" | "success" | "warning";
type InputType = "numeric" | "alphanumeric" | "alphabetic";

export interface PinCodeProps {
  /** Controlled value as a single string e.g "123456" */
  value?: string;
  /** Default value (uncontrolled) */
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Called when all boxes are filled */
  onComplete?: (value: string) => void;
  /** Called when submit button is clicked */
  onSubmit?: (value: string) => void;
  /** Number of input boxes. Default: 6 */
  length?: number;
  label?: string;
  error?: string;
  helperText?: string;
  status?: Status;
  submitText?: string;
  /** Show submit button */
  showSubmit?: boolean;
  /** Input character type */
  inputType?: InputType;
  /** Mask input like password */
  mask?: boolean;
  /** Separator character between groups e.g "-" */
  separator?: string;
  /** Group size for separator e.g 3 → "123-456" */
  separatorAt?: number;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  size?: Size;
  variant?: Variant;
  className?: string;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<Size, {
  boxW: number; boxH: number; font: number; radius: number;
  gap: number; btnH: number; btnFont: number; btnPx: number;
}> = {
  sm: { boxW: 36, boxH: 36, font: 14, radius: 6, gap: 6, btnH: 30, btnFont: 12, btnPx: 12 },
  md: { boxW: 44, boxH: 44, font: 18, radius: 8, gap: 8, btnH: 36, btnFont: 14, btnPx: 16 },
  lg: { boxW: 56, boxH: 56, font: 22, radius: 10, gap: 10, btnH: 44, btnFont: 15, btnPx: 20 },
};

// ─── Char validators ──────────────────────────────────────────────────────────

const validators: Record<InputType, (char: string) => boolean> = {
  numeric: (c) => /^\d$/.test(c),
  alphanumeric: (c) => /^[a-zA-Z0-9]$/.test(c),
  alphabetic: (c) => /^[a-zA-Z]$/.test(c),
};

// ─── PinCode ──────────────────────────────────────────────────────────────────

export const PinCode = React.forwardRef<HTMLDivElement, PinCodeProps>(
  (
    {
      value,
      defaultValue = "",
      onChange,
      onComplete,
      onSubmit,
      length = 6,
      label,
      error,
      helperText,
      status = "default",
      submitText = "Verify",
      showSubmit = false,
      inputType = "numeric",
      mask = false,
      separator,
      separatorAt,
      disabled = false,
      readOnly = false,
      autoFocus = false,
      size = "md",
      variant = "outline",
      className = "",
    },
    forwardedRef
  ) => {
    const { theme } = useTheme();
    const c = theme.colors;
    const groupId = useId();

    // ── Controlled / uncontrolled ─────────────────────────────────────────
    const isControlled = value !== undefined;
    const [internal, setInternal] = useState(defaultValue.slice(0, length));
    const pin = isControlled ? (value ?? "").slice(0, length) : internal;

    const setPin = useCallback((next: string) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
      if (next.length === length) onComplete?.(next);
    }, [isControlled, onChange, onComplete, length]);

    // ── Per-box focus state ───────────────────────────────────────────────
    const [focusedIdx, setFocusedIdx] = useState<number | null>(null);

    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

    // Auto-focus first box
    useEffect(() => {
      if (autoFocus && !disabled) inputsRef.current[0]?.focus();
    }, [autoFocus, disabled]);

    const isValid = validators[inputType];

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
    const hasError = !!error;

    const { boxW, boxH, font, radius, gap, btnH, btnFont, btnPx } = sizeMap[size];

    // ── Box style factory ─────────────────────────────────────────────────
    const boxStyle = useCallback((idx: number): CSSProperties => {
      const isFocused = focusedIdx === idx;
      const isFilled = !!pin[idx];
      const borderVal = isFocused
        ? focusColor
        : isFilled
          ? (hasError ? dangerColor : effectiveStatus === "success" ? successColor : accentColor)
          : statusBorderMap[effectiveStatus];

      const base: CSSProperties = {
        width: boxW,
        height: boxH,
        textAlign: "center",
        fontSize: font,
        fontWeight: 600,
        borderRadius: radius,
        outline: "none",
        border: "none",
        transition: "box-shadow 0.15s, border-color 0.15s, background 0.15s",
        cursor: disabled ? "not-allowed" : readOnly ? "default" : "text",
        opacity: disabled ? 0.55 : 1,
        caretColor: focusColor,
        letterSpacing: "0.05em",
        boxSizing: "border-box" as const,
        color: disabled ? mutedColor : textColor,
        flexShrink: 0,
      };

      switch (variant) {
        case "filled":
          return {
            ...base,
            background: isFocused ? surfaceBg : surfaceAlt,
            border: `1.5px solid ${isFocused ? focusColor : "transparent"}`,
            boxShadow: isFocused ? `0 0 0 3px ${focusColor}22` : "none",
          };
        case "underline":
          return {
            ...base,
            borderRadius: 0,
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${borderVal}`,
            boxShadow: "none",
          };
        case "ghost":
          return {
            ...base,
            background: isFocused ? surfaceAlt : "transparent",
            border: "none",
            boxShadow: "none",
          };
        default: // outline
          return {
            ...base,
            background: disabled ? surfaceAlt : surfaceBg,
            border: `1.5px solid ${borderVal}`,
            boxShadow: isFocused ? `0 0 0 3px ${focusColor}22` : "none",
          };
      }
    }, [focusedIdx, pin, focusColor, hasError, effectiveStatus, variant,
      boxW, boxH, font, radius, accentColor, dangerColor, successColor,
      borderColor, surfaceBg, surfaceAlt, mutedColor, textColor, disabled, readOnly, statusBorderMap]);

    // ── Handlers ──────────────────────────────────────────────────────────
    const handleChange = (idx: number, raw: string) => {
      if (disabled || readOnly) return;

      // Handle case where browser inserts 2 chars (replaces existing)
      const char = raw.slice(-1).toUpperCase();
      if (char && !isValid(char)) return;

      const arr = pin.split("");
      arr[idx] = char;
      // Fill up to length with empty strings
      const next = Array.from({ length }, (_, i) => arr[i] ?? "").join("");
      setPin(next);

      if (char && idx < length - 1) {
        inputsRef.current[idx + 1]?.focus();
      }
    };

    const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (pin[idx]) {
          // Clear current
          const arr = pin.split("");
          arr[idx] = "";
          setPin(Array.from({ length }, (_, i) => arr[i] ?? "").join(""));
        } else if (idx > 0) {
          // Move back and clear
          const arr = pin.split("");
          arr[idx - 1] = "";
          setPin(Array.from({ length }, (_, i) => arr[i] ?? "").join(""));
          inputsRef.current[idx - 1]?.focus();
        }
        e.preventDefault();
      }
      if (e.key === "ArrowLeft" && idx > 0) { inputsRef.current[idx - 1]?.focus(); e.preventDefault(); }
      if (e.key === "ArrowRight" && idx < length - 1) { inputsRef.current[idx + 1]?.focus(); e.preventDefault(); }
      if (e.key === "Delete") {
        const arr = pin.split("");
        arr[idx] = "";
        setPin(Array.from({ length }, (_, i) => arr[i] ?? "").join(""));
        e.preventDefault();
      }
      if (e.key === "Enter" && onSubmit && pin.length === length) {
        onSubmit(pin);
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (disabled || readOnly) return;
      const raw = e.clipboardData.getData("text").slice(0, length);
      const clean = raw
        .toUpperCase()
        .split("")
        .filter(isValid)
        .slice(0, length)
        .join("");
      if (!clean) return;

      const next = Array.from({ length }, (_, i) => clean[i] ?? "").join("");
      setPin(next);

      // ✅ Focus the next empty box (not just the last filled)
      const nextEmpty = clean.length < length ? clean.length : length - 1;
      inputsRef.current[nextEmpty]?.focus();
    };

    // ── Render ────────────────────────────────────────────────────────────
    const labelFont = font - 4;

    return (
      <div
        ref={forwardedRef}
        className={className}
        style={{ display: "inline-flex", flexDirection: "column", gap: 8 }}
      >
        {/* Label */}
        {label && (
          <label
            id={`${groupId}-label`}
            style={{
              fontSize: labelFont,
              fontWeight: 500,
              color: focusedIdx !== null ? focusColor : textColor,
              transition: "color 0.15s",
              userSelect: "none",
            }}
          >
            {label}
          </label>
        )}

        {/* Input boxes row */}
        <div
          role="group"
          aria-labelledby={label ? `${groupId}-label` : undefined}
          style={{ display: "flex", alignItems: "center", gap, flexWrap: "nowrap" }}
        >
          {Array.from({ length }, (_, idx) => {
            const showSeparator = separator && separatorAt && idx > 0 && idx % separatorAt === 0;

            return (
              <React.Fragment key={idx}>
                {/* Separator */}
                {showSeparator && (
                  <span style={{
                    fontSize: font,
                    color: mutedColor,
                    userSelect: "none",
                    flexShrink: 0,
                  }}>
                    {separator}
                  </span>
                )}

                <input
                  ref={(el) => { inputsRef.current[idx] = el; }}
                  type={mask ? "password" : "text"}
                  inputMode={inputType === "numeric" ? "numeric" : "text"}
                  maxLength={1}
                  value={pin[idx] ?? ""}
                  disabled={disabled}
                  readOnly={readOnly}
                  aria-label={`Pin digit ${idx + 1} of ${length}`}
                  aria-invalid={hasError}
                  style={boxStyle(idx)}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  onFocus={() => setFocusedIdx(idx)}
                  onBlur={() => setFocusedIdx(null)}
                  // Select existing content on focus for easy replacement
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </React.Fragment>
            );
          })}
        </div>

        {/* Submit button */}
        {(showSubmit || onSubmit) && (
          <button
            type="button"
            onClick={() => pin.length === length && onSubmit?.(pin)}
            disabled={disabled || pin.replace(/\s/g, "").length < length}
            style={{
              height: btnH,
              padding: `0 ${btnPx}px`,
              borderRadius: radius,
              border: "none",
              background: pin.replace(/\s/g, "").length === length
                ? accentColor
                : `${accentColor}55`,
              color: "#fff",
              fontSize: btnFont,
              fontWeight: 600,
              cursor: pin.replace(/\s/g, "").length === length && !disabled
                ? "pointer"
                : "not-allowed",
              transition: "background 0.15s, box-shadow 0.15s",
              alignSelf: "flex-start",
            }}
            onMouseEnter={e => {
              if (pin.replace(/\s/g, "").length === length && !disabled)
                (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 8px ${accentColor}44`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            {submitText}
          </button>
        )}

        {/* Error */}
        {hasError && (
          <p role="alert" style={{ fontSize: labelFont, color: dangerColor, margin: 0, lineHeight: 1.4 }}>
            {error}
          </p>
        )}

        {/* Helper */}
        {!hasError && helperText && (
          <p style={{ fontSize: labelFont, color: mutedColor, margin: 0, lineHeight: 1.4 }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

PinCode.displayName = "PinCode";


// Example usage:
// Basic OTP
{/* <PinCode length={6} label="Enter OTP" value={otp} onChange={setOtp} onComplete={(v) => verify(v)} /> */ }

// With separator (credit card style)
{/* <PinCode length={8} separator="-" separatorAt={4} value={pin} onChange={setPin} /> */ }

// Alphanumeric + mask
{/* <PinCode length={4} inputType="alphanumeric" mask value={pin} onChange={setPin} size="lg" /> */ }

// With error
{/* <PinCode length={6} value={otp} onChange={setOtp} error="Invalid OTP. Please try again." /> */ }

// With submit button
{/* <PinCode length={6} value={otp} onChange={setOtp} showSubmit submitText="Submit OTP" onSubmit={(v) => console.log(v)} /> */ }