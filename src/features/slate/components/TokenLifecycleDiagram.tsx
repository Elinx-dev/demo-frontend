import { ArrowRight, ArrowDown, ArrowUp } from "lucide-react";
import type { ReactNode } from "react";

const COLORS = {
  initial: { bg: "#eceef0", border: "#d7dadd", text: "#545c66" },
  live: { bg: "#eaf6ee", border: "#bfe6cc", text: "#1C7A4E" },
  restricted: { bg: "#fbf3e2", border: "#eed7a8", text: "#8f6a26" },
  frozen: { bg: "#fdf0ee", border: "#f1c6bd", text: "#B0392F" },
  structural: { bg: "#e9f1fb", border: "#c4dbf3", text: "#1d6f8c" },
};

function StateNode({ label, kind, sub }: { label: string; kind: keyof typeof COLORS; sub?: string }) {
  const c = COLORS[kind];
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 9,
        background: c.bg,
        border: `1.5px solid ${c.border}`,
        color: c.text,
        textAlign: "center",
        minWidth: 118,
      }}
    >
      <div style={{ fontSize: 12.5, fontWeight: 700 }}>{label}</div>
      {sub && <div style={{ fontSize: 9.5, marginTop: 2, opacity: 0.85 }}>{sub}</div>}
    </div>
  );
}

function Trigger({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 9.5, color: "#9aa1a9", textAlign: "center", padding: "0 4px", lineHeight: 1.3 }}>{children}</div>;
}

export default function TokenLifecycleDiagram() {
  return (
    <div className="flex flex-col gap-6" style={{ padding: "8px 4px" }}>
      <div className="flex items-center justify-center flex-wrap gap-2">
        <StateNode label="Draft" kind="initial" sub="legacy import" />
        <div className="flex flex-col items-center"><ArrowRight size={16} style={{ color: "#9aa1a9" }} /><Trigger>verify</Trigger></div>
        <StateNode label="Verified" kind="initial" sub="confirmed by dept" />
        <div className="flex flex-col items-center"><ArrowRight size={16} style={{ color: "#9aa1a9" }} /><Trigger>activate / MINT</Trigger></div>
        <StateNode label="Active" kind="live" sub="live, transactable" />
      </div>

      <div className="flex items-center justify-center" style={{ marginTop: -4 }}>
        <div style={{ width: 2, height: 22, background: "#dee2e6" }} />
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="flex flex-col items-center gap-1.5">
          <Trigger>mortgage / lien (FLAG)</Trigger>
          <ArrowDown size={14} style={{ color: "#9aa1a9" }} />
          <StateNode label="Transfer Blocked" kind="restricted" sub="no sale; otherwise active" />
          <ArrowUp size={14} style={{ color: "#9aa1a9" }} />
          <Trigger>release</Trigger>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Trigger>death cert (LOCK)</Trigger>
          <ArrowDown size={14} style={{ color: "#9aa1a9" }} />
          <StateNode label="Locked" kind="frozen" sub="no transactions" />
          <ArrowUp size={14} style={{ color: "#9aa1a9" }} />
          <Trigger>all heirs consent</Trigger>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Trigger>court case (FLAG)</Trigger>
          <ArrowDown size={14} style={{ color: "#9aa1a9" }} />
          <StateNode label="Disputed" kind="frozen" sub="frozen till court order" />
          <ArrowUp size={14} style={{ color: "#9aa1a9" }} />
          <Trigger>dismissed / order executed</Trigger>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Trigger>partition (SPLIT)</Trigger>
          <ArrowDown size={14} style={{ color: "#9aa1a9" }} />
          <StateNode label="Split" kind="structural" sub="child tokens become Active" />
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <div style={{ width: 2, height: 18, background: "#dee2e6" }} />
      </div>

      <div className="flex items-center justify-center flex-wrap gap-2">
        <Trigger>auction / acquisition, or parent replaced after Split / Merge</Trigger>
      </div>
      <div className="flex items-center justify-center">
        <StateNode label="Retired" kind="initial" sub="permanently deactivated" />
      </div>

      <div className="flex items-center justify-center gap-4 flex-wrap" style={{ marginTop: 4, paddingTop: 14, borderTop: "1px solid #eceef0" }}>
        {Object.entries({ "Initial / housekeeping": "initial", "Live & transactable": "live", "Restricted (encumbrance)": "restricted", "Frozen (death / dispute)": "frozen", "Structural change": "structural" } as const).map(([label, kind]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[kind].bg, border: `1.5px solid ${COLORS[kind].border}` }} />
            <span style={{ fontSize: 10.5, color: "#717881" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
