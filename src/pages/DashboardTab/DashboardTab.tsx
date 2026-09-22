import React from "react";
import { useTheme } from "@/ui/theme/ThemeContext";
import { AreaChartWidget, BarChartWidget, ComposedChartWidget, DonutChartWidget, FunnelWidget, KpiCard, LineChartWidget, RadialBarWidget } from "@/ui/primitives/Charts";


// ─── Static Data ──────────────────────────────────────────────────────────────

const revenueData = [
    { month: "Jan", revenue: 42000, expenses: 28000, profit: 14000 },
    { month: "Feb", revenue: 53000, expenses: 31000, profit: 22000 },
    { month: "Mar", revenue: 48000, expenses: 29000, profit: 19000 },
    { month: "Apr", revenue: 67000, expenses: 34000, profit: 33000 },
    { month: "May", revenue: 72000, expenses: 38000, profit: 34000 },
    { month: "Jun", revenue: 61000, expenses: 32000, profit: 29000 },
    { month: "Jul", revenue: 85000, expenses: 41000, profit: 44000 },
    { month: "Aug", revenue: 91000, expenses: 44000, profit: 47000 },
    { month: "Sep", revenue: 78000, expenses: 39000, profit: 39000 },
    { month: "Oct", revenue: 94000, expenses: 46000, profit: 48000 },
    { month: "Nov", revenue: 102000, expenses: 49000, profit: 53000 },
    { month: "Dec", revenue: 118000, expenses: 52000, profit: 66000 },
];

const trafficData = [
    { day: "Mon", organic: 3200, paid: 1400, direct: 800 },
    { day: "Tue", organic: 4100, paid: 1800, direct: 1100 },
    { day: "Wed", organic: 3800, paid: 2200, direct: 900 },
    { day: "Thu", organic: 5200, paid: 2600, direct: 1400 },
    { day: "Fri", organic: 4900, paid: 2100, direct: 1300 },
    { day: "Sat", organic: 3100, paid: 1300, direct: 700 },
    { day: "Sun", organic: 2400, paid: 900, direct: 600 },
];

const categoryData = [
    { name: "Enterprise", value: 38 },
    { name: "Pro", value: 29 },
    { name: "Starter", value: 21 },
    { name: "Free", value: 12 },
];

const performanceData = [
    { label: "Uptime", value: 99.8, color: "#22c55e" },
    { label: "CSAT", value: 94.2, color: "#0ea5e9" },
    { label: "NPS", value: 87.5, color: "#a78bfa" },
    { label: "Speed", value: 96.1, color: "#f97316" },
];

const activityData = [
    { hour: "00", events: 120 }, { hour: "03", events: 45 },
    { hour: "06", events: 280 }, { hour: "09", events: 820 },
    { hour: "12", events: 1240 }, { hour: "15", events: 980 },
    { hour: "18", events: 1100 }, { hour: "21", events: 640 },
    { hour: "24", events: 210 },
];

const conversionData = [
    { label: "Visitors", value: 94200 },
    { label: "Leads", value: 31400 },
    { label: "Trials", value: 12600 },
    { label: "Paid", value: 4800 },
];

// ─── DashboardTab ─────────────────────────────────────────────────────────────

export const DashboardTab: React.FC = () => {
    const { theme } = useTheme();
    const accent = theme.colors.accent;

    const currencyFmt = (v: number) => `₹${(v / 1000).toFixed(0)}k`;
    const countFmt = (v: number) => `${(v / 1000).toFixed(1)}k`;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="fade-up">

            {/* ── Row 0: KPI Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                <KpiCard
                    label="Total Revenue" value="₹8.14L"
                    change="18.4%" positive
                    sublabel="vs last month" icon="💰"
                />
                <KpiCard
                    label="Active Users" value="24,931"
                    change="6.2%" positive
                    sublabel="vs last month" icon="👥"
                />
                <KpiCard
                    label="Conversion Rate" value="5.09%"
                    change="0.3%" positive={false}
                    sublabel="vs last month" icon="🎯"
                />
                <KpiCard
                    label="Avg. Session" value="4m 32s"
                    change="12.1%" positive
                    sublabel="vs last month" icon="⏱"
                />
            </div>

            {/* ── Row 1: Area + Radial ── */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>

                {/* AreaChartWidget - revenue + profit over 12 months */}
                <AreaChartWidget
                    title="Revenue Overview"
                    subtitle="12-month P&L breakdown"
                    data={revenueData}
                    xKey="month"
                    yTickFormatter={currencyFmt}
                    tooltipFormatter={currencyFmt}
                    series={[
                        { key: "revenue", label: "Revenue" },
                        { key: "profit", label: "Profit" },
                    ]}
                    height={260}
                />

                {/* RadialBarWidget - system health */}
                <RadialBarWidget
                    title="System Health"
                    subtitle="Live performance metrics"
                    data={performanceData}
                    height={200}
                    shape="half"
                />
            </div>

            {/* ── Row 2: Stacked Bar + Donut ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                {/* BarChartWidget - stacked weekly traffic */}
                <BarChartWidget
                    title="Weekly Traffic Sources"
                    subtitle="Organic · Paid · Direct"
                    data={trafficData}
                    xKey="day"
                    yTickFormatter={countFmt}
                    tooltipFormatter={countFmt}
                    series={[
                        { key: "organic", label: "Organic", stackId: "a" },
                        { key: "paid", label: "Paid", stackId: "a", color: "#0ea5e9" },
                        { key: "direct", label: "Direct", stackId: "a", color: "#22c55e" },
                    ]}
                    height={240}
                />

                {/* DonutChartWidget - plan distribution */}
                <DonutChartWidget
                    title="Plan Distribution"
                    subtitle="Active subscription breakdown"
                    data={categoryData}
                    height={200}
                    innerRadius={55}
                    outerRadius={88}
                    showLegendBars
                    centerLabel="100%"
                    centerSubLabel="of plans"
                />
            </div>

            {/* ── Row 3: Composed + Activity Bar ── */}
            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }}>

                {/* ComposedChartWidget - revenue/expenses bars + profit line */}
                <ComposedChartWidget
                    title="Revenue vs Expenses"
                    subtitle="Monthly comparison with profit trend"
                    data={revenueData}
                    xKey="month"
                    yTickFormatter={currencyFmt}
                    tooltipFormatter={currencyFmt}
                    series={[
                        { key: "revenue", label: "Revenue", type: "bar", opacity: 0.55 },
                        { key: "expenses", label: "Expenses", type: "bar", color: "#ef4444", opacity: 0.45 },
                        { key: "profit", label: "Profit", type: "line", color: "#22c55e", strokeWidth: 2.5, showDots: true },
                    ]}
                    height={250}
                />

                {/* BarChartWidget - hourly activity with intensity cell coloring */}
                <BarChartWidget
                    title="Activity by Hour"
                    subtitle="Event volume throughout the day"
                    data={activityData}
                    xKey="hour"
                    series={[{ key: "events", label: "Events" }]}
                    height={250}
                    barSize={20}
                    // Cell color intensity: dark accent for peak, faded for quiet hours
                    cellColorFn={(_i, value) =>
                        value > 900 ? accent
                            : value > 500 ? `${accent}99`
                                : `${accent}40`
                    }
                />
            </div>

            {/* ── Row 4: Funnel + Multi-line ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                {/* FunnelWidget - conversion pipeline */}
                <FunnelWidget
                    title="Conversion Funnel"
                    subtitle="Visitor → Paid customer pipeline"
                    data={conversionData}
                    showConversionRates
                    valueFormatter={v => v.toLocaleString()}
                />

                {/* LineChartWidget - multi-line channel performance */}
                <LineChartWidget
                    title="Channel Performance"
                    subtitle="Week-over-week sessions by source"
                    data={trafficData}
                    xKey="day"
                    yTickFormatter={countFmt}
                    tooltipFormatter={countFmt}
                    series={[
                        { key: "organic", label: "Organic", showDots: true, dotRadius: 4 },
                        { key: "paid", label: "Paid", color: "#0ea5e9", strokeDasharray: "5 3", dotRadius: 3 },
                        { key: "direct", label: "Direct", color: "#22c55e", strokeDasharray: "2 2", dotRadius: 3 },
                    ]}
                    height={260}
                />
            </div>
        </div>
    );
};