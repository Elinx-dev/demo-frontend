import React from "react";
import {
    ComposedChart, Bar, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/ui/theme/ThemeContext";
import { ChartCard, type ChartCardProps } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ComposedBarSeries {
    key: string;
    label: string;
    type: "bar";
    color?: string;
    barSize?: number;
    stackId?: string;
    opacity?: number;
}

export interface ComposedLineSeries {
    key: string;
    label: string;
    type: "line";
    color?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    showDots?: boolean;
}

export type ComposedSeries = ComposedBarSeries | ComposedLineSeries;

export interface ComposedChartWidgetProps
    extends Omit<ChartCardProps, "children"> {
    data: Record<string, any>[];
    xKey: string;
    series: ComposedSeries[];
    height?: number;
    yTickFormatter?: (value: number) => string;
    tooltipFormatter?: (value: number, name: string) => string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ComposedChartWidget: React.FC<ComposedChartWidgetProps> = ({
    data,
    xKey,
    series,
    height = 260,
    yTickFormatter,
    tooltipFormatter,
    ...cardProps
}) => {
    const { theme } = useTheme();
    const c = theme.colors;

    const defaultColors = [c.accent, c.danger, c.success, "#0ea5e9", "#f97316"];
    const resolved = series.map((s, i) => ({
        ...s,
        color: s.color ?? defaultColors[i % defaultColors.length],
    }));

    return (
        <ChartCard {...cardProps}>
            <ResponsiveContainer width="100%" height={height}>
                <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke={c.primaryBorder} vertical={false} />

                    <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: c.textMuted }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: c.textMuted }} axisLine={false} tickLine={false} tickFormatter={yTickFormatter} width={yTickFormatter ? 52 : 36} />

                    <Tooltip
                        content={<ChartTooltip formatter={tooltipFormatter} />}
                        cursor={{ fill: `${c.primaryBorder}44` }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: c.textMuted, paddingTop: 12 }} />

                    {resolved.map((s) => {
                        if (s.type === "bar") {
                            const bs = s as ComposedBarSeries;
                            return (
                                <Bar
                                    key={bs.key}
                                    dataKey={bs.key}
                                    name={bs.label}
                                    fill={bs.color ? `${bs.color}${bs.opacity !== undefined ? Math.round(bs.opacity * 255).toString(16).padStart(2, "0") : "99"}` : c.accent}
                                    radius={[4, 4, 0, 0]}
                                    barSize={bs.barSize ?? 18}
                                    stackId={bs.stackId}
                                />
                            );
                        }

                        const ls = s as ComposedLineSeries;
                        return (
                            <Line
                                key={ls.key}
                                type="monotone"
                                dataKey={ls.key}
                                name={ls.label}
                                stroke={ls.color}
                                strokeWidth={ls.strokeWidth ?? 2.5}
                                strokeDasharray={ls.strokeDasharray}
                                dot={ls.showDots !== false
                                    ? { r: 3, fill: ls.color, strokeWidth: 0 }
                                    : false
                                }
                                activeDot={{ r: 5, fill: ls.color, strokeWidth: 0 }}
                            />
                        );
                    })}
                </ComposedChart>
            </ResponsiveContainer>
        </ChartCard>
    );
};