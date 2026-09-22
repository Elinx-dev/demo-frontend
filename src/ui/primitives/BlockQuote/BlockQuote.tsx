import React from "react";
import { useTheme } from "../../theme/ThemeContext";
import { Quote } from "lucide-react";

type Variant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "muted"
  | "custom";

type Size = "sm" | "md" | "lg";

interface BlockQuoteProps {
  children: React.ReactNode;

  variant?: Variant;
  size?: Size;

  icon?: React.ReactNode;
  showIcon?: boolean;

  author?: React.ReactNode;
  cite?: string;

  align?: "left" | "center" | "right";

  bordered?: boolean;
  card?: boolean;

  bgColor?: string;
  textColor?: string;
  borderColor?: string;

  italic?: boolean;
  className?: string;
}

const sizeStyles: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

const BlockQuote: React.FC<BlockQuoteProps> = ({
  children,
  variant = "default",
  size = "md",
  icon,
  showIcon = true,
  author,
  cite,
  align = "left",
  bordered = true,
  card = false,
  bgColor,
  textColor,
  borderColor,
  italic = true,
  className = "",
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  // Theme-based variant styles
  const variantStyles = {
    default: {
      bg: colors.surface,
      text: colors.text,
      border: colors.primaryBorder,
    },
    primary: {
      bg: colors.primary + "15",
      text: colors.primary,
      border: colors.primary,
    },
    success: {
      bg: "#22c55e15",
      text: "#16a34a",
      border: "#22c55e",
    },
    warning: {
      bg: "#f59e0b15",
      text: "#d97706",
      border: "#f59e0b",
    },
    error: {
      bg: "#ef444415",
      text: "#dc2626",
      border: "#ef4444",
    },
    muted: {
      bg: colors.surface,
      text: colors.textMuted,
      border: colors.primaryBorder,
    },
    custom: {
      bg: bgColor || colors.surface,
      text: textColor || colors.text,
      border: borderColor || colors.primaryBorder,
    },
  };

  const current = variantStyles[variant];

  return (
    <blockquote
      className={`
        relative
        ${sizeStyles[size]}
        ${italic ? "italic" : ""}
        ${card ? "rounded-xl shadow-sm p-6" : "pl-6"}
        ${align === "center" ? "text-center" : ""}
        ${align === "right" ? "text-right" : ""}
        ${className}
      `}
      style={{
        backgroundColor: card ? current.bg : "transparent",
        color: current.text,
        borderLeft: bordered ? `4px solid ${current.border}` : "none",
      }}
    >
      {/* Icon */}
      {showIcon && (
        <div className="mb-3 opacity-70">
          {icon ?? <Quote size={24} />}
        </div>
      )}

      {/* Content */}
      <div>{children}</div>

      {/* Author */}
      {(author || cite) && (
        <footer className="mt-4 not-italic text-sm opacity-80">
          {author && <span>- {author}</span>}
          {cite && (
            <cite className="ml-2" title={cite}>
              ({cite})
            </cite>
          )}
        </footer>
      )}
    </blockquote>
  );
};

export default BlockQuote;

// Usage Example
//  <BlockQuote author="Franklin D. Roosevelt">
//                 The only limit to our realization of tomorrow is our doubts of today.
//             </BlockQuote>
//             <BlockQuote
//                 author="Albert Einstein"
//                 cite="Relativity: The Special and the General Theory"
//             >
//                 Life is like riding a bicycle. To keep your balance you must keep moving.
//             </BlockQuote>
//             <BlockQuote variant="primary">Primary Quote</BlockQuote>
//             <BlockQuote variant="success">Success Quote</BlockQuote>
//             <BlockQuote variant="warning">Warning Quote</BlockQuote>
//             <BlockQuote variant="error">Error Quote</BlockQuote>
//             <BlockQuote variant="muted">Muted Quote</BlockQuote>