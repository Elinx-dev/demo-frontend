import React from "react";
import { useTheme } from "@/ui/theme/ThemeContext";
import { ChartCard, type ChartCardProps } from "./ChartCard";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FunnelStep {
    label: string;
    value: number;
    color?: string;
}

export interface FunnelWidgetProps
    extends Omit<ChartCardProps, "children"> {
    data: FunnelStep[];
    /** Show drop-off conversion rates between stages below the bars */
    showConversionRates?: boolean;
    valueFormatter?: (value: number) => string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const FunnelWidget: React.FC<FunnelWidgetProps> = ({
    data,
    showConversionRates = true,
    valueFormatter,
    ...cardProps
}) => {
    const { theme } = useTheme();
    const c = theme.colors;

    const defaultColors = [c.accent, "#0ea5e9", c.success, "#f97316", "#a78bfa"];
    const resolved = data.map((d, i) => ({
        ...d,
        color: d.color ?? defaultColors[i % defaultColors.length],
    }));

    const topValue = data[0]?.value ?? 1;

    // Build conversion pairs between adjacent stages
    const conversions = data.slice(1).map((step, i) => {
        const prev = data[i].value;
        const rate = prev > 0 ? Math.round((step.value / prev) * 100) : 0;
        return { from: data[i].label, to: step.label, rate };
    });

    return (
        <ChartCard {...cardProps}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {resolved.map((d) => {
                    const pct = Math.round((d.value / topValue) * 100);
                    return (
                        <div key={d.label}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{d.label}</span>
                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                    <span style={{ fontSize: 11, color: c.textMuted, fontFamily: "inherit" }}>
                                        {valueFormatter ? valueFormatter(d.value) : d.value.toLocaleString()}
                                    </span>
                                    <span style={{
                                        fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                                        color: d.color, minWidth: 30, textAlign: "right",
                                    }}>
                                        {pct}%
                                    </span>
                                </div>
                            </div>
                            <div style={{ height: 10, borderRadius: 99, background: c.primaryBorder, overflow: "hidden" }}>
                                <div style={{
                                    height: "100%",
                                    width: `${pct}%`,
                                    background: `linear-gradient(90deg, ${d.color}, ${d.color}bb)`,
                                    borderRadius: 99,
                                    transition: "width 0.7s ease",
                                }} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Conversion rates row */}
            {showConversionRates && conversions.length > 0 && (
                <div style={{
                    display: "flex", gap: 12, flexWrap: "wrap",
                    marginTop: 20, paddingTop: 16,
                    borderTop: `1px solid ${c.primaryBorder}`,
                }}>
                    {conversions.map((conv) => (
                        <div key={conv.to} style={{ flex: 1, textAlign: "center", minWidth: 60 }}>
                            <p style={{ fontSize: 18, fontWeight: 800, color: c.accent, margin: 0, fontFamily: "inherit" }}>
                                {conv.rate}%
                            </p>
                            <p style={{ fontSize: 9.5, color: c.textMuted, margin: "3px 0 0", lineHeight: 1.4 }}>
                                {conv.from} → {conv.to}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </ChartCard>
    );
};