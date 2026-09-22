import React, { useState, type CSSProperties } from "react";
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";

type Variant = "info" | "success" | "warning" | "error" | "custom";

interface AnnouncementProps {
  title?: React.ReactNode;
  description?: React.ReactNode;

  variant?: Variant;
  icon?: React.ReactNode;

  bgColor?: string;
  textColor?: string;
  borderColor?: string;

  shadow?: string;
  rounded?: string;

  fullWidth?: boolean;
  banner?: boolean; // fixed top banner
  dismissible?: boolean;
  defaultVisible?: boolean;

  action?: React.ReactNode;

  className?: string;
}

const variantDefaults:any = {
  info: { icon: <Info size={20} /> },
  success: { icon: <CheckCircle size={20} /> },
  warning: { icon: <AlertTriangle size={20} /> },
  error: { icon: <AlertCircle size={20} /> },
};

const Announcement: React.FC<AnnouncementProps> = ({
  title,
  description,
  variant = "info",
  icon,
  bgColor,
  textColor,
  borderColor,
  shadow = "shadow-sm",
  rounded = "rounded-lg",
  fullWidth = true,
  banner = false,
  dismissible = false,
  defaultVisible = true,
  action,
  className = "",
}) => {
  const [visible, setVisible] = useState(defaultVisible);
  const { theme } = useTheme();
  const c = theme.colors;

  if (!visible) return null;

  // Theme-aware defaults
  const defaultBg =
    variant === "custom"
      ? c.surface
      : variant === "info"
      ? "#DBEAFE" // fallback if you want light Tailwind-like
      : variant === "success"
      ? "#D1FAE5"
      : variant === "warning"
      ? "#FEF3C7"
      : variant === "error"
      ? "#FEE2E2"
      : c.surface;

  const defaultText =
    variant === "custom"
      ? c.text
      : variant === "info"
      ? "#1E3A8A"
      : variant === "success"
      ? "#065F46"
      : variant === "warning"
      ? "#78350F"
      : variant === "error"
      ? "#991B1B"
      : c.text;

  const defaultBorder =
    variant === "custom"
      ? c.primaryBorder
      : variant === "info"
      ? "#BFDBFE"
      : variant === "success"
      ? "#A7F3D0"
      : variant === "warning"
      ? "#FCD34D"
      : variant === "error"
      ? "#FECACA"
      : c.primaryBorder;

  const style: CSSProperties = {
    background: bgColor ?? defaultBg,
    color: textColor ?? defaultText,
    borderColor: borderColor ?? defaultBorder,
  };

  return (
    <div
      className={`
        ${fullWidth ? "w-full" : "inline-flex"}
        ${banner ? "fixed top-0 left-0 right-0 z-50" : ""}
        border p-4 flex items-start gap-3
        ${shadow} ${rounded}
        ${className}
      `}
      style={style}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">{icon ?? variantDefaults[variant]?.icon}</div>

      {/* Content */}
      <div className="flex-1">
        {title && <div className="font-semibold">{title}</div>}
        {description && (
          <div className="text-sm mt-1 opacity-90">{description}</div>
        )}
      </div>

      {/* Action */}
      {action && <div className="ml-4">{action}</div>}

      {/* Close Button */}
      {dismissible && (
        <button
          onClick={() => setVisible(false)}
          className="ml-2 hover:opacity-70 transition"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default Announcement;

// Usage Example
//  <Announcement
//   title="Info Notice"
//   description="This uses the current theme colors."
//   variant="custom"
// />
