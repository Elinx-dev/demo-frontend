import React from "react";
import { useTheme } from "@/ui/theme/ThemeContext";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface KpiCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  sublabel?: string;
  icon?: React.ReactNode;
  delta?: number;             // positive = up, negative = down, 0 = flat
  change?: string | number;
  positive?: boolean;
  deltaLabel?: string;        // e.g. "vs last month"
  onClick?: () => void;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subLabel,
  sublabel,
  icon,
  delta,
  change,
  positive,
  deltaLabel,
  onClick,
  className = "",
}) => {
  const { theme } = useTheme();
  const c = theme.colors;

  const normalizedDelta =
    delta ??
    (change !== undefined && change !== null
      ? Number(String(change).replace("%", ""))
      : undefined);
  const hasDelta = normalizedDelta !== undefined && normalizedDelta !== null && !Number.isNaN(normalizedDelta);
  const isUp = hasDelta && (positive ?? normalizedDelta > 0);
  const isDown = hasDelta && positive === false;
  const deltaColor = isUp ? c.successText : isDown ? c.dangerText : c.textMuted;
  const deltaBg    = isUp ? c.successBg   : isDown ? c.dangerBg   : c.primaryLight;
  const DeltaIcon  = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const deltaSign  = isUp ? "+" : "";
  const resolvedSubLabel = subLabel ?? sublabel;

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: c.surface,
        border: `1px solid ${c.primaryBorder}`,
        borderRadius: 12,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        cursor: onClick ? "pointer" : "default",
        transition: `box-shadow ${theme.motion.duration.fast}, border-color ${theme.motion.duration.fast}`,
        boxShadow: "0 1px 3px rgba(23,33,66,0.08)",
        fontFamily: "var(--ipc-font-sans)",
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(23,33,66,0.12)";
          e.currentTarget.style.borderColor = c.primaryBorder;
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(23,33,66,0.08)";
        e.currentTarget.style.borderColor = c.primaryBorder;
      }}
    >
      {/* Top row: label + icon */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", lineHeight: 1 }}>
            {label}
          </p>
          {resolvedSubLabel && (
            <p style={{ margin: "3px 0 0", fontSize: 11, color: c.textMuted, lineHeight: 1.3 }}>
              {resolvedSubLabel}
            </p>
          )}
        </div>
        {icon && (
          <div style={{ color: c.textMuted, flexShrink: 0, marginTop: 1 }}>
            {icon}
          </div>
        )}
      </div>

      {/* KPI number - Playfair Display */}
      <p
        style={{
          margin: 0,
          fontSize: 32,
          fontWeight: 700,
          color: c.text,
          lineHeight: 1,
          fontFamily: "var(--ipc-font-display)",  // Playfair Display
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </p>

      {/* Delta badge */}
      {hasDelta && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              padding: "2px 7px",
              borderRadius: 999,
              background: deltaBg,
              color: deltaColor,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <DeltaIcon size={11} />
            {deltaSign}{Math.abs(normalizedDelta!)}%
          </span>
          {deltaLabel && (
            <span style={{ fontSize: 11, color: c.textMuted }}>
              {deltaLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default KpiCard;

/*
USAGE EXAMPLES:
  <KpiCard label="Total IPs" value={28} subLabel="All registered IP assets" icon={<Briefcase size={18} />} />
  <KpiCard label="Owned" value={22} delta={12} deltaLabel="vs last month" icon={<Star size={18} />} />
  <KpiCard label="Licensed" value={12} delta={-3} deltaLabel="vs last month" />
*/
