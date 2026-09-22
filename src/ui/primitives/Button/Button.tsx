import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { useTheme } from "../../theme/ThemeContext";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "success"
  | "ghost";

type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  reason?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth,
      disabled,
      reason,
      children,
      className = "",
      ...rest
    },
    ref,
  ) => {
    const { theme } = useTheme();

    // Base: font-family Inter, focus-visible ring (never hidden), 120ms transition
    const base =
      "inline-flex items-center justify-center gap-1.5 " +
      "font-medium leading-none select-none " +
      "rounded-[8px] " +                          // design: radius-md = 8px
      "focus:outline-none " +
      "focus-visible:ring-[3px] focus-visible:ring-[#CFD2DA] focus-visible:ring-offset-1 " +
      "transition-all duration-[120ms] ";          // design: --dur-fast = 120ms

    // Design-exact sizes:
    // sm  → 12px font / 6px top-bottom / 12px left-right
    // md  → 13px font / 9px top-bottom / 18px left-right
    // lg  → 14px font / 12px top-bottom / 24px left-right
    const sizes: Record<Size, string> = {
      sm: "text-[12px] py-[6px] px-[12px]",
      md: "text-[13px] py-[9px] px-[18px]",
      lg: "text-[14px] py-[12px] px-[24px]",
    };

    const width = fullWidth ? "w-full" : "";
    const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

    return (
      <button
        ref={ref}
        {...rest}
        disabled={disabled}
        title={disabled ? reason : rest.title}
        className={`
          ${base}
          ${sizes[size]}
          ${theme.button[variant]}
          ${width}
          ${disabledStyles}
          ${className}
        `.trim()}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";