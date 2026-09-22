// ─── Chart Primitives ─────────────────────────────────────────────────────────
// All theme-aware, fully typed, recharts-based reusable chart components.
//
// Usage:
//   import { AreaChartWidget, BarChartWidget, KpiCard } from "@/ui/charts";

export { ChartCard } from "./ChartCard";
export type { ChartCardProps } from "./ChartCard";

export { ChartTooltip } from "./ChartTooltip";

export { AreaChartWidget } from "./AreaChartWidget";
export type { AreaChartWidgetProps, AreaSeries } from "./AreaChartWidget";

export { BarChartWidget } from "./BarChartWidget";
export type { BarChartWidgetProps, BarSeries } from "./BarChartWidget";

export { LineChartWidget } from "./LineChartWidget";
export type { LineChartWidgetProps, LineSeries } from "./LineChartWidget";

export { DonutChartWidget } from "./DonutChartWidget";
export type { DonutChartWidgetProps, DonutSlice } from "./DonutChartWidget";

export { RadialBarWidget } from "./RadialBarWidget";
export type { RadialBarWidgetProps, RadialBarItem } from "./RadialBarWidget";

export { ComposedChartWidget } from "./ComposedChartWidget";
export type { ComposedChartWidgetProps, ComposedSeries, ComposedBarSeries, ComposedLineSeries } from "./ComposedChartWidget";

export { FunnelWidget } from "./FunnelWidget";
export type { FunnelWidgetProps, FunnelStep } from "./FunnelWidget";

export { KpiCard } from "./KpiCard";
export type { KpiCardProps } from "./KpiCard";