import React from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/ui/theme/ThemeContext";
import { ChartCard, type ChartCardProps } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LineSeries {
    key: string;
    label: string;
    color?: string;
    strokeWidth?: number;
    /** e.g. "5 3" for dashed, "2 2" for dotted, undefined for solid */
    strokeDasharray?: string;
    /** Show dots on the line */
    showDots?: boolean;
    dotRadius?: number;
}

export interface LineChartWidgetProps
    extends Omit<ChartCardProps, "children"> {
    data: Record<string, any>[];
    xKey: string;
    series: LineSeries[];
    height?: number;
    yTickFormatter?: (value: number) => string;
    tooltipFormatter?: (value: number, name: string) => string;
    curved?: boolean;
    referenceLines?: Array<{ y: number; label: string; color?: string }>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const LineChartWidget: React.FC<LineChartWidgetProps> = ({
    data,
    xKey,
    series,
    height = 260,
    yTickFormatter,
    tooltipFormatter,
    curved = true,
    ...cardProps
}) => {
    const { theme } = useTheme();
    const c = theme.colors;

    const defaultColors = [c.accent, "#0ea5e9", c.success, "#f97316", "#a78bfa"];
    const resolvedSeries = series.map((s, i) => ({
        showDots: true,
        dotRadius: 3,
        strokeWidth: 2,
        ...s,
        color: s.color ?? defaultColors[i % defaultColors.length],
    }));

    return (
        <ChartCard {...cardProps}>
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={c.primaryBorder} vertical={false} />

                    <XAxis
                        dataKey={xKey}
                        tick={{ fontSize: 11, fill: c.textMuted }}
                        axisLine={false} tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: c.textMuted }}
                        axisLine={false} tickLine={false}
                        tickFormatter={yTickFormatter}
                        width={yTickFormatter ? 52 : 36}
                    />

                    <Tooltip
                        content={<ChartTooltip formatter={tooltipFormatter} />}
                        cursor={{ stroke: c.primaryBorder, strokeWidth: 1 }}
                    />

                    <Legend
                        iconType="circle" iconSize={8}
                        wrapperStyle={{ fontSize: 11, color: c.textMuted, paddingTop: 12 }}
                    />

                    {resolvedSeries.map((s) => (
                        <Line
                            key={s.key}
                            type={curved ? "monotone" : "linear"}
                            dataKey={s.key}
                            name={s.label}
                            stroke={s.color}
                            strokeWidth={s.strokeWidth}
                            strokeDasharray={s.strokeDasharray}
                            dot={s.showDots
                                ? { r: s.dotRadius, fill: s.color, strokeWidth: 0 }
                                : false
                            }
                            activeDot={{ r: (s.dotRadius ?? 3) + 2, fill: s.color, strokeWidth: 0 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </ChartCard>
    );
};