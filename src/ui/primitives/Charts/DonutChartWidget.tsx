import React from "react";
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/ui/theme/ThemeContext";
import { ChartCard, type ChartCardProps } from "./ChartCard";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DonutSlice {
    name: string;
    value: number;
    color?: string;
}

export interface DonutChartWidgetProps
    extends Omit<ChartCardProps, "children"> {
    data: DonutSlice[];
    height?: number;
    /** Inner radius (0 = full pie). Default 55 */
    innerRadius?: number;
    /** Outer radius. Default 90 */
    outerRadius?: number;
    /** Show progress bars alongside the legend */
    showLegendBars?: boolean;
    /** Center label - shown inside the donut hole */
    centerLabel?: string;
    centerSubLabel?: string;
    tooltipFormatter?: (value: number, name: string) => string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const DonutChartWidget: React.FC<DonutChartWidgetProps> = ({
    data,
    height = 220,
    innerRadius = 55,
    outerRadius = 90,
    showLegendBars = true,
    centerLabel,
    centerSubLabel,
    tooltipFormatter,
    ...cardProps
}) => {
    const { theme } = useTheme();
    const c = theme.colors;

    const defaultColors = [c.accent, "#0ea5e9", c.success, "#f97316", "#a78bfa", c.danger];
    const resolved = data.map((d, i) => ({
        ...d,
        color: d.color ?? defaultColors[i % defaultColors.length],
    }));
    const total = data.reduce((s, d) => s + d.value, 0);

    return (
        <ChartCard {...cardProps}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                {/* Donut */}
                <div style={{ flexShrink: 0, position: "relative" }}>
                    <ResponsiveContainer width={height} height={height}>
                        <PieChart>
                            <Pie
                                data={resolved}
                                cx="50%" cy="50%"
                                innerRadius={innerRadius}
                                outerRadius={outerRadius}
                                paddingAngle={3}
                                dataKey="value"
                                strokeWidth={0}
                            >
                                {resolved.map((d, i) => (
                                    <Cell key={i} fill={d.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const p = payload[0];
                                    return (
                                        <div style={{ background: c.surface, border: `1px solid ${c.primaryBorder}`, borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
                                            <p style={{ color: p.payload.color, fontWeight: 700, margin: 0 }}>
                                                {p.name}
                                            </p>
                                            <p style={{ color: c.text, margin: "2px 0 0", fontFamily: "inherit" }}>
                                                {tooltipFormatter
                                                    ? tooltipFormatter(p.value as number, p.name as string)
                                                    : `${p.value} (${Math.round((p.value as number / total) * 100)}%)`
                                                }
                                            </p>
                                        </div>
                                    );
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center label overlay */}
                    {centerLabel && (
                        <div style={{
                            position: "absolute",
                            top: "50%", left: "50%",
                            transform: "translate(-50%, -50%)",
                            textAlign: "center",
                            pointerEvents: "none",
                        }}>
                            <p style={{ fontSize: 18, fontWeight: 800, color: c.text, margin: 0, fontFamily: "inherit", lineHeight: 1 }}>
                                {centerLabel}
                            </p>
                            {centerSubLabel && (
                                <p style={{ fontSize: 10, color: c.textMuted, margin: "3px 0 0" }}>
                                    {centerSubLabel}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                    {resolved.map((d) => {
                        const pct = Math.round((d.value / total) * 100);
                        return (
                            <div key={d.name}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                        <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                                        <span style={{ fontSize: 12, color: c.text, fontWeight: 500 }}>{d.name}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        {showLegendBars && (
                                            <span style={{ fontSize: 11, color: c.textMuted, fontFamily: "inherit" }}>
                                                {d.value.toLocaleString()}
                                            </span>
                                        )}
                                        <span style={{ fontSize: 11, fontWeight: 700, color: d.color, fontFamily: "inherit", minWidth: 28, textAlign: "right" }}>
                                            {pct}%
                                        </span>
                                    </div>
                                </div>
                                {showLegendBars && (
                                    <div style={{ height: 4, borderRadius: 99, background: c.primaryBorder, overflow: "hidden" }}>
                                        <div style={{
                                            height: "100%",
                                            width: `${pct}%`,
                                            background: d.color,
                                            borderRadius: 99,
                                            transition: "width 0.6s ease",
                                        }} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </ChartCard>
    );
};