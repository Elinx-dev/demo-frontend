import React from "react";
import { useTheme } from "@/ui/theme/ThemeContext";

// ─── ChartCard ────────────────────────────────────────────────────────────────
// Shared wrapper for every chart. Provides the card shell, title/subtitle
// header, and optional footer slot - all theme-aware.

export interface ChartCardProps {
    title: string;
    subtitle?: string;
    /** Extra content rendered below the chart (legend, stats, etc.) */
    footer?: React.ReactNode;
    /** Pass a height number to control the chart area height (default 260) */
    height?: number;
    className?: string;
    style?: React.CSSProperties;
    children: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
    title,
    subtitle,
    footer,
    className,
    style,
    children,
}) => {
    const { theme } = useTheme();
    const c = theme.colors;

    return (
        <div
            className={className}
            style={{
                background: c.surface,
                border: `1px solid ${c.primaryBorder}`,
                borderRadius: 20,
                padding: "24px 24px 20px",
                boxShadow: `0 2px 12px ${c.accent}09`,
                transition: "background 0.25s, border-color 0.25s",
                ...style,
            }}
        >
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: c.text, margin: 0, lineHeight: 1.3 }}>
                    {title}
                </p>
                {subtitle && (
                    <p style={{ fontSize: 11, color: c.textMuted, margin: "3px 0 0", fontFamily: "inherit" }}>
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Chart content */}
            {children}

            {/* Optional footer */}
            {footer && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${c.primaryBorder}` }}>
                    {footer}
                </div>
            )}
        </div>
    );
};