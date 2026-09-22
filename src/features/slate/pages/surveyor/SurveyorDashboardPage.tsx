import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, Ruler, CheckCircle2, ClipboardList, ArrowRight } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { ROUTES } from "@/navigation/routes";
import { useSlateStore } from "../../state/SlateProvider";
import { slateApi } from "../../services/apiClient";
import PageHead from "../../components/PageHead";
import KpiCard from "../../components/KpiCard";
import type { SiteVisitTask, OfficerQueueItem } from "../../types/slate.types";

const SLATE_PATHS = ROUTES.PATHS.APP.SLATE;

const QUICK_ACTIONS = [
  {
    label: "Visit Data Entry",
    desc: "Review properties pending boundary survey and submit verification reports",
    icon: <ClipboardList size={20} />,
    path: SLATE_PATHS.SURVEYOR_QUEUE,
    accent: "#1d4670",
    bg: "#e8eef7",
  },
  {
    label: "Site Visit Plan",
    desc: "Schedule joint site visits with VAO officers, check in, and track visit status",
    icon: <CalendarCheck size={20} />,
    path: SLATE_PATHS.SURVEYOR_SITE_VISITS,
    accent: "#1d4670",
    bg: "#e8eef7",
  },
];

export default function SurveyorDashboardPage() {
  const { currentUser } = useSlateStore();
  const navigate = useNavigate();
  const [siteVisitTasks, setSiteVisitTasks] = useState<SiteVisitTask[]>([]);
  const [surveyQueue, setSurveyQueue] = useState<OfficerQueueItem[]>([]);

  useEffect(() => {
    slateApi.surveyor.getSiteVisitTasks().then(setSiteVisitTasks).catch(() => undefined);
    slateApi.surveyor.getSurveyQueue().then(setSurveyQueue).catch(() => undefined);
  }, []);

  const pendingSurveys    = surveyQueue.length;
  const scheduledVisits   = siteVisitTasks.filter((t) => ["date_agreed", "surveyor_checkedin", "vao_checkedin"].includes(t.status)).length;
  const boundaryPending   = siteVisitTasks.filter((t) => t.status === "joint_checkedin").length;
  const completedVisits   = siteVisitTasks.filter((t) => t.status === "completed").length;
  const actionRequired    = pendingSurveys + scheduledVisits + boundaryPending;

  const recentQueue = surveyQueue.slice(0, 5);

  return (
    <div className="flex flex-col" style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="Surveyor Portal"
          title={`Welcome back, ${currentUser?.name ?? "Surveyor"}`}
          sub={`${currentUser?.role ?? "Licensed Surveyor"} - manage site visits and submit boundary verifications.`}
        />
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)", margin: "16px 0 20px" }}>
        <KpiCard
          label="Pending Surveys"
          value={pendingSurveys}
          icon={<ClipboardList size={18} />}
          accent="#1d4670"
          foot={pendingSurveys ? "Awaiting your verification" : "All clear"}
          footKind={pendingSurveys ? "warn" : "up"}
        />
        <KpiCard
          label="Visits Scheduled"
          value={scheduledVisits}
          icon={<CalendarCheck size={18} />}
          accent="#1d4670"
          foot={scheduledVisits ? "Joint visits confirmed" : undefined}
        />
        <KpiCard
          label="Boundary Survey Pending"
          value={boundaryPending}
          icon={<Ruler size={18} />}
          accent="#B8722E"
          foot={boundaryPending ? "Field measurements needed" : undefined}
          footKind={boundaryPending ? "warn" : undefined}
        />
        <KpiCard
          label="Completed"
          value={completedVisits}
          icon={<CheckCircle2 size={18} />}
          accent="#1C7A4E"
        />
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 24 }}>
        {QUICK_ACTIONS.map((qa) => (
          <Card
            key={qa.label}
            style={{ padding: "18px 20px", cursor: "pointer", border: "1px solid #eceef0", transition: "box-shadow .15s" }}
            onClick={() => navigate(qa.path)}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,.08)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = "none")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div style={{ width: 42, height: 42, borderRadius: 10, background: qa.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: qa.accent }}>{qa.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F2A4A", marginBottom: 4 }}>{qa.label}</div>
                  <div style={{ fontSize: 12, color: "#717881", lineHeight: 1.5 }}>{qa.desc}</div>
                </div>
              </div>
              <ArrowRight size={16} style={{ color: qa.accent, flexShrink: 0, marginTop: 3 }} />
            </div>
          </Card>
        ))}
      </div>

      {recentQueue.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F2A4A", marginBottom: 10 }}>
            Recent Survey Queue
            <span style={{ fontSize: 11, fontWeight: 600, color: "#9aa1a9", marginLeft: 8 }}>top {recentQueue.length}</span>
          </div>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  {["ULPIN", "Transaction", "Status", ""].map((h) => (
                    <th key={h} style={{ padding: "9px 14px", fontSize: 10.5, fontWeight: 700, color: "#717881", textTransform: "uppercase", letterSpacing: ".05em", textAlign: "left", borderBottom: "1px solid #eceef0" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentQueue.map((item, idx) => (
                  <tr
                    key={item.txnId}
                    style={{ borderBottom: idx < recentQueue.length - 1 ? "1px solid #f0f2f4" : "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "11px 14px", fontFamily: "monospace", fontSize: 12.5, fontWeight: 700, color: "#0F2A4A" }}>{item.ulpin}</td>
                    <td style={{ padding: "11px 14px", fontFamily: "monospace", fontSize: 11, color: "#717881" }}>{item.txnId}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 8, background: "#e8eef7", color: "#1d4670" }}>
                        Pending Survey
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px", textAlign: "right" }}>
                      <button
                        onClick={() => navigate(SLATE_PATHS.SURVEYOR_QUEUE)}
                        style={{ fontSize: 11.5, fontWeight: 700, color: "#1d4670", background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        Open <ArrowRight size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          {actionRequired > recentQueue.length && (
            <button
              onClick={() => navigate(SLATE_PATHS.SURVEYOR_QUEUE)}
              style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: "#1d4670", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
            >
              View all {actionRequired} items <ArrowRight size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
