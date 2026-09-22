import { forwardRef, useState, useId, type CSSProperties, type KeyboardEvent } from "react";
import { useTheme } from "@/ui/theme/ThemeContext";
import { Eye, EyeOff } from "lucide-react"; // ✅ Removed unused: Pointer, useEffect

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg";
type Variant = "outline" | "filled" | "underline" | "ghost";

export interface PasswordRules {
  /** Min character length. null = rule disabled */
  minLength?: number | null;
  /** Must contain uppercase. null = rule disabled */
  uppercase?: boolean | null;
  /** Must contain a number. null = rule disabled */
  number?: boolean | null;
  /** Must contain a special character. null = rule disabled */
  specialChar?: boolean | null;
}

export interface PasswordProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Show animated strength bar */
  showStrength?: boolean;
  /** Show per-rule checklist */
  showRules?: boolean;
  /** Pass the other password field's value to enable match check */
  confirmValue?: string;
  /** Password complexity rules */
  rules?: PasswordRules;
  size?: Size;
  variant?: Variant;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const defaultRules: PasswordRules = {
  minLength: 8,
  uppercase: true,
  number: true,
  specialChar: true,
};

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<Size, { h: number; font: number; px: number; py: number; radius: number; iconSize: number }> = {
  sm: { h: 32, font: 12, px: 10, py: 6, radius: 6, iconSize: 14 },
  md: { h: 40, font: 14, px: 14, py: 10, radius: 8, iconSize: 16 },
  lg: { h: 48, font: 15, px: 16, py: 12, radius: 10, iconSize: 18 },
};

// ─── Strength helpers ─────────────────────────────────────────────────────────

interface RuleCheck {
  key: keyof PasswordRules;
  label: string;
  passed: boolean;
  active: boolean; // false = rule is disabled (null)
}

function evaluateRules(value: string, rules: PasswordRules): RuleCheck[] {
  return [
    {
      key: "minLength",
      label: `At least ${rules.minLength ?? 8} characters`,
      passed: value.length >= (rules.minLength ?? 8),
      active: rules.minLength !== null && rules.minLength !== undefined,
    },
    {
      key: "uppercase",
      label: "One uppercase letter",
      passed: /[A-Z]/.test(value),
      active: rules.uppercase === true,
    },
    {
      key: "number",
      label: "One number",
      passed: /[0-9]/.test(value),
      active: rules.number === true,
    },
    {
      key: "specialChar",
      label: "One special character",
      passed: /[^A-Za-z0-9]/.test(value),
      active: rules.specialChar === true,
    },
  ];
}

function getStrength(ruleChecks: RuleCheck[]): {
  level: "Weak" | "Medium" | "Strong";
  percent: number;
} {
  // ✅ Only count ACTIVE rules - fixes the hardcoded /4 bug
  const activeRules = ruleChecks.filter(r => r.active);
  const totalActive = activeRules.length;
  if (totalActive === 0) return { level: "Weak", percent: 0 };

  const passed = activeRules.filter(r => r.passed).length;
  const percent = Math.round((passed / totalActive) * 100);
  const level =
    percent === 100 ? "Strong" :
      percent >= 50 ? "Medium" :
        "Weak";
  return { level, percent };
}

// ─── Password Component ───────────────────────────────────────────────────────

export const Password = forwardRef<HTMLInputElement, PasswordProps>(
  (
    {
      value,
      onChange,
      label,
      error,
      helperText,
      disabled = false,
      placeholder,
      showStrength = false,
      showRules = false,
      confirmValue,
      rules = defaultRules,
      size = "md",
      variant = "outline",
      className = "",
    },
    ref
  ) => {
    const { theme } = useTheme();
    const c = theme.colors;
    const inputId = useId(); // ✅ Stable id for label↔input linking

    const [visible, setVisible] = useState(false);
    const [focused, setFocused] = useState(false);
    const [capsLock, setCapsLock] = useState(false);

    // ── Colors ────────────────────────────────────────────────────────────
    const accentColor = c.accent ?? "#6366f1";
    const dangerColor = c.danger ?? "#ef4444";
    const successColor = c.success ?? "#22c55e";
    const warningColor = c.warning ?? "#f59e0b";
    const borderColor = c.primaryBorder ?? "#d1d5db";
    const textColor = c.text ?? "#111827";
    const mutedColor = c.textMuted ?? "#9ca3af";
    const surfaceBg = c.surface ?? "#ffffff";
    const surfaceAlt = c.primaryLight ?? "#f9fafb";

    const { font, px, py, radius, iconSize } = sizeMap[size];

    // ── Rule evaluation ───────────────────────────────────────────────────
    const ruleChecks = evaluateRules(value, rules);
    const { level: strengthLevel, percent: strengthPercent } = getStrength(ruleChecks);
    // ✅ Only show rules that are ACTIVE (not null/undefined)
    const activeRuleChecks = ruleChecks.filter(r => r.active);

    // ── Border color logic ────────────────────────────────────────────────
    const hasError = !!error;
    const focusColor = hasError ? dangerColor : accentColor;
    const borderVal = focused
      ? focusColor
      : hasError ? dangerColor : borderColor;

    // ── Wrapper style (same variant logic as Input) ───────────────────────
    const wrapperStyle: CSSProperties = (() => {
      const base: CSSProperties = {
        display: "flex",
        alignItems: "center",
        width: "100%",
        paddingLeft: px,
        paddingRight: px * 0.75, // leave room for eye icon
        paddingTop: py,
        paddingBottom: py,
        borderRadius: radius,
        transition: "box-shadow 0.15s, border-color 0.15s, background 0.15s",
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "text",
        boxSizing: "border-box" as const,
        gap: 8,
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
            paddingLeft: 0,
            paddingRight: px * 0.5,
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

    // ── Strength bar color ────────────────────────────────────────────────
    const strengthColor =
      strengthLevel === "Strong" ? successColor :
        strengthLevel === "Medium" ? warningColor :
          dangerColor;

    // ── CapsLock handler ──────────────────────────────────────────────────
    const handleCapsLock = (e: KeyboardEvent<HTMLInputElement>) => {
      setCapsLock(e.getModifierState("CapsLock"));
    };

    // ── Passwords match check ─────────────────────────────────────────────
    // Only show mismatch warning when confirmValue is provided AND both have a value
    const showMismatch =
      confirmValue !== undefined &&
      value.length > 0 &&
      confirmValue.length > 0 &&
      value !== confirmValue;

    // ─────────────────────────────────────────────────────────────────────

    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4 }} className={className}>

        {/* ── Label ──────────────────────────────────────────────────── */}
        {label && (
          <label
            htmlFor={inputId}  // ✅ Links label click → focuses input
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

        {/* ── Input wrapper ───────────────────────────────────────────── */}
        <div style={wrapperStyle}>
          <input
            id={inputId}
            ref={ref}
            type={visible ? "text" : "password"}
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyUp={handleCapsLock}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` :
                helperText ? `${inputId}-helper` : undefined
            }
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: font,
              color: disabled ? mutedColor : textColor,
              cursor: disabled ? "not-allowed" : "text",
            }}
          />

          {/* Eye toggle */}
          <button
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            onClick={() => setVisible(prev => !prev)}
            disabled={disabled}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: "none",
              background: "transparent",
              cursor: disabled ? "not-allowed" : "pointer", // ✅ lowercase "pointer"
              color: mutedColor,
              padding: 0,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.color = accentColor; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = mutedColor; }}
          >
            {visible
              ? <EyeOff size={iconSize} />
              : <Eye size={iconSize} />
            }
          </button>
        </div>

        {/* ── CapsLock warning ────────────────────────────────────────── */}
        {capsLock && (
          <p style={{ fontSize: font - 2, color: warningColor, margin: 0 }}>
            ⚠️ Caps Lock is ON
          </p>
        )}

        {/* ── Strength bar ─────────────────────────────────────────────── */}
        {showStrength && value.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {/* Track */}
            <div style={{
              height: 4,
              borderRadius: 999,
              background: `${borderColor}`,
              overflow: "hidden",
            }}>
              {/* Fill */}
              <div style={{
                height: "100%",
                borderRadius: 999,
                width: `${strengthPercent}%`,
                background: strengthColor,
                transition: "width 0.3s ease, background 0.3s ease",
              }} />
            </div>
            <p style={{ fontSize: font - 2, color: strengthColor, margin: 0, fontWeight: 500 }}>
              Strength: {strengthLevel}
            </p>
          </div>
        )}

        {/* ── Rule checklist ───────────────────────────────────────────── */}
        {/* ✅ Only renders ACTIVE rules - null rules are hidden */}
        {showRules && value.length > 0 && activeRuleChecks.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 3 }}>
            {activeRuleChecks.map(rule => (
              <li
                key={rule.key}
                style={{
                  fontSize: font - 2,
                  color: rule.passed ? successColor : mutedColor,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  transition: "color 0.2s",
                }}
              >
                {/* Inline check/dot icon - no external dep */}
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: rule.passed ? successColor : `${mutedColor}30`,
                  flexShrink: 0,
                  transition: "background 0.2s",
                }}>
                  {rule.passed && (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
                      stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                {rule.label}
              </li>
            ))}
          </ul>
        )}

        {/* ── Password mismatch ────────────────────────────────────────── */}
        {/* ✅ Only shows when both fields have values */}
        {showMismatch && (
          <p style={{ fontSize: font - 2, color: dangerColor, margin: 0 }}>
            Passwords do not match
          </p>
        )}

        {/* ── Error ────────────────────────────────────────────────────── */}
        {hasError && (
          <p id={`${inputId}-error`} role="alert"
            style={{ fontSize: font - 2, color: dangerColor, margin: 0 }}>
            {error}
          </p>
        )}

        {/* ── Helper text (only when no error) ─────────────────────────── */}
        {!hasError && helperText && (
          <p id={`${inputId}-helper`}
            style={{ fontSize: font - 2, color: mutedColor, margin: 0 }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Password.displayName = "Password";

//Example usage:
// Main password field
{/* <Password value={newPassword} onChange={setNewPassword} showStrength showRules /> */ }

// Confirm field - pass the MAIN password as confirmValue
{/* <Password
    value={confirmPass}
    onChange={setConfirmPass}
    confirmValue={newPassword}   // ← this triggers the mismatch check
    rules={{ minLength: null, uppercase: null, number: null, specialChar: null }} // no rules needed here
/> */}