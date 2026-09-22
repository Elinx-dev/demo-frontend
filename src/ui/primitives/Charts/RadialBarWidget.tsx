import React from "react";
import {
    RadialBarChart, RadialBar, Tooltip, ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/ui/theme/ThemeContext";
import { ChartCard, type ChartCardProps } from "./ChartCard";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RadialBarItem {
    label: string;
    value: number;   // 0–100
    color?: string;
}

export interface RadialBarWidgetProps
    extends Omit<ChartCardProps, "children"> {
    data: RadialBarItem[];
    height?: number;
    /** "full" = 360° circle, "half" = 180° semicircle. Default "half" */
    shape?: "full" | "half";
}

// ─── Component ────────────────────────────────────────────────────────────────

export const RadialBarWidget: React.FC<RadialBarWidgetProps> = ({
    data,
    height = 240,
    shape = "half",
    ...cardProps
}) => {
    const { theme } = useTheme();
    const c = theme.colors;

    const defaultColors = [c.success, "#0ea5e9", "#a78bfa", "#f97316", c.accent, c.danger];
    const resolved = data.map((d, i) => ({
        ...d,
        fill: d.color ?? defaultColors[i % defaultColors.length],
    }));

    const startAngle = shape === "half" ? 180 : 90;
    const endAngle = shape === "half" ? 0 : -270;

    return (
        <ChartCard
            {...cardProps}
            footer={
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                    {resolved.map((d) => (
                        <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.fill, flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: c.textMuted, flex: 1 }}>{d.label}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: c.text, fontFamily: "inherit" }}>{d.value}%</span>
                        </div>
                    ))}
                </div>
            }
        >
            <ResponsiveContainer width="100%" height={height}>
                <RadialBarChart
                    innerRadius="18%"
                    outerRadius="90%"
                    data={resolved}
                    startAngle={startAngle}
                    endAngle={endAngle}
                >
                    <RadialBar
                        dataKey="value"
                        cornerRadius={6}
                        background={{ fill: c.primaryBorder }}
                        label={false}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                                <div style={{ background: c.surface, border: `1px solid ${c.primaryBorder}`, borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
                                    <p style={{ color: d.fill, fontWeight: 700, margin: 0 }}>{d.label}</p>
                                    <p style={{ color: c.text, margin: "2px 0 0", fontFamily: "inherit" }}>{d.value}%</p>
                                </div>
                            );
                        }}
                    />
                </RadialBarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
};