import React from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/ui/theme/ThemeContext";
import { ChartCard, type ChartCardProps } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AreaSeries {
    key: string;
    label: string;
    /** Hex color. Defaults to theme accent for first series, then theme success, etc. */
    color?: string;
    /** Opacity of the gradient fill (0–1). Default 0.2 */
    fillOpacity?: number;
}

export interface AreaChartWidgetProps
    extends Omit<ChartCardProps, "children"> {
    data: Record<string, any>[];
    /** The data key used for the X axis */
    xKey: string;
    series: AreaSeries[];
    height?: number;
    /** Recharts tickFormatter for Y axis labels, e.g. v => `₹${v/1000}k` */
    yTickFormatter?: (value: number) => string;
    /** Recharts formatter for tooltip values */
    tooltipFormatter?: (value: number, name: string) => string;
    curved?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AreaChartWidget: React.FC<AreaChartWidgetProps> = ({
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

    // Default color palette using theme colors
    const defaultColors = [c.accent, c.success, "#0ea5e9", "#f97316", "#a78bfa"];
    const resolvedSeries = series.map((s, i) => ({
        ...s,
        color: s.color ?? defaultColors[i % defaultColors.length],
        fillOpacity: s.fillOpacity ?? (i === 0 ? 0.22 : 0.12),
    }));

    return (
        <ChartCard {...cardProps}>
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                        {resolvedSeries.map((s) => (
                            <linearGradient key={s.key} id={`grad-area-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={s.color} stopOpacity={s.fillOpacity! * 1.4} />
                                <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                            </linearGradient>
                        ))}
                    </defs>

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
                        <Area
                            key={s.key}
                            type={curved ? "monotone" : "linear"}
                            dataKey={s.key}
                            name={s.label}
                            stroke={s.color}
                            strokeWidth={2.5}
                            fill={`url(#grad-area-${s.key})`}
                            dot={false}
                            activeDot={{ r: 5, fill: s.color, strokeWidth: 0 }}
                        />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </ChartCard>
    );
};