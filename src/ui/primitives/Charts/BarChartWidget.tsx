import React from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { useTheme } from "@/ui/theme/ThemeContext";
import { ChartCard, type ChartCardProps } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BarSeries {
    key: string;
    label: string;
    color?: string;
    /** Stack bars together using the same stackId */
    stackId?: string;
    radius?: [number, number, number, number];
}

export interface BarChartWidgetProps
    extends Omit<ChartCardProps, "children"> {
    data: Record<string, any>[];
    xKey: string;
    series: BarSeries[];
    height?: number;
    barSize?: number;
    layout?: "vertical" | "horizontal";
    yTickFormatter?: (value: number) => string;
    tooltipFormatter?: (value: number, name: string) => string;
    /** Per-bar cell coloring - pass a function that returns a hex color per data index */
    cellColorFn?: (index: number, value: number) => string;
    /** Show value labels on top of each bar */
    showValues?: boolean;
}

// ─── Custom Label ─────────────────────────────────────────────────────────────

const BarLabel = ({ x, y, width, value, fill }: any) => {
    if (!value) return null;
    return (
        <text x={x + width / 2} y={y - 4} textAnchor="middle" fontSize={10} fill={fill} fontWeight={700} fontFamily="inherit">
            {typeof value === "number" ? value.toLocaleString() : value}
        </text>
    );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const BarChartWidget: React.FC<BarChartWidgetProps> = ({
    data,
    xKey,
    series,
    height = 260,
    barSize = 22,
    layout = "horizontal",
    yTickFormatter,
    tooltipFormatter,
    cellColorFn,
    showValues = false,
    ...cardProps
}) => {
    const { theme } = useTheme();
    const c = theme.colors;

    const defaultColors = [c.accent, "#0ea5e9", c.success, "#f97316", "#a78bfa", c.danger];
    const resolvedSeries = series.map((s, i) => ({
        ...s,
        color: s.color ?? defaultColors[i % defaultColors.length],
        radius: s.radius ?? (i === series.length - 1 && s.stackId ? [4, 4, 0, 0] : s.stackId ? [0, 0, 0, 0] : [4, 4, 0, 0]),
    }));

    return (
        <ChartCard {...cardProps}>
            <ResponsiveContainer width="100%" height={height}>
                <BarChart
                    data={data}
                    layout={layout}
                    barSize={barSize}
                    margin={{ top: showValues ? 16 : 4, right: 8, bottom: 0, left: 0 }}
                    barCategoryGap="30%"
                >
                    <CartesianGrid strokeDasharray="3 3" stroke={c.primaryBorder} vertical={layout === "vertical"} horizontal={layout !== "vertical"} />

                    {layout === "horizontal" ? (
                        <>
                            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: c.textMuted }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: c.textMuted }} axisLine={false} tickLine={false} tickFormatter={yTickFormatter} width={yTickFormatter ? 52 : 36} />
                        </>
                    ) : (
                        <>
                            <XAxis type="number" tick={{ fontSize: 10, fill: c.textMuted }} axisLine={false} tickLine={false} tickFormatter={yTickFormatter} />
                            <YAxis type="category" dataKey={xKey} tick={{ fontSize: 11, fill: c.textMuted }} axisLine={false} tickLine={false} width={80} />
                        </>
                    )}

                    <Tooltip
                        content={<ChartTooltip formatter={tooltipFormatter} />}
                        cursor={{ fill: `${c.primaryBorder}55` }}
                    />

                    {resolvedSeries.length > 1 && (
                        <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11, color: c.textMuted, paddingTop: 12 }} />
                    )}

                    {resolvedSeries.map((s) => (
                        <Bar
                            key={s.key}
                            dataKey={s.key}
                            name={s.label}
                            fill={s.color}
                            radius={s.radius}
                            stackId={s.stackId}
                            label={showValues ? <BarLabel fill={c.textMuted} /> : undefined}
                        >
                            {/* Per-cell coloring (e.g. intensity heatmap) */}
                            {cellColorFn && data.map((_, i) => (
                                <Cell key={i} fill={cellColorFn(i, data[i][s.key])} />
                            ))}
                        </Bar>
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
};