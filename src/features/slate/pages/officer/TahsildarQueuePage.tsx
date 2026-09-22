import { useEffect, useState } from "react";
import { ClipboardCheck, CheckCircle2, XCircle, RefreshCw, AlertTriangle, GitBranch, User, MapPin, IndianRupee, Clock, FileText } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { Button } from "@/ui/primitives/Button/Button";
import { Input } from "@/ui/primitives/Input/Input";
import { Alert } from "@/ui/primitives/Alert/Alert";
import Badge from "@/ui/primitives/Badge/Badge";
import PageHead from "../../components/PageHead";
import { slateApi } from "../../services/apiClient";
import { generatePattaPDF } from "../../services/pattaService";
import { inr, fmtTs } from "../../utils/format";
import type { OfficerQueueItem, SlateToken } from "../../types/slate.types";

interface FlowStep {
  stepCode: string;
  actorId: string;
  completedAt: string;
  metadata?: Record<string, unknown>;
}

interface ExecutionDetail {
  txnId: string;
  flowCode: string;
  currentStepCode: string;
  status: string;
  stepHistory: FlowStep[];
}

const STEP_TYPE_COLORS: Record<string, string> = {
  CITIZEN_ACTION: "#4361ee",
  AUTOMATED: "#7209b7",
  DIGITAL_CONSENT: "#f72585",
  PAYMENT: "#f77f00",
  APPROVAL: "#0077b6",
  BLOCKCHAIN_WRITE: "#06d6a0",
  NOTIFICATION: "#8338ec",
};

function flowStepDot(stepCode: string) {
  if (stepCode.includes("CONSENT")) return STEP_TYPE_COLORS.DIGITAL_CONSENT;
  if (stepCode.includes("PAYMENT")) return STEP_TYPE_COLORS.PAYMENT;
  if (stepCode.includes("MAKER") || stepCode.includes("CHECKER")) return STEP_TYPE_COLORS.APPROVAL;
  if (stepCode.includes("BLOCKCHAIN") || stepCode.includes("CHAIN")) return STEP_TYPE_COLORS.BLOCKCHAIN_WRITE;
  if (stepCode.includes("TAHSILDAR") || stepCode.includes("REVENUE")) return "#e85d04";
  return "#6c757d";
}

export default function TahsildarQueuePage() {
  const [queue, setQueue] = useState<OfficerQueueItem[]>([]);
  const [selected, setSelected] = useState<OfficerQueueItem | null>(null);
  const [selectedToken, setSelectedToken] = useState<SlateToken | null>(null);
  const [execution, setExecution] = useState<ExecutionDetail | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    slateApi.tahsildar
      .getQueue()
      .then(setQueue)
      .catch(() => setQueue([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const selectItem = async (item: OfficerQueueItem) => {
    setSelected(item);
    setSelectedToken(null);
    setShowRejectForm(false);
    setRejectReason("");
    setError("");
    setSuccess("");
    const ulpin = (item as unknown as { ulpin: string }).ulpin;
    if (ulpin) {
      slateApi.citizen.getPropertyDetail(ulpin).then(setSelectedToken).catch(() => setSelectedToken(null));
    }
    try {
      const ex = await slateApi.tahsildar.getExecutionDetail(item.txnId as unknown as string);
      setExecution(ex);
    } catch {
      setExecution(null);
    }
  };

  const handleApprove = async () => {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await slateApi.tahsildar.approveMutation(selected.txnId as unknown as string);
      setSuccess(`Mutation approved: ownership transfer recorded on-chain for ${selected.txnId}.`);
      setSelected(null);
      setExecution(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!selected || !rejectReason.trim()) return;
    setBusy(true);
    setError("");
    try {
      await slateApi.tahsildar.rejectMutation(selected.txnId as unknown as string, rejectReason.trim());
      setSuccess(`Mutation rejected: ${selected.txnId} returned for correction.`);
      setSelected(null);
      setExecution(null);
      setShowRejectForm(false);
      setRejectReason("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rejection failed.");
    } finally {
      setBusy(false);
    }
  };

  const txnTypeLabel: Record<string, string> = {
    sale: "Sale Deed",
    gift: "Gift Deed",
    partition: "Partition Deed",
    mortgage_request: "Mortgage",
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="Revenue Department: Tahsildar Portal"
          title="Patta Mutation Queue"
          sub="Review property transactions pending Revenue Department approval. Approve to execute on-chain ownership transfer and initiate patta mutation."
        />
      </div>

      {success && (
        <Alert type="success" message={success} dismissible onDismiss={() => setSuccess("")} />
      )}

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        <div className="grid gap-4" style={{ gridTemplateColumns: selected ? "1fr 1.4fr" : "1fr" }}>
          {/* Queue list */}
          <Card>
            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <div className="flex items-center gap-2">
                <ClipboardCheck size={16} style={{ color: "#0077b6" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0F2A4A" }}>
                  Pending Mutations
                  {queue.length > 0 && (
                    <span style={{ marginLeft: 6, fontSize: 11, background: "#e85d04", color: "#fff", borderRadius: 10, padding: "1px 7px" }}>
                      {queue.length}
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={load}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6c757d", padding: 4 }}
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#9aa1a9", fontSize: 12 }}>Loading…</div>
            ) : queue.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <ClipboardCheck size={32} style={{ color: "#dce0e5", margin: "0 auto 10px" }} />
                <div style={{ fontSize: 13, color: "#9aa1a9" }}>No pending mutations</div>
                <div style={{ fontSize: 11.5, color: "#b5bdc5", marginTop: 4 }}>All transactions are up to date.</div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {queue.map((item) => {
                  const txnId = item.txnId as unknown as string;
                  const isActive = selected?.txnId === item.txnId;
                  return (
                    <button
                      key={txnId}
                      onClick={() => selectItem(item)}
                      style={{
                        textAlign: "left",
                        background: isActive ? "#f0f7ff" : "#fafbfc",
                        border: `1px solid ${isActive ? "#4361ee" : "#eceef0"}`,
                        borderRadius: 8,
                        padding: "11px 13px",
                        cursor: "pointer",
                        transition: "border-color 0.15s",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F2A4A", fontFamily: "monospace" }}>{txnId}</div>
                          <div style={{ fontSize: 11.5, color: "#717881", marginTop: 2 }}>
                            {txnTypeLabel[(item as unknown as { type: string }).type] ?? (item as unknown as { type: string }).type}
                          </div>
                        </div>
                        <Badge variant="warning" size="sm">Pending Mutation</Badge>
                      </div>
                      <div style={{ marginTop: 7, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px" }}>
                        <div className="flex items-center gap-1.5" style={{ fontSize: 11, color: "#717881" }}>
                          <MapPin size={10} /> {(item as unknown as { ulpin: string }).ulpin}
                        </div>
                        <div className="flex items-center gap-1.5" style={{ fontSize: 11, color: "#717881" }}>
                          <IndianRupee size={10} /> {inr((item as unknown as { amount: number }).amount || 0)}
                        </div>
                        <div className="flex items-center gap-1.5" style={{ fontSize: 11, color: "#717881", gridColumn: "1 / -1" }}>
                          <User size={10} /> {(item as unknown as { parties: string }).parties}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Detail panel */}
          {selected && (
            <div className="flex flex-col gap-3">
              {/* Survey conflict banner */}
              {selectedToken?.survey?.conflict?.flag && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "#fdf0ee",
                    border: "1px solid #f5c6cb",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <AlertTriangle size={15} style={{ color: "#B0392F", marginTop: 1, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#B0392F" }}>Survey Area Conflict</div>
                    <div style={{ fontSize: 11.5, color: "#7c2d2d", marginTop: 2 }}>
                      Surveyor recorded <strong>{selectedToken.survey.conflict.reportedArea}</strong> but token record shows{" "}
                      <strong>{selectedToken.survey.conflict.tokenArea}</strong>. Verify before approving mutation.
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction detail */}
              <Card>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F2A4A", marginBottom: 12 }}>
                  Transaction Detail
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
                  {[
                    { label: "Transaction ID", value: selected.txnId as unknown as string },
                    { label: "Type", value: txnTypeLabel[(selected as unknown as { type: string }).type] ?? (selected as unknown as { type: string }).type },
                    { label: "ULPIN", value: (selected as unknown as { ulpin: string }).ulpin },
                    { label: "Amount", value: inr((selected as unknown as { amount: number }).amount || 0) },
                    { label: "Parties", value: (selected as unknown as { parties: string }).parties },
                    { label: "Submitted", value: fmtTs((selected as unknown as { submitted: string }).submitted) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ gridColumn: label === "Parties" ? "1 / -1" : undefined }}>
                      <div style={{ fontSize: 10.5, fontWeight: 600, color: "#9aa1a9", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 12.5, color: "#161b22", fontFamily: label === "Transaction ID" || label === "ULPIN" ? "monospace" : undefined }}>{value}</div>
                    </div>
                  ))}
                </div>

                {(selected as unknown as { witnessDetails: { name: string; address: string }[] | null }).witnessDetails?.length ? (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #eceef0" }}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: "#9aa1a9", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Registered Witnesses</div>
                    <div className="flex flex-col gap-2">
                      {(selected as unknown as { witnessDetails: { name: string; address: string }[] }).witnessDetails.map((w, i) => (
                        <div key={i} style={{ fontSize: 12, color: "#161b22", padding: "7px 10px", background: "#f5f7fa", borderRadius: 6 }}>
                          <strong>Witness {i + 1}:</strong> {w.name}, {w.address}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {error && <Alert type="error" message={error} dismissible onDismiss={() => setError("")} />}

                <div className="flex gap-2" style={{ marginTop: 14, flexWrap: "wrap" }}>
                  {!showRejectForm ? (
                    <>
                      <Button onClick={handleApprove} disabled={busy} style={{ flex: 1 }}>
                        <CheckCircle2 size={14} /> {busy ? "Approving…" : "Approve Mutation"}
                      </Button>
                      <Button variant="outline" onClick={() => setShowRejectForm(true)} disabled={busy} style={{ flex: 1 }}>
                        <XCircle size={14} /> Reject
                      </Button>
                      {selectedToken && (
                        <Button
                          variant="outline"
                          onClick={() => generatePattaPDF(selectedToken, selected.txnId as unknown as string)}
                          style={{ flex: 1, borderColor: "#B8923D", color: "#B8923D" }}
                        >
                          <FileText size={14} /> Generate Patta
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col gap-2" style={{ width: "100%" }}>
                      <Input
                        label="Rejection reason"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="State the reason for rejection…"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleReject} disabled={busy || !rejectReason.trim()} style={{ flex: 1 }}>
                          <XCircle size={14} /> {busy ? "Rejecting…" : "Confirm Rejection"}
                        </Button>
                        <Button variant="outline" onClick={() => setShowRejectForm(false)} disabled={busy}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Flow execution timeline */}
              <Card>
                <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
                  <GitBranch size={14} style={{ color: "#7209b7" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0F2A4A" }}>Flow Execution Timeline</span>
                  {execution && (
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#6c757d", fontFamily: "monospace" }}>{execution.flowCode}</span>
                  )}
                </div>

                {!execution ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#9aa1a9", fontSize: 12 }}>
                    <GitBranch size={24} style={{ margin: "0 auto 8px", color: "#dce0e5" }} />
                    No execution record found
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: "#0077b6", fontWeight: 600 }}>
                        Current step: <code style={{ fontSize: 11 }}>{execution.currentStepCode}</code>
                      </div>
                      <span style={{ marginLeft: "auto" }}>
                        <Badge variant={execution.status === "completed" ? "success" : execution.status === "failed" ? "error" : "warning"} size="sm">
                          {execution.status}
                        </Badge>
                      </span>
                    </div>

                    {execution.stepHistory.length > 0 ? (
                      <div className="flex flex-col" style={{ gap: 0 }}>
                        {execution.stepHistory.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-3" style={{ paddingBottom: idx < execution.stepHistory.length - 1 ? 12 : 0, position: "relative" }}>
                            {idx < execution.stepHistory.length - 1 && (
                              <div style={{ position: "absolute", left: 7, top: 16, bottom: 0, width: 2, background: "#eceef0" }} />
                            )}
                            <div
                              style={{
                                width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                                background: flowStepDot(step.stepCode), border: "2px solid #fff",
                                boxShadow: "0 0 0 1px " + flowStepDot(step.stepCode),
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#161b22", fontFamily: "monospace" }}>{step.stepCode}</div>
                              <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 2 }}>
                                {step.actorId && (
                                  <span className="flex items-center gap-1" style={{ fontSize: 10.5, color: "#717881" }}>
                                    <User size={9} /> {step.actorId}
                                  </span>
                                )}
                                <span className="flex items-center gap-1" style={{ fontSize: 10.5, color: "#717881" }}>
                                  <Clock size={9} /> {new Date(step.completedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              {step.metadata && Object.keys(step.metadata).length > 0 && (
                                <div style={{ marginTop: 3, fontSize: 10.5, color: "#9aa1a9" }}>
                                  {Object.entries(step.metadata).map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: "#9aa1a9" }}>No step history yet.</div>
                    )}
                  </>
                )}
              </Card>

              {/* Tahsildar note */}
              <div style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #ffd6a5", background: "#fff8f0" }}>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} style={{ color: "#e85d04", marginTop: 1, flexShrink: 0 }} />
                  <div style={{ fontSize: 11.5, color: "#7c4a00" }}>
                    <strong>Revenue Mutation:</strong> Approving this transaction executes the on-chain ownership transfer and initiates Patta mutation in the Revenue Department records. This action is irreversible. Verify documents, Survey Number, and extent before approving.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
