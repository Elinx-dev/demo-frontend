import React from "react";
import { useTheme } from "../../theme/ThemeContext";

type StatusType = "active" | "expiring" | "expired" | "syncing" | "draft";

interface StatusDotProps {
  status: StatusType;
  /** Dot size in px. Default 8 */
  size?: number;
  /** Show label text next to dot */
  label?: string;
  /** Pulse animation for live/syncing state */
  pulse?: boolean;
  className?: string;
}

const StatusDot: React.FC<StatusDotProps> = ({
  status,
  size = 8,
  label,
  pulse = false,
  className = "",
}) => {
  const { theme } = useTheme();
  const c = theme.colors;

  const colorMap: Record<StatusType, string> = {
    active:   c.statusActive,
    expiring: c.statusExpiring,
    expired:  c.statusExpired,
    syncing:  c.statusSyncing,
    draft:    c.statusDraft,
  };

  const labelMap: Record<StatusType, string> = {
    active:   "Active",
    expiring: "Expiring Soon",
    expired:  "Expired",
    syncing:  "Syncing",
    draft:    "Draft",
  };

  const color = colorMap[status];
  const displayLabel = label ?? labelMap[status];

  return (
    <span
      className={`inline-flex items-center gap-[6px] ${className}`}
      title={displayLabel}
      aria-label={displayLabel}
    >
      <span
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
          display: "inline-block",
          boxShadow: `0 0 0 2px ${color}30`,
          animation: pulse ? "ipc-pulse 1.6s ease-in-out infinite" : "none",
        }}
      />
      {label !== undefined && (
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: color,
            fontFamily: "var(--ipc-font-sans)",
            lineHeight: 1,
          }}
        >
          {displayLabel}
        </span>
      )}

      <style>{`
        @keyframes ipc-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.25); }
        }
      `}</style>
    </span>
  );
};

export default StatusDot;

