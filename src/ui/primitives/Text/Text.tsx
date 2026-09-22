import type { ElementType, ReactNode } from "react";
import { useTheme } from "../../theme/ThemeContext";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type TextSize =
  | "xs"
  | "sm"
  | "base"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl";

type TextWeight =
  | "light"
  | "normal"
  | "medium"
  | "semibold"
  | "bold"
  | "extrabold";

interface TextProps<T extends ElementType = "p"> {
  as?: T;
  children: ReactNode;
  size?: TextSize;
  weight?: TextWeight;
  italic?: boolean;
  truncate?: boolean;
  className?: string;
  color?: string; // NEW: allow overriding theme color
}

const sizeClasses: Record<TextSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
};

const weightClasses: Record<TextWeight, string> = {
  light: "font-light",
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold",
};

const Text = <T extends ElementType = "p">({
  as,
  children,
  size = "base",
  weight = "normal",
  italic = false,
  truncate = false,
  className,
  color, // optional override
  ...props
}: TextProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof TextProps>) => {
  const Component = as || "p";
  const { theme } = useTheme();

  const hasTextColorClass = /\b(?:text-|hover:text-)/.test(className ?? "");
  const themeColor = color ?? (hasTextColorClass ? undefined : theme.colors.text);

  return (
    <Component
      className={cn(
        sizeClasses[size],
        weightClasses[weight],
        italic && "italic",
        truncate && "truncate",
        className
      )}
      style={themeColor ? { color: themeColor } : undefined}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Text;


// Usage Example
{/* <Text size="lg" weight="bold">
                Default theme text
            </Text>

            <Text size="xl" color="#ff4d4f">
                Custom red text
            </Text>

            <Text as="span" italic truncate>
                This is a very long text that will truncate...
            </Text> */}
