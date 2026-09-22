import { useCallback, useEffect, useRef, useState } from "react";
import {
  MapPinned, CheckCircle2,
  RefreshCw, CalendarDays, ArrowLeft, ChevronRight,
} from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { Button } from "@/ui/primitives/Button/Button";
import { Modal } from "@/ui/primitives/Modal/Modal";
import { Alert } from "@/ui/primitives/Alert/Alert";
import Empty from "@/ui/primitives/Empty/Empty";
import { slateApi } from "../../services/apiClient";
import PageHead from "../../components/PageHead";
import { PropertySplitView } from "../../components/PropertySplitView";
import type { SiteVisitTask, SlateToken } from "../../types/slate.types";

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

const ACTION_STATUSES = new Set([
  "pending_proposal", "surveyor_proposed", "vao_proposed",
  "date_agreed", "surveyor_checkedin", "vao_checkedin",
]);

function dtLabel(date?: string | null, time?: string | null) {
  if (!date) return "-";
  return time ? `${date} · ${time}` : date;
}

function StatusBadge({ status }: { status: string }) {
  const sm = STATUS_META[status] ?? { label: status, color: "#545c66", bg: "#f5f5f5" };
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 10, background: sm.bg, color: sm.color, whiteSpace: "nowrap" }}>
      {sm.label}
    </span>
  );
}

/* ─────────────────────────── Schedule Modal content ─────────────────────── */
function SchedulePanel({
  task, onPropose, onAccept, onCheckIn,
}: {
  task: SiteVisitTask;
  onPropose: (id: string, date: string, time: string) => Promise<void>;
  onAccept: (id: string) => Promise<void>;
  onCheckIn: (id: string) => Promise<void>;
}) {
  const [dateInput, setDateInput] = useState(task.proposedDate ?? "");
  const [timeInput, setTimeInput] = useState(task.proposedTime ?? "10:00");
  const [showCounter, setShowCounter] = useState(false);
  const [busy, setBusy] = useState(false);
  const prevId = useRef(task.id);

  useEffect(() => {
    if (prevId.current !== task.id) {
      setDateInput(task.proposedDate ?? "");
      setTimeInput(task.proposedTime ?? "10:00");
      setShowCounter(false);
      prevId.current = task.id;
    }
  }, [task.id, task.proposedDate, task.proposedTime]);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  }

  const canPropose    = ["pending_proposal", "surveyor_proposed"].includes(task.status);
  const isVaoProposed = task.status === "vao_proposed";
  const canAccept     = task.status === "surveyor_proposed";
  const canCheckIn    = ["date_agreed", "surveyor_checkedin"].includes(task.status) && !task.vaoCheckedInAt;
  const showAgreed    = ["date_agreed", "surveyor_checkedin", "vao_checkedin", "joint_checkedin", "completed"].includes(task.status);

  return (
    <div className="flex flex-col gap-4">
      {/* Status row */}
      <div className="flex items-center gap-2" style={{ paddingBottom: 14, borderBottom: "1px solid #f0f2f4" }}>
        <div style={{ fontSize: 12, color: "#717881" }}>Surveyor: <strong>{task.surveyorName ?? task.surveyorId}</strong></div>
        {task.vaoCheckedInAt && (
          <div style={{ fontSize: 11.5, color: "#1C7A4E", fontWeight: 600, marginLeft: "auto" }}>
            ✓ You checked in {new Date(task.vaoCheckedInAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* Propose / update date */}
      {(canPropose || isVaoProposed) && (
        <Card style={{ padding: "16px 18px", border: "1px solid #d8b4fe", background: "#faf5ff" }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
            <CalendarDays size={15} style={{ color: "#1d4670" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#3b1f6e" }}>
              {isVaoProposed ? "Update Visit Schedule" : "Propose Visit Date & Time"}
            </span>
          </div>
          {isVaoProposed && task.proposedDate && (
            <div style={{ fontSize: 12, color: "#1d4670", marginBottom: 10, padding: "6px 10px", background: "#dde9f8", borderRadius: 6, fontWeight: 600 }}>
              Current: {dtLabel(task.proposedDate, task.proposedTime)} - awaiting surveyor
            </div>
          )}
          <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <label style={{ fontSize: 11, color: "#545c66", fontWeight: 600, display: "block", marginBottom: 4 }}>Visit Date</label>
              <input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)}
                style={{ width: "100%", fontSize: 12.5, padding: "8px 10px", border: "1px solid #c4b5fd", borderRadius: 6, background: "#fff" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#545c66", fontWeight: 600, display: "block", marginBottom: 4 }}>Time</label>
              <input type="time" value={timeInput} onChange={(e) => setTimeInput(e.target.value)}
                style={{ width: "100%", fontSize: 12.5, padding: "8px 10px", border: "1px solid #c4b5fd", borderRadius: 6, background: "#fff" }} />
            </div>
          </div>
          <button
            onClick={() => run(() => onPropose(task.id, dateInput, timeInput))}
            disabled={busy || !dateInput}
            style={{ marginTop: 12, width: "100%", fontSize: 13, fontWeight: 700, padding: "9px 0", borderRadius: 7, background: dateInput ? "#1d4670" : "#c4c4c4", color: "#fff", border: "none", cursor: dateInput ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <CalendarDays size={14} />
            {busy ? "Sending…" : isVaoProposed ? "Update & Notify Surveyor" : "Propose to Surveyor"}
          </button>
        </Card>
      )}

      {/* Surveyor proposed - accept or counter */}
      {canAccept && (
        <Card style={{ padding: "16px 18px", border: "1px solid #bee3f8", background: "#f0f7ff" }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
            <CalendarDays size={15} style={{ color: "#64748b" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>Surveyor Proposed a Visit Date</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F2A4A", marginBottom: 12, padding: "9px 12px", background: "#dde9f8", borderRadius: 6 }}>
            {dtLabel(task.proposedDate, task.proposedTime)}
          </div>
          <div className="flex gap-2">
            <button onClick={() => run(() => onAccept(task.id))} disabled={busy}
              style={{ flex: 1, fontSize: 13, fontWeight: 700, padding: "9px 0", borderRadius: 7, background: "#1C7A4E", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <CheckCircle2 size={14} /> {busy ? "Accepting…" : "Accept & Confirm"}
            </button>
            <button onClick={() => setShowCounter((v) => !v)} disabled={busy}
              style={{ fontSize: 12, fontWeight: 600, padding: "9px 14px", borderRadius: 7, background: "transparent", color: "#1d4670", border: "1px solid #1d4670", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <RefreshCw size={12} /> Counter
            </button>
          </div>
          {showCounter && (
            <div style={{ marginTop: 12 }}>
              <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div>
                  <label style={{ fontSize: 11, color: "#545c66", fontWeight: 600, display: "block", marginBottom: 4 }}>Your Date</label>
                  <input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)}
                    style={{ width: "100%", fontSize: 12.5, padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#545c66", fontWeight: 600, display: "block", marginBottom: 4 }}>Time</label>
                  <input type="time" value={timeInput} onChange={(e) => setTimeInput(e.target.value)}
                    style={{ width: "100%", fontSize: 12.5, padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6 }} />
                </div>
              </div>
              <button
                onClick={() => run(async () => { await onPropose(task.id, dateInput, timeInput); setShowCounter(false); })}
                disabled={busy || !dateInput}
                style={{ marginTop: 8, width: "100%", fontSize: 12.5, fontWeight: 700, padding: "8px 0", borderRadius: 7, background: dateInput ? "#1d4670" : "#c4c4c4", color: "#fff", border: "none", cursor: dateInput ? "pointer" : "default" }}>
                {busy ? "Sending…" : "Send Counter-Proposal"}
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Agreed date + dual check-in */}
      {showAgreed && (
        <Card style={{ padding: "16px 18px", border: "1px solid #b5e5c9", background: "#f0faf5" }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
            <CheckCircle2 size={15} style={{ color: "#1C7A4E" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1C7A4E" }}>Agreed Visit Date</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0F2A4A", marginBottom: 14 }}>
            {dtLabel(task.confirmedDate, task.confirmedTime)}
          </div>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: canCheckIn ? 12 : 0 }}>
            <div style={{ fontSize: 12, padding: "9px 12px", borderRadius: 7, background: task.vaoCheckedInAt ? "#edf7f1" : "#f5f5f5", border: `1px solid ${task.vaoCheckedInAt ? "#b5e5c9" : "#eceef0"}` }}>
              <div style={{ fontWeight: 700, color: task.vaoCheckedInAt ? "#1C7A4E" : "#9aa1a9" }}>
                {task.vaoCheckedInAt ? "✓ You Checked In" : "Your Check-In Pending"}
              </div>
              {task.vaoCheckedInAt && <div style={{ fontSize: 10.5, color: "#545c66", marginTop: 2 }}>{new Date(task.vaoCheckedInAt).toLocaleString()}</div>}
            </div>
            <div style={{ fontSize: 12, padding: "9px 12px", borderRadius: 7, background: task.surveyorCheckedInAt ? "#edf7f1" : "#f5f5f5", border: `1px solid ${task.surveyorCheckedInAt ? "#b5e5c9" : "#eceef0"}` }}>
              <div style={{ fontWeight: 700, color: task.surveyorCheckedInAt ? "#1C7A4E" : "#9aa1a9" }}>
                {task.surveyorCheckedInAt ? "✓ Surveyor Checked In" : "Surveyor Check-In Pending"}
              </div>
              {task.surveyorCheckedInAt && <div style={{ fontSize: 10.5, color: "#545c66", marginTop: 2 }}>{new Date(task.surveyorCheckedInAt).toLocaleString()}</div>}
            </div>
          </div>
          {canCheckIn && (
            <button onClick={() => run(() => onCheckIn(task.id))} disabled={busy}
              style={{ width: "100%", fontSize: 13, fontWeight: 700, padding: "10px 0", borderRadius: 7, background: "#1d4670", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <MapPinned size={14} />
              {busy ? "Checking in…" : "Check In at Site"}
            </button>
          )}
        </Card>
      )}

      {/* VAO role complete */}
      {task.status === "joint_checkedin" && (
        <Alert type="warning" title="VAO Role Complete" message="Both you and the Surveyor have checked in. The Surveyor will now perform the boundary measurements. No further action needed from you." dismissible={false} />
      )}
      {task.status === "completed" && (
        <Alert type="success" message="Survey complete. The Surveyor has submitted boundary measurements and the transaction has been forwarded to the VAO Officer Verification Queue." dismissible={false} />
      )}
    </div>
  );
}


/* ─────────────────────────── Table ─────────────────────────── */
const TH: React.CSSProperties = {
  padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#717881",
  textTransform: "uppercase", letterSpacing: ".05em", textAlign: "left",
  borderBottom: "1px solid #dee2e6", background: "#f8f9fa", whiteSpace: "nowrap",
};

function TaskTable({ tasks, onManage }: { tasks: SiteVisitTask[]; onManage: (t: SiteVisitTask) => void }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #dee2e6", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={TH}>ULPIN</th>
              <th style={TH}>Surveyor</th>
              <th style={TH}>Status</th>
              <th style={TH}>Date</th>
              <th style={TH}>Check-ins</th>
              <th style={{ ...TH, textAlign: "right" }}></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, idx) => {
              const isLast = idx === tasks.length - 1;
              const needsAction = ACTION_STATUSES.has(task.status);
              const dateDisplay = task.confirmedDate
                ? dtLabel(task.confirmedDate, task.confirmedTime)
                : dtLabel(task.proposedDate, task.proposedTime);
              const datePrefix = task.confirmedDate ? "Agreed:" : task.proposedDate ? "Proposed:" : "";
              return (
                <tr key={task.id}
                  style={{ borderBottom: isLast ? "none" : "1px solid #f0f2f4" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#eef2f8")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "13px 14px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 12.5, fontWeight: 700, color: "#0F2A4A" }}>{task.ulpin}</span>
                    <div style={{ fontSize: 10, color: "#9aa1a9", marginTop: 1, fontFamily: "monospace" }}>{task.txnId?.slice(0, 18)}…</div>
                  </td>
                  <td style={{ padding: "13px 14px", fontSize: 12.5, color: "#161b22", whiteSpace: "nowrap" }}>
                    {task.surveyorName ?? task.surveyorId}
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <StatusBadge status={task.status} />
                    {needsAction && (
                      <div style={{ fontSize: 9.5, color: "#B8722E", fontWeight: 700, marginTop: 3 }}>Action needed</div>
                    )}
                  </td>
                  <td style={{ padding: "13px 14px", fontSize: 12, color: "#545c66", whiteSpace: "nowrap" }}>
                    {dateDisplay !== "-" ? (
                      <><span style={{ fontSize: 10, color: "#9aa1a9", fontWeight: 600, marginRight: 4 }}>{datePrefix}</span>{dateDisplay}</>
                    ) : "-"}
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ fontSize: 10.5, padding: "2px 7px", borderRadius: 8, fontWeight: 600, background: task.vaoCheckedInAt ? "#edf7f1" : "#f5f5f5", color: task.vaoCheckedInAt ? "#1C7A4E" : "#9aa1a9" }}>
                        {task.vaoCheckedInAt ? "✓ You" : "You"}
                      </span>
                      <span style={{ fontSize: 10.5, padding: "2px 7px", borderRadius: 8, fontWeight: 600, background: task.surveyorCheckedInAt ? "#edf7f1" : "#f5f5f5", color: task.surveyorCheckedInAt ? "#1C7A4E" : "#9aa1a9" }}>
                        {task.surveyorCheckedInAt ? "✓ Surveyor" : "Surveyor"}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 14px", textAlign: "right" }}>
                    <button
                      onClick={() => onManage(task)}
                      style={{ fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 6, background: needsAction ? "#1d4670" : "#f3f4f6", color: needsAction ? "#fff" : "#545c66", border: needsAction ? "none" : "1px solid #dee2e6", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}
                    >
                      {needsAction ? "Manage" : "View"} <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────── Page ─────────────────────────── */
export default function VaoQueuePage() {
  const [tasks, setTasks]         = useState<SiteVisitTask[]>([]);
  const [selected, setSelected]   = useState<SiteVisitTask | null>(null);
  const [selectedToken, setSelectedToken] = useState<SlateToken | null>(null);
  const [tokenLoading, setTokenLoading]   = useState(false);
  const [scheduleOpen, setScheduleOpen]   = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const load = useCallback(() => {
    slateApi.vao.getQueue()
      .then((ts) => {
        setTasks(ts);
        setSelected((prev) => prev ? (ts.find((t) => t.id === prev.id) ?? null) : null);
      })
      .catch((e) => setError(e?.message ?? "Failed to load queue"));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selected) { setSelectedToken(null); return; }
    setTokenLoading(true);
    slateApi.citizen.getPropertyDetail(selected.ulpin)
      .then(setSelectedToken)
      .catch(() => setSelectedToken(null))
      .finally(() => setTokenLoading(false));
  }, [selected?.ulpin]);

  const active    = tasks.filter((t) => t.status !== "completed");
  const completed = tasks.filter((t) => t.status === "completed");

  async function handlePropose(id: string, date: string, time: string) { await slateApi.vao.proposeDate(id, date, time); load(); }
  async function handleAccept(id: string)  { await slateApi.vao.acceptDate(id); load(); }
  async function handleCheckIn(id: string) { await slateApi.vao.checkIn(id); load(); }

  const canSchedule = selected ? (selected.status !== "completed") : false;

  return (
    <div className="flex flex-col" style={{ height: "100%", overflowY: selected ? "hidden" : "auto" }}>
      {error && <Alert type="error" message={error} dismissible onDismiss={() => setError(null)} style={{ marginBottom: 16, flexShrink: 0 }} />}

      {selected ? (
        <>
          {/* Back button */}
          <div style={{ flexShrink: 0 }}>
            <button
              onClick={() => { setSelected(null); setScheduleOpen(false); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "#1d4670", background: "none", border: "none", cursor: "pointer", padding: "4px 0 12px" }}
            >
              <ArrowLeft size={15} /> Back to Queue
            </button>

            <PageHead
              eyebrow="Site Visit Queue"
              title={<span style={{ fontFamily: "monospace" }}>{selected.ulpin}</span>}
              sub={
                selectedToken
                  ? `${selectedToken.location.village}, ${selectedToken.location.taluk}, ${selectedToken.location.district}`
                  : `Txn: ${selected.txnId}`
              }
              actions={
                <div className="flex items-center gap-2">
                  <StatusBadge status={selected.status} />
                  {canSchedule && (
                    <Button onClick={() => setScheduleOpen(true)}>
                      <CalendarDays size={14} />
                      {ACTION_STATUSES.has(selected.status) ? "Schedule Site Visit" : "View Visit Status"}
                    </Button>
                  )}
                </div>
              }
            />
          </div>

          {/* Property detail - split layout */}
          <div className="flex-1" style={{ minHeight: 0, display: "flex", overflow: "hidden" }}>
            {tokenLoading ? (
              <div style={{ fontSize: 12.5, color: "#9aa1a9", padding: "20px 0" }}>Loading property data…</div>
            ) : selectedToken ? (
              <PropertySplitView token={selectedToken} accentColor="#1d4670" />
            ) : (
              <div style={{ padding: "20px 0", color: "#9aa1a9", fontSize: 12.5 }}>
                Property data unavailable - parcel may not yet have a registered token.
              </div>
            )}
          </div>

          {/* Schedule / status modal */}
          <Modal
            isOpen={scheduleOpen}
            onClose={() => setScheduleOpen(false)}
            size="md"
            title="Schedule Site Visit"
          >
            <div style={{ padding: 20 }}>
              <SchedulePanel
                task={selected}
                onPropose={handlePropose}
                onAccept={handleAccept}
                onCheckIn={handleCheckIn}
              />
            </div>
          </Modal>
        </>
      ) : (
        <>
          {/* Page header */}
          <div style={{ marginBottom: 20, flexShrink: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#0F2A4A", marginBottom: 4 }}>Site Visit Queue</div>
            <div style={{ fontSize: 13, color: "#717881" }}>
              Manage joint site visit scheduling, check-ins, and coordination with the Surveyor.
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {tasks.length === 0 ? (
              <Empty
                variant="no-data"
                title="No site visit tasks"
                description="Tasks appear here when a transaction in your jurisdiction is approved by the Registration Officer."
              />
            ) : (
              <>
                {active.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0F2A4A" }}>Active</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#fff", background: "#1d4670", borderRadius: 10, padding: "1px 8px" }}>{active.length}</span>
                    </div>
                    <TaskTable tasks={active} onManage={setSelected} />
                  </div>
                )}
                {completed.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0F2A4A" }}>Completed</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#545c66", background: "#f0f2f4", borderRadius: 10, padding: "1px 8px" }}>{completed.length}</span>
                    </div>
                    <TaskTable tasks={completed} onManage={setSelected} />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
