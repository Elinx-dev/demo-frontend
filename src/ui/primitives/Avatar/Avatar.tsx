import React from "react";
import { User } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";

type AvatarStatus = "online" | "offline" | "busy" | "away";

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string; // for initials fallback
  icon?: React.ReactNode;

  size?: number; // px
  shape?: "circle" | "rounded" | "square";

  bgColor?: string;
  textColor?: string;

  border?: string;
  ring?: string;
  shadow?: string;

  status?: AvatarStatus;
  badge?: React.ReactNode;

  clickable?: boolean;
  onClick?: () => void;

  loading?: boolean;

  className?: string;
}

const getInitials = (name?: string) => {
  if (!name) return "";
  const parts = name.split(" ");
  return parts.length === 1
    ? parts[0][0]
    : parts[0][0] + parts[1][0];
};

const getStatusColor = (status?: AvatarStatus) => {
  switch (status) {
    case "online":
      return "bg-green-500";
    case "offline":
      return "bg-gray-400";
    case "busy":
      return "bg-red-500";
    case "away":
      return "bg-yellow-400";
    default:
      return "";
  }
};

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "avatar",
  name,
  icon,
  size = 40,
  shape = "circle",
  bgColor,
  textColor,
  border,
  ring,
  shadow,
  status,
  badge,
  clickable = false,
  onClick,
  loading = false,
  className = "",
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  // Default theme-based colors
  const finalBgColor = bgColor ?? colors.surface; 
  const finalTextColor = textColor ?? colors.text;

  const shapeClass =
    shape === "circle"
      ? "rounded-full"
      : shape === "rounded"
      ? "rounded-xl"
      : "rounded-none";

  const dimension = {
    width: size,
    height: size,
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center ${shapeClass} ${border ?? ""} ${ring ?? ""} ${shadow ?? ""} ${clickable ? "cursor-pointer" : ""} ${className}`}
      style={dimension}
      onClick={clickable ? onClick : undefined}
    >
      {loading ? (
        <div className="animate-pulse w-full h-full bg-gray-300 rounded-full" />
      ) : src ? (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover ${shapeClass}`}
        />
      ) : icon ? (
        <div
          className={`flex items-center justify-center w-full h-full ${shapeClass}`}
          style={{ backgroundColor: finalBgColor, color: finalTextColor }}
        >
          {icon}
        </div>
      ) : (
        <div
          className={`flex items-center justify-center w-full h-full font-semibold ${shapeClass}`}
          style={{ backgroundColor: finalBgColor, color: finalTextColor }}
        >
          {getInitials(name) || <User size={size * 0.5} />}
        </div>
      )}

      {/* Status Dot */}
      {status && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${getStatusColor(
            status
          )}`}
        />
      )}

      {/* Badge */}
      {badge && (
        <div className="absolute -top-1 -right-1">
          {badge}
        </div>
      )}
    </div>
  );
};

export default Avatar;

// usage example:
{/* <Avatar
  icon={<User size={20} />}
  bgColor="#E0D7FF"      // optional: overrides theme
  textColor="#5C3AFF"
  size={40}
/> 
  <Avatar
  icon={<User size={20} />}
  size={40}
/>
*/}