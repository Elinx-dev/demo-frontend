import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListChecks, AlertTriangle, Stamp, ScrollText, CheckCircle2, Percent } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import Badge from "@/ui/primitives/Badge/Badge";
import { ROUTES } from "@/navigation/routes";
import { useSlateStore } from "../../state/SlateProvider";
import { slateApi } from "../../services/apiClient";
import DashboardHero from "../../components/DashboardHero";
import KpiCard from "../../components/KpiCard";
import { inrShort } from "../../utils/format";
import type { OfficerQueueItem, SlateException } from "../../types/slate.types";

const QUICK_ACTIONS = [
  { label: "Registration Queue", desc: "Review and approve pending transactions", icon: <ListChecks size={17} />, path: ROUTES.PATHS.APP.SLATE.OFFICER_QUEUE },
  { label: "Exceptions", desc: "Transactions blocked by rule checks", icon: <AlertTriangle size={17} />, path: ROUTES.PATHS.APP.SLATE.OFFICER_EXCEPTIONS },
  { label: "Mint Token", desc: "Create a new land parcel token", icon: <Stamp size={17} />, path: ROUTES.PATHS.APP.SLATE.OFFICER_MINT },
  { label: "Audit Trail", desc: "Immutable history across all tokens", icon: <ScrollText size={17} />, path: ROUTES.PATHS.APP.SLATE.OFFICER_AUDIT },
];

export default function OfficerDashboardPage() {
  const { currentUser } = useSlateStore();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<OfficerQueueItem[]>([]);
  const [exceptions, setExceptions] = useState<SlateException[]>([]);
  const [stampDutyRates, setStampDutyRates] = useState<{ code: string; rate: number }[]>([]);

  useEffect(() => {
    slateApi.officer.getQueue().then(setQueue).catch(() => undefined);
    slateApi.officer.getExceptions().then(setExceptions).catch(() => undefined);
    slateApi.masters.getStampDutyRates().then(setStampDutyRates).catch(() => undefined);
  }, []);

  const pendingReview = queue.filter((q) => q.status === "pending_maker").length;
  const inProgress = queue.filter((q) => ["pending_surveyor", "pending_checker", "pending_tahsildar"].includes(q.status)).length;
  const openExceptions = exceptions.filter((e) => e.status === "open").length;
  const approvedQueue = queue.filter((q) => q.status === "approved");
  const approved = approvedQueue.length;
  const approvalRate = queue.length ? (approved / queue.length) * 100 : 0;

  const stampDutyCollected = approvedQueue.reduce((sum, q) => {
    if (!q.stampDutyCode || !q.amount) return sum;
    const rate = stampDutyRates.find((r) => r.code === q.stampDutyCode)?.rate ?? 0;
    return sum + (q.amount * rate) / 100;
  }, 0);

  const recentQueue = queue.slice(0, 6);

  const STAGE_LABEL: Record<string, string> = {
    pending_maker: "Pending Review",
    pending_surveyor: "With Surveyor",
    pending_checker: "With VAO",
    pending_tahsildar: "With Thasildar",
    approved: "Approved",
    exception: "Exception",
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <DashboardHero
          eyebrow="Registration Officer Portal"
          title={`Welcome back, ${currentUser?.name ?? "Officer"}`}
          sub={currentUser?.role ?? "Registration Officer"}
          accent="#1d4670"
          icon={<Stamp size={22} />}
        />

        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(5, 1fr)", margin: "16px 0 20px" }}>
          <KpiCard label="Pending Review" value={pendingReview} icon={<ListChecks size={18} />} accent="#1d4670" />
          <KpiCard label="In Progress" value={inProgress} icon={<CheckCircle2 size={18} />} accent="#1d4670" foot="With Surveyor / VAO / Thasildar" />
          <KpiCard label="Open Exceptions" value={openExceptions} icon={<AlertTriangle size={18} />} accent="#B0392F" foot={openExceptions ? "Needs review" : "All clear"} footKind={openExceptions ? "danger" : "up"} />
          <KpiCard label="Approved" value={approved} icon={<Stamp size={18} />} accent="#1C7A4E" foot="This session" footKind="up" pct={approvalRate} />
          <KpiCard label="Stamp Duty Collected" value={inrShort(stampDutyCollected)} icon={<Percent size={18} />} accent="#1d4670" foot="Approved sales, this session" />
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
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12, color: "#0F2A4A", flexShrink: 0 }}>Queue snapshot</div>
          <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            <div className="flex flex-col gap-2">
              {recentQueue.map((q) => (
                <button
                  key={q.id}
                  onClick={() => navigate(ROUTES.PATHS.APP.SLATE.OFFICER_TXN_DETAIL.replace(":txnId", q.id))}
                  className="flex items-center justify-between text-left"
                  style={{ padding: "9px 10px", borderRadius: 7, border: "1px solid #eceef0", background: "#fafbfc", cursor: "pointer" }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#161b22" }}>{q.id} · {q.type}</div>
                    <div style={{ fontSize: 11, color: "#717881" }}>{q.parties}</div>
                  </div>
                  <Badge size="sm" variant={q.status === "exception" ? "danger" : q.status === "approved" ? "success" : "info"}>
                    {STAGE_LABEL[q.status] ?? q.status}
                  </Badge>
                </button>
              ))}
              {recentQueue.length === 0 && <div style={{ fontSize: 12, color: "#9aa1a9" }}>Queue is empty.</div>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
