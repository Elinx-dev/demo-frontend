import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, CalendarCheck, MapPinned, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { ROUTES } from "@/navigation/routes";
import { useSlateStore } from "../../state/SlateProvider";
import { slateApi } from "../../services/apiClient";
import DashboardHero from "../../components/DashboardHero";
import KpiCard from "../../components/KpiCard";
import type { SiteVisitTask } from "../../types/slate.types";

const SLATE_PATHS = ROUTES.PATHS.APP.SLATE;

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending_proposal:   { label: "Awaiting Proposal",           color: "#B8722E", bg: "#fbf3e2" },
  surveyor_proposed:  { label: "Surveyor Proposed",           color: "#64748b", bg: "#f1f5f9" },
  vao_proposed:       { label: "You Proposed",                color: "#1d4670", bg: "#e8eef7" },
  date_agreed:        { label: "Date Agreed",                 color: "#1C7A4E", bg: "#edf7f1" },
  surveyor_checkedin: { label: "Surveyor Checked In",         color: "#64748b", bg: "#f1f5f9" },
  vao_checkedin:      { label: "You Checked In",              color: "#1d4670", bg: "#e8eef7" },
  joint_checkedin:    { label: "Visit Done - Survey Pending", color: "#B8923D", bg: "#fdf6e3" },
  completed:          { label: "Survey Complete",             color: "#1C7A4E", bg: "#edf7f1" },
  revisit_required:   { label: "Revisit Required",            color: "#B0392F", bg: "#fef3f2" },
};

const QUICK_ACTIONS = [
  {
    label: "Site Visit Queue",
    desc: "Propose dates, check in, coordinate with Surveyor",
    icon: <CalendarCheck size={17} />,
    path: SLATE_PATHS.VAO_QUEUE,
  },
];

export default function VaoDashboardPage() {
  const { currentUser } = useSlateStore();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<SiteVisitTask[]>([]);

  useEffect(() => {
    slateApi.vao.getQueue().then(setTasks).catch(() => undefined);
  }, []);

  const pending     = tasks.filter((t) => ["pending_proposal", "surveyor_proposed", "vao_proposed"].includes(t.status));
  const scheduled   = tasks.filter((t) => ["date_agreed", "surveyor_checkedin", "vao_checkedin"].includes(t.status));
  const visitDone   = tasks.filter((t) => t.status === "joint_checkedin");
  const done        = tasks.filter((t) => t.status === "completed");
  const actionNeeded = pending.length + scheduled.length;

  const snapshot = [...pending, ...scheduled, ...visitDone].slice(0, 6);

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <DashboardHero
          eyebrow="VAO Officer Portal"
          title={`Welcome back, ${currentUser?.name ?? "VAO Officer"}`}
          sub={currentUser?.role ?? "Village Administrative Officer"}
          accent="#1d4670"
          icon={<Compass size={22} />}
          meta={
            currentUser?.jurisdiction ? (
              <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: "rgba(255,255,255,.14)" }}>
                {currentUser.jurisdiction}
              </span>
            ) : undefined
          }
        />

        {/* KPI row */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)", margin: "16px 0 20px" }}>
          <KpiCard
            label="Action Required"
            value={actionNeeded}
            icon={<Clock size={18} />}
            accent="#B8722E"
            foot={actionNeeded ? "Needs your attention" : "All clear"}
            footKind={actionNeeded ? "warn" : "up"}
          />
          <KpiCard
            label="Scheduled"
            value={scheduled.length}
            icon={<CalendarCheck size={18} />}
            accent="#1d4670"
            foot={scheduled.length ? "Visit dates confirmed" : undefined}
          />
          <KpiCard
            label="Visit Done"
            value={visitDone.length}
            icon={<MapPinned size={18} />}
            accent="#B8923D"
            foot={visitDone.length ? "Awaiting boundary survey" : undefined}
          />
          <KpiCard
            label="Completed"
            value={done.length}
            icon={<CheckCircle2 size={18} />}
            accent="#1C7A4E"
            foot={done.length ? "Survey submitted" : undefined}
            footKind={done.length ? "up" : undefined}
          />
        </div>
      </div>

      {/* Bottom 2-column section */}
      <div className="grid gap-4 flex-1" style={{ gridTemplateColumns: "2fr 1fr", gridAutoRows: "1fr", minHeight: 0 }}>
        {/* Quick Actions */}
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

            {/* Summary info card */}
            <div style={{ padding: 14, borderRadius: 9, border: "1px solid #dee2e6", background: "#f5f8fd" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#717881", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Compass size={14} style={{ color: "#1d4670" }} /> Your jurisdiction
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F2A4A", marginBottom: 4 }}>
                {currentUser?.jurisdiction ?? "-"}
              </div>
              <div style={{ fontSize: 11.5, color: "#717881", lineHeight: 1.5 }}>
                {tasks.length} task{tasks.length !== 1 ? "s" : ""} total ·{" "}
                {actionNeeded} need{actionNeeded !== 1 ? "" : "s"} attention
              </div>
            </div>

            {/* Lifecycle guide card */}
            <div style={{ padding: 14, borderRadius: 9, border: "1px solid #dee2e6", background: "#fafbfc" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#717881", marginBottom: 8 }}>Visit lifecycle</div>
              <div className="flex flex-col gap-1.5">
                {[
                  { step: "1", label: "Propose date to Surveyor", done: pending.length < tasks.length },
                  { step: "2", label: "Date agreed - confirm visit", done: scheduled.length > 0 || visitDone.length > 0 || done.length > 0 },
                  { step: "3", label: "Check in at site", done: visitDone.length > 0 || done.length > 0 },
                  { step: "4", label: "Survey submitted", done: done.length > 0 },
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

        {/* Task snapshot */}
        <Card style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 12, flexShrink: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F2A4A" }}>Task snapshot</div>
            {snapshot.length > 0 && (
              <button
                onClick={() => navigate(SLATE_PATHS.VAO_QUEUE)}
                style={{ fontSize: 11, fontWeight: 600, color: "#1d4670", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
              >
                View all <ArrowRight size={11} />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            <div className="flex flex-col gap-2">
              {snapshot.map((task) => {
                const sm = STATUS_META[task.status] ?? { label: task.status, color: "#545c66", bg: "#f5f5f5" };
                const dateShow = task.confirmedDate ?? task.proposedDate;
                return (
                  <button
                    key={task.id}
                    onClick={() => navigate(SLATE_PATHS.VAO_QUEUE)}
                    className="flex items-center justify-between text-left"
                    style={{ padding: "9px 10px", borderRadius: 7, border: "1px solid #eceef0", background: "#fafbfc", cursor: "pointer", width: "100%" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#eef2f8")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#fafbfc")}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0F2A4A", fontFamily: "monospace", marginBottom: 1 }}>{task.ulpin}</div>
                      <div style={{ fontSize: 11, color: "#717881", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {task.surveyorName ?? task.surveyorId}{dateShow ? ` · ${dateShow}` : ""}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: sm.bg, color: sm.color, whiteSpace: "nowrap", marginLeft: 8, flexShrink: 0 }}>
                      {sm.label}
                    </span>
                  </button>
                );
              })}
              {snapshot.length === 0 && (
                <div style={{ fontSize: 12, color: "#9aa1a9", padding: "12px 0" }}>
                  No active tasks. Tasks appear once a transaction in your jurisdiction is approved.
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
