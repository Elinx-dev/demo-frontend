import { CheckCircle2, AlertTriangle, XCircle, Info, UserRound } from "lucide-react";
import type { SlateHistoryEntry } from "../types/slate.types";

const KIND_COLOR: Record<string, string> = {
  ok: "#1C7A4E",
  warn: "#B8722E",
  danger: "#B0392F",
  info: "#B8923D",
};

function kindIcon(kind: string) {
  if (kind === "ok") return <CheckCircle2 size={11} />;
  if (kind === "warn") return <AlertTriangle size={11} />;
  if (kind === "danger") return <XCircle size={11} />;
  return <Info size={11} />;
}

export default function Timeline({ items }: { items: SlateHistoryEntry[] }) {
  return (
    <div style={{ position: "relative", paddingLeft: 28 }}>
      <div style={{ position: "absolute", left: 9, top: 4, bottom: 4, width: 2, background: "#dee2e6" }} />
      <div className="flex flex-col gap-3">
        {items.map((h, i) => {
          const color = KIND_COLOR[h.kind] ?? KIND_COLOR.info;
          return (
            <div key={i} style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: -28,
                  top: 10,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  border: `2px solid ${color}`,
                  color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1,
                }}
              >
                {kindIcon(h.kind)}
              </div>
              <div
                style={{
                  borderRadius: 10,
                  border: `1px solid ${color}30`,
                  background: `${color}0a`,
                  padding: "12px 14px",
                }}
              >
                <div className="flex items-center justify-between gap-3" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 13.3, fontWeight: 700, color: "#161b22" }}>{h.action}</span>
                  <span style={{ fontSize: 10.5, color: "#9aa1a9", fontFamily: "monospace", whiteSpace: "nowrap" }}>{h.ts}</span>
                </div>
                <div style={{ fontSize: 12.3, color: "#545c66", lineHeight: 1.55 }}>{h.detail}</div>
                <div className="flex items-center gap-1.5" style={{ fontSize: 10.8, color: "#9aa1a9", marginTop: 8 }}>
                  <UserRound size={11} /> {h.actor}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
