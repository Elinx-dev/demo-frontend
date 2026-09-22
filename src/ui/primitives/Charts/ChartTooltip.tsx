import React from "react";
import { useTheme } from "@/ui/theme/ThemeContext";

// ─── ChartTooltip ─────────────────────────────────────────────────────────────
// Drop this into any recharts <Tooltip content={...} /> prop.
// Automatically reads the theme - no need to pass `c` manually.
//
// Usage:
//   <Tooltip content={<ChartTooltip />} />

interface ChartTooltipProps {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color?: string }>;
    label?: string;
    formatter?: (value: number, name: string) => string;
    labelFormatter?: (label: string) => string;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
    active,
    payload,
    label,
    formatter,
    labelFormatter,
}) => {
    const { theme } = useTheme();
    const c = theme.colors;

    if (!active || !payload?.length) return null;

    return (
        <div
            style={{
                background: c.surface,
                border: `1px solid ${c.primaryBorder}`,
                borderRadius: 10,
                padding: "10px 14px",
                boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
                fontSize: 12,
                minWidth: 120,
            }}
        >
            {label && (
                <p style={{
                    color: c.textMuted,
                    margin: "0 0 6px",
                    fontWeight: 700,
                    fontSize: 10.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontFamily: "inherit",
                }}>
                    {labelFormatter ? labelFormatter(label) : label}
                </p>
            )}
            {payload.map((p) => (
                <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, margin: "3px 0" }}>
                    <span style={{ color: p.color ?? c.accent, fontWeight: 600 }}>{p.name}</span>
                    <span style={{ color: c.text, fontWeight: 700, fontFamily: "inherit" }}>
                        {formatter ? formatter(p.value, p.name) : p.value.toLocaleString()}
                    </span>
                </div>
            ))}
        </div>
    );
};