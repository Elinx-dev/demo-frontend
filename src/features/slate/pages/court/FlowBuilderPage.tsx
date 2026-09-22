import { useEffect, useState, useCallback } from "react";
import {
  GitBranch, Plus, Trash2, ChevronUp, ChevronDown, Save, Edit2, CheckCircle2,
  XCircle, RefreshCw, Layers, Activity, Users, Zap, FileText, CreditCard, Bell,
  Link, ToggleLeft, ToggleRight, ArrowRight
} from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { Button } from "@/ui/primitives/Button/Button";
import { Input } from "@/ui/primitives/Input/Input";
import { Alert } from "@/ui/primitives/Alert/Alert";
import Badge from "@/ui/primitives/Badge/Badge";
import PageHead from "../../components/PageHead";
import { slateApi } from "../../services/apiClient";

type FlowStep = {
  id: string;
  stepCode: string;
  stepName: string;
  stepOrder: number;
  stepType: string;
  actorRole: string;
  description: string | null;
  executionConfig: Record<string, unknown> | null;
  conditionConfig: Record<string, unknown> | null;
  isMandatory: boolean;
  timeoutHours: number | null;
};

type FlowDetail = {
  id: string;
  flowCode: string;
  flowName: string;
  flowCategory: string;
  description: string | null;
  isActive: boolean;
  version: number;
  txnTypeMap: string[];
  steps: FlowStep[];
};

type FlowSummary = Omit<FlowDetail, "steps">;

const STEP_TYPES = [
  { value: "CITIZEN_ACTION", label: "Citizen Action", icon: Users, color: "#4361ee" },
  { value: "AUTOMATED", label: "Automated", icon: Zap, color: "#7209b7" },
  { value: "DIGITAL_CONSENT", label: "Digital Consent", icon: FileText, color: "#f72585" },
  { value: "PAYMENT", label: "Payment", icon: CreditCard, color: "#f77f00" },
  { value: "APPROVAL", label: "Approval", icon: CheckCircle2, color: "#0077b6" },
  { value: "BLOCKCHAIN_WRITE", label: "Blockchain Write", icon: Link, color: "#06d6a0" },
  { value: "NOTIFICATION", label: "Notification", icon: Bell, color: "#8338ec" },
];

function StepTypeIcon({ type, size = 13 }: { type: string; size?: number }) {
  const def = STEP_TYPES.find((t) => t.value === type);
  if (!def) return <Activity size={size} style={{ color: "#6c757d" }} />;
  const Icon = def.icon;
  return <Icon size={size} style={{ color: def.color }} />;
}

function StepTypePill({ type }: { type: string }) {
  const def = STEP_TYPES.find((t) => t.value === type);
  if (!def) return null;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600,
        padding: "2px 7px", borderRadius: 10,
        background: def.color + "18", color: def.color, border: `1px solid ${def.color}30`,
      }}
    >
      <StepTypeIcon type={type} size={10} />
      {def.label}
    </span>
  );
}

export default function FlowBuilderPage() {
  const [flows, setFlows] = useState<FlowSummary[]>([]);
  const [selected, setSelected] = useState<FlowDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showNewFlow, setShowNewFlow] = useState(false);
  const [newFlow, setNewFlow] = useState({ flowCode: "", flowName: "", flowCategory: "PROPERTY_TRANSFER", description: "" });

  const [editingStep, setEditingStep] = useState<FlowStep | null>(null);
  const [showNewStep, setShowNewStep] = useState(false);
  const [newStep, setNewStep] = useState({
    stepCode: "", stepName: "", stepType: "APPROVAL", actorRole: "",
    description: "", isMandatory: true, timeoutHours: 48,
    executionConfig: "", conditionConfig: "",
  });

  const [showExecModal, setShowExecModal] = useState(false);
  const [executions, setExecutions] = useState<{ id: string; txnId: string; flowCode: string; currentStepCode: string; status: string; startedAt: string }[]>([]);

  const loadFlows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await slateApi.admin.flows.getAll();
      setFlows(data);
    } catch {
      setFlows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFlows(); }, [loadFlows]);

  const selectFlow = async (flowId: string) => {
    setError("");
    setSuccess("");
    setShowNewStep(false);
    setEditingStep(null);
    try {
      const detail = await slateApi.admin.flows.getById(flowId);
      setSelected(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load flow.");
    }
  };

  const handleCreateFlow = async () => {
    if (!newFlow.flowCode || !newFlow.flowName) return;
    setBusy(true);
    setError("");
    try {
      const { id } = await slateApi.admin.flows.create(newFlow);
      await loadFlows();
      await selectFlow(id);
      setShowNewFlow(false);
      setNewFlow({ flowCode: "", flowName: "", flowCategory: "PROPERTY_TRANSFER", description: "" });
      setSuccess("Flow created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async () => {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await slateApi.admin.flows.update(selected.id, { isActive: !selected.isActive });
      setSelected((s) => s ? { ...s, isActive: !s.isActive } : s);
      setFlows((prev) => prev.map((f) => f.id === selected.id ? { ...f, isActive: !f.isActive } : f));
      setSuccess(`Flow ${selected.isActive ? "deactivated" : "activated"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Toggle failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateStep = async () => {
    if (!selected || !newStep.stepCode || !newStep.stepName || !newStep.actorRole) return;
    setBusy(true);
    setError("");
    try {
      let execConfig: Record<string, unknown> | undefined;
      let condConfig: Record<string, unknown> | undefined;
      if (newStep.executionConfig.trim()) { try { execConfig = JSON.parse(newStep.executionConfig); } catch { throw new Error("Execution config is not valid JSON."); } }
      if (newStep.conditionConfig.trim()) { try { condConfig = JSON.parse(newStep.conditionConfig); } catch { throw new Error("Condition config is not valid JSON."); } }

      await slateApi.admin.flows.createStep(selected.id, {
        stepCode: newStep.stepCode,
        stepName: newStep.stepName,
        stepType: newStep.stepType,
        actorRole: newStep.actorRole,
        stepOrder: (selected.steps[selected.steps.length - 1]?.stepOrder ?? 0) + 1,
        description: newStep.description || undefined,
        isMandatory: newStep.isMandatory,
        timeoutHours: newStep.timeoutHours,
        executionConfig: execConfig,
        conditionConfig: condConfig,
      });
      await selectFlow(selected.id);
      setShowNewStep(false);
      setNewStep({ stepCode: "", stepName: "", stepType: "APPROVAL", actorRole: "", description: "", isMandatory: true, timeoutHours: 48, executionConfig: "", conditionConfig: "" });
      setSuccess("Step added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create step failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveStep = async () => {
    if (!editingStep) return;
    setBusy(true);
    setError("");
    try {
      await slateApi.admin.flows.updateStep(editingStep.id, {
        stepName: editingStep.stepName,
        stepType: editingStep.stepType,
        actorRole: editingStep.actorRole,
        description: editingStep.description ?? undefined,
        isMandatory: editingStep.isMandatory,
        timeoutHours: editingStep.timeoutHours ?? undefined,
      });
      await selectFlow(selected!.id);
      setEditingStep(null);
      setSuccess("Step updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    setBusy(true);
    setError("");
    try {
      await slateApi.admin.flows.deleteStep(stepId);
      await selectFlow(selected!.id);
      setSuccess("Step removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleReorder = async (stepId: string, direction: "up" | "down") => {
    if (!selected) return;
    const sorted = [...selected.steps].sort((a, b) => a.stepOrder - b.stepOrder);
    const idx = sorted.findIndex((s) => s.id === stepId);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sorted.length - 1) return;
    const swap = direction === "up" ? idx - 1 : idx + 1;
    const newOrder = sorted.map((s) => s.id);
    [newOrder[idx], newOrder[swap]] = [newOrder[swap], newOrder[idx]];
    setBusy(true);
    try {
      await slateApi.admin.flows.reorderSteps(selected.id, newOrder);
      await selectFlow(selected.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reorder failed.");
    } finally {
      setBusy(false);
    }
  };

  const loadExecutions = async () => {
    if (!selected) return;
    try {
      const data = await slateApi.admin.flows.getExecutions(selected.flowCode);
      setExecutions(data);
      setShowExecModal(true);
    } catch {
      setExecutions([]);
      setShowExecModal(true);
    }
  };

  const sortedSteps = selected ? [...selected.steps].sort((a, b) => a.stepOrder - b.stepOrder) : [];

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="Admin: Blockchain Flow Builder"
          title="Dynamic Flow Configuration"
          sub="Configure the step-by-step execution order of each blockchain transaction flow. Changes take effect immediately, no restart required."
        />
      </div>

      {success && <Alert type="success" message={success} />}
      {error && <Alert type="error" message={error} />}

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        <div className="grid gap-4" style={{ gridTemplateColumns: "280px 1fr" }}>
          {/* Flow list sidebar */}
          <div className="flex flex-col gap-3">
            <Card style={{ padding: "12px 14px" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                <div className="flex items-center gap-2">
                  <Layers size={14} style={{ color: "#4361ee" }} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0F2A4A" }}>Flows</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={loadFlows} style={{ background: "none", border: "none", cursor: "pointer", color: "#6c757d", padding: 3 }} title="Refresh">
                    <RefreshCw size={12} />
                  </button>
                  <button
                    onClick={() => setShowNewFlow(!showNewFlow)}
                    style={{ background: "#4361ee", border: "none", cursor: "pointer", color: "#fff", padding: "3px 7px", borderRadius: 5, fontSize: 11, fontWeight: 600 }}
                  >
                    <Plus size={10} style={{ display: "inline", marginRight: 3 }} />New
                  </button>
                </div>
              </div>

              {showNewFlow && (
                <div className="flex flex-col gap-2" style={{ marginBottom: 10, padding: "10px", background: "#f5f7fa", borderRadius: 8, border: "1px solid #eceef0" }}>
                  <Input label="Flow code" placeholder="TN_SALE_DEED" value={newFlow.flowCode} onChange={(e) => setNewFlow((p) => ({ ...p, flowCode: e.target.value.toUpperCase() }))} />
                  <Input label="Flow name" placeholder="TN Sale Deed Registration" value={newFlow.flowName} onChange={(e) => setNewFlow((p) => ({ ...p, flowName: e.target.value }))} />
                  <Input label="Category" placeholder="PROPERTY_TRANSFER" value={newFlow.flowCategory} onChange={(e) => setNewFlow((p) => ({ ...p, flowCategory: e.target.value }))} />
                  <div className="flex gap-1">
                    <Button onClick={handleCreateFlow} disabled={busy || !newFlow.flowCode || !newFlow.flowName} style={{ flex: 1, fontSize: 11 }}>Create</Button>
                    <Button variant="outline" onClick={() => setShowNewFlow(false)} style={{ fontSize: 11 }}>Cancel</Button>
                  </div>
                </div>
              )}

              {loading ? (
                <div style={{ fontSize: 11.5, color: "#9aa1a9", textAlign: "center", padding: "16px 0" }}>Loading…</div>
              ) : flows.length === 0 ? (
                <div style={{ fontSize: 11.5, color: "#9aa1a9", textAlign: "center", padding: "16px 0" }}>No flows yet</div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {flows.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => selectFlow(f.id)}
                      style={{
                        textAlign: "left", background: selected?.id === f.id ? "#f0f7ff" : "transparent",
                        border: `1px solid ${selected?.id === f.id ? "#4361ee" : "transparent"}`,
                        borderRadius: 7, padding: "8px 10px", cursor: "pointer",
                      }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#0F2A4A", fontFamily: "monospace" }}>{f.flowCode}</span>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: f.isActive ? "#06d6a0" : "#adb5bd", flexShrink: 0 }} />
                      </div>
                      <div style={{ fontSize: 10.5, color: "#717881", marginTop: 1 }}>{f.flowName}</div>
                      <div style={{ fontSize: 10, color: "#9aa1a9", marginTop: 2 }}>v{f.version} · {f.txnTypeMap.join(", ")}</div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Step editor */}
          {!selected ? (
            <Card>
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#9aa1a9" }}>
                <GitBranch size={40} style={{ margin: "0 auto 12px", color: "#dce0e5" }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>Select a flow to configure its steps</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Each step defines who acts, what happens, and in what order.</div>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Flow header */}
              <Card style={{ padding: "14px 16px" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0F2A4A", fontFamily: "monospace" }}>{selected.flowCode}</span>
                      <Badge variant={selected.isActive ? "success" : "default"} size="sm">
                        {selected.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div style={{ fontSize: 12.5, color: "#717881", marginTop: 3 }}>{selected.flowName}</div>
                    <div style={{ fontSize: 11, color: "#9aa1a9", marginTop: 2 }}>
                      Category: {selected.flowCategory} · v{selected.version} · Mapped types: {selected.txnTypeMap.join(", ") || "none"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={loadExecutions} style={{ fontSize: 11 }}>
                      <Activity size={11} /> Executions
                    </Button>
                    <Button
                      variant={selected.isActive ? "outline" : "primary"}
                      onClick={handleToggleActive}
                      disabled={busy}
                      style={{ fontSize: 11, minWidth: 90 }}
                    >
                      {selected.isActive ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                      {selected.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Steps */}
              <Card>
                <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                  <div className="flex items-center gap-2">
                    <ArrowRight size={14} style={{ color: "#0077b6" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0F2A4A" }}>
                      Execution Steps ({sortedSteps.length})
                    </span>
                  </div>
                  <Button onClick={() => { setShowNewStep(true); setEditingStep(null); }} style={{ fontSize: 11 }}>
                    <Plus size={11} /> Add Step
                  </Button>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-2" style={{ marginBottom: 14 }}>
                  {STEP_TYPES.map((t) => (
                    <span key={t.value} className="flex items-center gap-1" style={{ fontSize: 10, color: t.color }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.color, display: "inline-block" }} />
                      {t.label}
                    </span>
                  ))}
                </div>

                {sortedSteps.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px 0", color: "#9aa1a9", fontSize: 12 }}>
                    No steps yet. Add the first step to define the flow.
                  </div>
                ) : (
                  <div className="flex flex-col" style={{ gap: 0 }}>
                    {sortedSteps.map((step, idx) => {
                      const isEditing = editingStep?.id === step.id;
                      return (
                        <div key={step.id} style={{ position: "relative" }}>
                          {idx < sortedSteps.length - 1 && (
                            <div style={{ position: "absolute", left: 21, top: 48, bottom: 0, width: 2, background: "#eceef0", zIndex: 0 }} />
                          )}
                          <div
                            style={{
                              display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0",
                              borderBottom: idx < sortedSteps.length - 1 ? "none" : undefined,
                            }}
                          >
                            {/* Order badge */}
                            <div
                              style={{
                                width: 30, height: 30, borderRadius: "50%", background: "#0F2A4A", color: "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 11, fontWeight: 700, flexShrink: 0, position: "relative", zIndex: 1,
                              }}
                            >
                              {step.stepOrder}
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1 }}>
                              {!isEditing ? (
                                <>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <StepTypeIcon type={step.stepType} size={14} />
                                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#161b22" }}>{step.stepName}</span>
                                    <StepTypePill type={step.stepType} />
                                    {!step.isMandatory && <Badge variant="default" size="sm">Optional</Badge>}
                                  </div>
                                  <div style={{ marginTop: 3, fontSize: 11, color: "#717881", fontFamily: "monospace" }}>
                                    {step.stepCode} · Actor: {step.actorRole}
                                    {step.timeoutHours != null && ` · ${step.timeoutHours}h timeout`}
                                  </div>
                                  {step.description && (
                                    <div style={{ marginTop: 4, fontSize: 11.5, color: "#9aa1a9" }}>{step.description}</div>
                                  )}
                                  {step.executionConfig && Object.keys(step.executionConfig).length > 0 && (
                                    <div style={{ marginTop: 6, padding: "4px 8px", background: "#f5f7fa", borderRadius: 5, fontSize: 10.5, fontFamily: "monospace", color: "#717881", maxHeight: 60, overflow: "hidden" }}>
                                      {JSON.stringify(step.executionConfig, null, 2).slice(0, 200)}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="flex flex-col gap-2" style={{ padding: "10px", background: "#f5f7fa", borderRadius: 8, border: "1px solid #4361ee30" }}>
                                  <Input label="Step name" value={editingStep.stepName} onChange={(e) => setEditingStep((s) => s && { ...s, stepName: e.target.value })} />
                                  <div>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: "#495057", display: "block", marginBottom: 4 }}>Step type</label>
                                    <select
                                      value={editingStep.stepType}
                                      onChange={(e) => setEditingStep((s) => s && { ...s, stepType: e.target.value })}
                                      style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #dde1e6", fontSize: 12 }}
                                    >
                                      {STEP_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                  </div>
                                  <Input label="Actor role" value={editingStep.actorRole} onChange={(e) => setEditingStep((s) => s && { ...s, actorRole: e.target.value })} />
                                  <Input label="Description" value={editingStep.description ?? ""} onChange={(e) => setEditingStep((s) => s && { ...s, description: e.target.value })} />
                                  <div className="flex items-center gap-2">
                                    <input type="checkbox" id={`mand-${step.id}`} checked={editingStep.isMandatory} onChange={(e) => setEditingStep((s) => s && { ...s, isMandatory: e.target.checked })} />
                                    <label htmlFor={`mand-${step.id}`} style={{ fontSize: 11.5 }}>Mandatory step</label>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button onClick={handleSaveStep} disabled={busy} style={{ flex: 1, fontSize: 11 }}>
                                      <Save size={11} /> Save
                                    </Button>
                                    <Button variant="outline" onClick={() => setEditingStep(null)} style={{ fontSize: 11 }}>Cancel</Button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            {!isEditing && (
                              <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
                                <button
                                  onClick={() => handleReorder(step.id, "up")}
                                  disabled={idx === 0 || busy}
                                  style={{ background: "none", border: "none", cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.3 : 1, color: "#6c757d", padding: 4 }}
                                  title="Move up"
                                >
                                  <ChevronUp size={13} />
                                </button>
                                <button
                                  onClick={() => handleReorder(step.id, "down")}
                                  disabled={idx === sortedSteps.length - 1 || busy}
                                  style={{ background: "none", border: "none", cursor: idx === sortedSteps.length - 1 ? "not-allowed" : "pointer", opacity: idx === sortedSteps.length - 1 ? 0.3 : 1, color: "#6c757d", padding: 4 }}
                                  title="Move down"
                                >
                                  <ChevronDown size={13} />
                                </button>
                                <button
                                  onClick={() => { setEditingStep(step); setShowNewStep(false); }}
                                  disabled={busy}
                                  style={{ background: "none", border: "none", cursor: "pointer", color: "#4361ee", padding: 4 }}
                                  title="Edit"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteStep(step.id)}
                                  disabled={busy}
                                  style={{ background: "none", border: "none", cursor: "pointer", color: "#e63946", padding: 4 }}
                                  title="Delete"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* New step form */}
                {showNewStep && (
                  <div style={{ marginTop: 12, padding: "14px", background: "#f0f7ff", borderRadius: 8, border: "1px solid #4361ee30" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0F2A4A", marginBottom: 10 }}>New Step</div>
                    <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                      <Input label="Step code *" placeholder="MAKER_REGISTRATION" value={newStep.stepCode} onChange={(e) => setNewStep((p) => ({ ...p, stepCode: e.target.value.toUpperCase() }))} />
                      <Input label="Step name *" placeholder="Sub-Registrar Maker Review" value={newStep.stepName} onChange={(e) => setNewStep((p) => ({ ...p, stepName: e.target.value }))} />
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#495057", display: "block", marginBottom: 4 }}>Step type *</label>
                        <select
                          value={newStep.stepType}
                          onChange={(e) => setNewStep((p) => ({ ...p, stepType: e.target.value }))}
                          style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #dde1e6", fontSize: 12 }}
                        >
                          {STEP_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <Input label="Actor role *" placeholder="REG_OFFICER_MAKER" value={newStep.actorRole} onChange={(e) => setNewStep((p) => ({ ...p, actorRole: e.target.value }))} />
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <Input label="Description" placeholder="Optional description" value={newStep.description} onChange={(e) => setNewStep((p) => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#495057", display: "block", marginBottom: 4 }}>Execution config (JSON)</label>
                      <textarea
                        value={newStep.executionConfig}
                        onChange={(e) => setNewStep((p) => ({ ...p, executionConfig: e.target.value }))}
                        placeholder={'{"action": "approve", "notifyRoles": ["CITIZEN"]}'}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #dde1e6", fontSize: 11.5, fontFamily: "monospace", resize: "vertical", minHeight: 60, boxSizing: "border-box" }}
                      />
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#495057", display: "block", marginBottom: 4 }}>Condition config (JSON)</label>
                      <textarea
                        value={newStep.conditionConfig}
                        onChange={(e) => setNewStep((p) => ({ ...p, conditionConfig: e.target.value }))}
                        placeholder={'{"requiresTahsildar": true}'}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #dde1e6", fontSize: 11.5, fontFamily: "monospace", resize: "vertical", minHeight: 40, boxSizing: "border-box" }}
                      />
                    </div>
                    <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
                      <input type="checkbox" id="new-step-mand" checked={newStep.isMandatory} onChange={(e) => setNewStep((p) => ({ ...p, isMandatory: e.target.checked }))} />
                      <label htmlFor="new-step-mand" style={{ fontSize: 11.5 }}>Mandatory step</label>
                    </div>
                    <div className="flex gap-2" style={{ marginTop: 10 }}>
                      <Button onClick={handleCreateStep} disabled={busy || !newStep.stepCode || !newStep.stepName || !newStep.actorRole} style={{ flex: 1, fontSize: 11 }}>
                        <Plus size={11} /> {busy ? "Adding…" : "Add Step"}
                      </Button>
                      <Button variant="outline" onClick={() => setShowNewStep(false)} style={{ fontSize: 11 }}>Cancel</Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>

        {/* Executions modal */}
        {showExecModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: "24px", width: 600, maxHeight: "80vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <div className="flex items-center gap-2">
                  <Activity size={16} style={{ color: "#4361ee" }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0F2A4A" }}>
                    Executions: {selected?.flowCode}
                  </span>
                </div>
                <button onClick={() => setShowExecModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <XCircle size={18} style={{ color: "#adb5bd" }} />
                </button>
              </div>
              {executions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px", color: "#9aa1a9", fontSize: 12 }}>No executions yet for this flow.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f5f7fa" }}>
                      {["TXN ID", "Current Step", "Status", "Started"].map((h) => (
                        <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontWeight: 600, fontSize: 10.5, color: "#717881", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {executions.map((ex) => (
                      <tr key={ex.id} style={{ borderBottom: "1px solid #f0f2f5" }}>
                        <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: 11.5 }}>{ex.txnId}</td>
                        <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: 11 }}>{ex.currentStepCode}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <Badge variant={ex.status === "completed" ? "success" : ex.status === "failed" ? "error" : "warning"} size="sm">{ex.status}</Badge>
                        </td>
                        <td style={{ padding: "8px 10px", fontSize: 11, color: "#717881" }}>
                          {new Date(ex.startedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
