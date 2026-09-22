import type { ReactNode } from "react";
import { Card } from "@/ui/primitives/Card/Card";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  foot?: string;
  footKind?: "up" | "warn" | "danger";
  accent?: string;
  pct?: number;
}

const FOOT_COLOR: Record<string, string> = {
  up: "#1C7A4E",
  warn: "#B8722E",
  danger: "#B0392F",
};

export default function KpiCard({ label, value, icon, foot, footKind, accent = "#1d4670", pct }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: accent }} />
      <div className="flex items-start justify-between">
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 700, color: "#717881" }}>{label}</div>
        <div style={{ color: accent }}>{icon}</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, marginTop: 6 }}>{value}</div>
      {foot && (
        <div style={{ fontSize: 12, marginTop: 4, color: footKind ? FOOT_COLOR[footKind] : "#717881" }}>{foot}</div>
      )}
      {typeof pct === "number" && (
        <div style={{ marginTop: 8 }}>
          <div style={{ height: 5, borderRadius: 3, background: "#eceef0", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, pct))}%`, background: accent, borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 10.5, color: "#9aa1a9", marginTop: 3 }}>{Math.round(pct)}% of total</div>
        </div>
      )}
    </Card>
  );
}
