import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gavel, ScrollText, Database, CheckCircle2 } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import Badge from "@/ui/primitives/Badge/Badge";
import { ROUTES } from "@/navigation/routes";
import { useSlateStore } from "../../state/SlateProvider";
import { slateApi } from "../../services/apiClient";
import DashboardHero from "../../components/DashboardHero";
import KpiCard from "../../components/KpiCard";
import type { SlateDispute } from "../../types/slate.types";

const QUICK_ACTIONS = [
  { label: "Disputes & Court Orders", desc: "File disputes, enter verified orders", icon: <Gavel size={17} />, path: ROUTES.PATHS.APP.SLATE.COURT_DISPUTES },
  { label: "Audit Trail", desc: "Immutable history across all tokens", icon: <ScrollText size={17} />, path: ROUTES.PATHS.APP.SLATE.COURT_AUDIT },
  { label: "Master Data / Demo Seeding", desc: "State machine, operations, reset demo", icon: <Database size={17} />, path: ROUTES.PATHS.APP.SLATE.COURT_ADMIN },
];

export default function CourtDashboardPage() {
  const { currentUser, session } = useSlateStore();
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<SlateDispute[]>([]);

  useEffect(() => {
    if (!session.liveToken) return;
    slateApi.court.getDisputes().then(setDisputes).catch(() => undefined);
  }, [session.liveToken]);

  const frozen = disputes.filter((d) => d.status === "frozen");
  const executed = disputes.filter((d) => d.status === "order_executed");

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <DashboardHero
          eyebrow="Admin Portal"
          title={`Welcome back, ${currentUser?.name ?? "Admin"}`}
          sub="File disputes on behalf of e-Courts, enter verified orders, and review the full on-chain audit trail."
          accent="#1d4670"
          icon={<Gavel size={22} />}
        />

        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(3, 1fr)", margin: "16px 0 20px" }}>
          <KpiCard label="Active Disputes" value={frozen.length} icon={<Gavel size={18} />} accent="#B0392F" foot={frozen.length ? "Frozen: awaiting order" : "None"} footKind={frozen.length ? "danger" : "up"} />
          <KpiCard label="Orders Executed" value={executed.length} icon={<CheckCircle2 size={18} />} accent="#1C7A4E" pct={disputes.length ? (executed.length / disputes.length) * 100 : 0} />
          <KpiCard label="Total Disputes" value={disputes.length} icon={<ScrollText size={18} />} accent="#1d4670" />
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
              >
                <div style={{ color: "#1d4670" }}>{a.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#161b22" }}>{a.label}</div>
                  <div style={{ fontSize: 11.5, color: "#717881", marginTop: 2 }}>{a.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12, color: "#0F2A4A", flexShrink: 0 }}>Recent disputes</div>
          <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            <div className="flex flex-col gap-2">
              {disputes.slice(0, 6).map((d) => (
                <button
                  key={d.id}
                  onClick={() => navigate(ROUTES.PATHS.APP.SLATE.COURT_DISPUTE_DETAIL.replace(":disputeId", d.id))}
                  className="flex items-center justify-between text-left"
                  style={{ padding: "9px 10px", borderRadius: 7, border: "1px solid #eceef0", background: "#fafbfc", cursor: "pointer" }}
                >
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: "#161b22", fontFamily: "monospace" }}>{d.id}</div>
                    <div style={{ fontSize: 11, color: "#717881" }}>{d.type}</div>
                  </div>
                  <Badge size="sm" variant={d.status === "frozen" ? "danger" : "success"}>{d.status.replace("_", " ")}</Badge>
                </button>
              ))}
              {disputes.length === 0 && <div style={{ fontSize: 12, color: "#9aa1a9" }}>No disputes yet.</div>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
