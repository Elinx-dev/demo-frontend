import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Clock, CheckCircle2, XCircle, ArrowRight, Building2 } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { ROUTES } from "@/navigation/routes";
import { useSlateStore } from "../../state/SlateProvider";
import { slateApi } from "../../services/apiClient";
import DashboardHero from "../../components/DashboardHero";
import KpiCard from "../../components/KpiCard";
import type { OfficerQueueItem } from "../../types/slate.types";

const SLATE_PATHS = ROUTES.PATHS.APP.SLATE;

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending_tahsildar: { label: "Pending Approval", color: "#7c3aed", bg: "#f3e8ff" },
  approved:          { label: "Approved",          color: "#1C7A4E", bg: "#edf7f1" },
  vao_rejected:      { label: "VAO Rejected",      color: "#B0392F", bg: "#fef3f2" },
  exception:         { label: "Exception",          color: "#B0392F", bg: "#fef3f2" },
};

const QUICK_ACTIONS = [
  {
    label: "Verification Queue",
    desc: "Review pending patta mutation requests from VAO",
    icon: <ShieldCheck size={17} />,
    path: SLATE_PATHS.TAHSILDAR_VERIFICATION_QUEUE,
  },
  {
    label: "Property List",
    desc: "Browse all properties in your jurisdiction",
    icon: <Building2 size={17} />,
    path: SLATE_PATHS.TAHSILDAR_PROPERTIES,
  },
];

export default function TahsildarDashboardPage() {
  const { currentUser } = useSlateStore();
  const navigate = useNavigate();
  const [items, setItems] = useState<OfficerQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    slateApi.tahsildar.getVerificationQueue()
      .then(setItems)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const pending  = items.filter((i) => i.status === "pending_tahsildar");
  const approved = items.filter((i) => i.status === "approved");
  const rejected = items.filter((i) => ["vao_rejected", "exception"].includes(i.status));
  const snapshot = [...pending].slice(0, 6);

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <DashboardHero
          eyebrow="Thasildar Portal"
          title={`Welcome back, ${currentUser?.name ?? "Thasildar"}`}
          sub={currentUser?.role ?? "Thasildar"}
          accent="#1d4670"
          icon={<ShieldCheck size={22} />}
          meta={
            currentUser?.jurisdiction ? (
              <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: "rgba(255,255,255,.14)" }}>
                {currentUser.jurisdiction}
              </span>
            ) : undefined
          }
        />

        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)", margin: "16px 0 20px" }}>
          <KpiCard
            label="Pending Approval"
            value={loading ? "-" : pending.length}
            icon={<Clock size={18} />}
            accent="#7c3aed"
            foot={pending.length ? "Awaiting your review" : "All clear"}
            footKind={pending.length ? "warn" : "up"}
          />
          <KpiCard
            label="Total in Queue"
            value={loading ? "-" : items.length}
            icon={<ShieldCheck size={18} />}
            accent="#1d4670"
            foot="All submissions"
          />
          <KpiCard
            label="Approved"
            value={loading ? "-" : approved.length}
            icon={<CheckCircle2 size={18} />}
            accent="#1C7A4E"
            foot={approved.length ? "Patta generated" : undefined}
            footKind={approved.length ? "up" : undefined}
          />
          <KpiCard
            label="Rejected"
            value={loading ? "-" : rejected.length}
            icon={<XCircle size={18} />}
            accent="#B0392F"
            foot={rejected.length ? "Returned to citizen" : undefined}
          />
        </div>
      </div>

      <div className="grid gap-4 flex-1" style={{ gridTemplateColumns: "2fr 1fr", gridAutoRows: "1fr", minHeight: 0 }}>
        <Card style={{ overflowY: "auto", minHeight: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12, color: "#0F2A4A" }}>Quick actions</div>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                className="flex items-start gap-3 text-left"
                style={{ padding: 14, borderRadius: 9, border: "1px solid #dee2e6", background: "#fff", cursor: "pointer" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#eef2f8")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#fff")}
              >
                <div style={{ color: "#1d4670", flexShrink: 0, marginTop: 1 }}>{a.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#161b22" }}>{a.label}</div>
                  <div style={{ fontSize: 11.5, color: "#717881", marginTop: 2, lineHeight: 1.5 }}>{a.desc}</div>
                </div>
              </button>
            ))}

            <div style={{ padding: 14, borderRadius: 9, border: "1px solid #dee2e6", background: "#f5f8fd" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#717881", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={14} style={{ color: "#1d4670" }} /> Your jurisdiction
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F2A4A", marginBottom: 4 }}>
                {currentUser?.jurisdiction ?? "-"}
              </div>
              <div style={{ fontSize: 11.5, color: "#717881", lineHeight: 1.5 }}>
                {items.length} item{items.length !== 1 ? "s" : ""} total ·{" "}
                {pending.length} pending approval
              </div>
            </div>

            <div style={{ padding: 14, borderRadius: 9, border: "1px solid #dee2e6", background: "#fafbfc" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#717881", marginBottom: 8 }}>Mutation lifecycle</div>
              <div className="flex flex-col gap-1.5">
                {[
                  { step: "1", label: "Citizen submits sale deed", done: items.length > 0 },
                  { step: "2", label: "Registration Officer approves", done: items.length > 0 },
                  { step: "3", label: "VAO verifies & forwards", done: items.length > 0 },
                  { step: "4", label: "Thasildar approves & generates Patta", done: approved.length > 0 },
                ].map(({ step, label, done: isDone }) => (
                  <div key={step} className="flex items-center gap-2">
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: isDone ? "#edf7f1" : "#f0f2f4", color: isDone ? "#1C7A4E" : "#9aa1a9", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {isDone ? "✓" : step}
                    </div>
                    <div style={{ fontSize: 11.5, color: isDone ? "#1C7A4E" : "#717881", fontWeight: isDone ? 600 : 400 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 12, flexShrink: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F2A4A" }}>Pending queue</div>
            {snapshot.length > 0 && (
              <button
                onClick={() => navigate(SLATE_PATHS.TAHSILDAR_VERIFICATION_QUEUE)}
                style={{ fontSize: 11, fontWeight: 600, color: "#1d4670", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
              >
                View all <ArrowRight size={11} />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            <div className="flex flex-col gap-2">
              {snapshot.map((item) => {
                const sm = STATUS_META[item.status] ?? { label: item.status, color: "#545c66", bg: "#f5f5f5" };
                return (
                  <button
                    key={item.txnId}
                    onClick={() => navigate(SLATE_PATHS.TAHSILDAR_VERIFICATION_QUEUE)}
                    className="flex items-center justify-between text-left"
                    style={{ padding: "9px 10px", borderRadius: 7, border: "1px solid #eceef0", background: "#fafbfc", cursor: "pointer", width: "100%" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#eef2f8")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#fafbfc")}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0F2A4A", fontFamily: "monospace", marginBottom: 1 }}>{item.displayTxnId ?? item.txnId}</div>
                      <div style={{ fontSize: 11, color: "#717881", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.sellerName} → {item.buyerName}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: sm.bg, color: sm.color, whiteSpace: "nowrap", marginLeft: 8, flexShrink: 0 }}>
                      {sm.label}
                    </span>
                  </button>
                );
              })}
              {!loading && snapshot.length === 0 && (
                <div style={{ fontSize: 12, color: "#9aa1a9", padding: "12px 0" }}>
                  No pending items. Items appear once VAO forwards a mutation request.
                </div>
              )}
              {loading && (
                <div style={{ fontSize: 12, color: "#9aa1a9", padding: "12px 0" }}>Loading…</div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
