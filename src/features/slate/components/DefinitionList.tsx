import type { ReactNode } from "react";

export function DlGrid({ children }: { children: ReactNode }) {
  return <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px", margin: 0 }}>{children}</dl>;
}

export function DlRow({ label, value, full }: { label: string; value: ReactNode; full?: boolean }) {
  return (
    <div style={full ? { gridColumn: "1 / -1" } : undefined}>
      <dt style={{ fontSize: 11.3, textTransform: "uppercase", letterSpacing: ".04em", color: "#717881", fontWeight: 600, marginBottom: 3 }}>{label}</dt>
      <dd style={{ margin: 0, fontSize: 13.3, color: "#161b22", fontWeight: 500 }}>{value}</dd>
    </div>
  );
}
