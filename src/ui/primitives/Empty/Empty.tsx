import React from "react";
import {
  Search,
  Inbox,
  AlertTriangle,
  FileQuestion,
  Lock,
} from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";

type Variant =
  | "default"
  | "no-data"
  | "search"
  | "error"
  | "404"
  | "no-permission"
  | "custom";

type Size = "sm" | "md" | "lg";

interface EmptyProps {
  title?: React.ReactNode;
  description?: React.ReactNode;

  variant?: Variant;
  icon?: React.ReactNode;

  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;

  size?: Size;
  layout?: "vertical" | "horizontal";

  fullPage?: boolean;
  card?: boolean;
  centered?: boolean;

  loading?: boolean;

  className?: string;
  children?: React.ReactNode;

  bgColor?: string;
  textColor?: string;
}

const variantIcons: Record<Variant, React.ReactNode> = {
  "no-data": <Inbox size={64} />,
  search: <Search size={64} />,
  error: <AlertTriangle size={64} />,
  "404": <FileQuestion size={64} />,
  "no-permission": <Lock size={64} />,
  default: <Inbox size={64} />,
  custom: <Inbox size={64} />,
};

const sizeStyles = {
  sm: {
    icon: "w-10 h-10",
    title: "text-lg",
    desc: "text-sm",
  },
  md: {
    icon: "w-14 h-14",
    title: "text-xl",
    desc: "text-base",
  },
  lg: {
    icon: "w-20 h-20",
    title: "text-2xl",
    desc: "text-lg",
  },
};

const Empty: React.FC<EmptyProps> = ({
  title = "No Data Found",
  description = "There is nothing to display here.",
  variant = "default",
  icon,
  primaryAction,
  secondaryAction,
  size = "md",
  layout = "vertical",
  fullPage = false,
  card = false,
  centered = true,
  loading = false,
  className = "",
  children,
  bgColor,
  textColor,
}) => {
  const sizeStyle = sizeStyles[size];
  const { theme } = useTheme();
  const colors = theme.colors;

  // Theme-aware container colors
  const containerStyle: React.CSSProperties = {
    backgroundColor: bgColor || (card ? colors.surface : "transparent"),
    color: textColor || colors.text,
  };

  const iconStyle: React.CSSProperties = {
    color: colors.textMuted,
  };

  const titleStyle: React.CSSProperties = {
    color: textColor || colors.text,
  };

  const descStyle: React.CSSProperties = {
    color: colors.textMuted,
  };

  return (
    <div
      className={`
        ${fullPage ? "min-h-screen flex items-center justify-center" : ""}
        ${card ? "border rounded-xl shadow-sm p-8" : ""}
        ${centered ? "flex flex-col items-center text-center" : ""}
        ${className}
      `}
      style={containerStyle}
    >
      <div
        className={`
          flex gap-6
          ${layout === "vertical" ? "flex-col items-center" : "flex-row items-center"}
        `}
      >
        {/* Icon */}
        <div className={`${sizeStyle.icon}`} style={iconStyle}>
          {loading ? (
            <div
              className="animate-spin rounded-full"
              style={{
                border: `4px solid ${colors.surface}`,
                borderTopColor: colors.textMuted,
                width: "100%",
                height: "100%",
              }}
            />
          ) : (
            icon ?? variantIcons[variant]
          )}
        </div>

        {/* Content */}
        <div>
          {children ? (
            children
          ) : (
            <>
              <h3 className={`font-semibold mt-4 ${sizeStyle.title}`} style={titleStyle}>
                {title}
              </h3>
              <p className={`mt-2 ${sizeStyle.desc}`} style={descStyle}>
                {description}
              </p>
            </>
          )}

          {(primaryAction || secondaryAction) && (
            <div className="mt-6 flex gap-3 justify-center">
              {primaryAction}
              {secondaryAction}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Empty;

// Usage Example
//   <Empty variant="no-data" />

//             <Empty
//                 card
//                 fullPage
//                 title="No Messages"
//                 description="Your inbox is empty"
//                 primaryAction={<button className="btn-primary">Try Again</button>}
//             />

//             <Empty
//                 variant="custom"
//                 bgColor="#f3f4f6"
//                 textColor="#1f2937"
//             />