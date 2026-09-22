import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2, XCircle, AlertTriangle, Landmark, ListChecks,
  MapPin, Users, Compass, FileText, Bell, RefreshCw,
} from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { Button } from "@/ui/primitives/Button/Button";
import { Input } from "@/ui/primitives/Input/Input";
import { Tabs } from "@/ui/primitives/Tabs/Tabs";
import Badge from "@/ui/primitives/Badge/Badge";
import Empty from "@/ui/primitives/Empty/Empty";
import { Alert } from "@/ui/primitives/Alert/Alert";
import { useToast } from "@/ui/feedback/toast/useToast";
import { useSlateStore } from "../../state/SlateProvider";
import { slateApi } from "../../services/apiClient";
import { generatePattaPDF } from "../../services/pattaService";
import DashboardHero from "../../components/DashboardHero";
import KpiCard from "../../components/KpiCard";
import StateBadge from "../../components/StateBadge";
import ParcelMap from "../../components/ParcelMap";
import { DlGrid, DlRow } from "../../components/DefinitionList";
import { inr, inrShort } from "../../utils/format";
import type { OfficerQueueItem, SlateToken } from "../../types/slate.types";

export default function RevenueDashboardPage() {
  const { can, currentUser } = useSlateStore();
  const toast = useToast();

  const [queue, setQueue] = useState<OfficerQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<OfficerQueueItem | null>(null);
  const [token, setToken] = useState<SlateToken | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [approvedItem, setApprovedItem] = useState<{ txnId: string; ulpin: string; buyerName: string } | null>(null);

  if (!can("revenue.approve") && !can("audit.view")) {
    return (
      <Empty
        variant="no-permission"
        title="No access to Revenue Officer portal"
        description="Your role doesn't carry the Revenue Approve permission."
      />
    );
  }

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setQueue(await slateApi.revenue.getQueue());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load the revenue queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = queue.filter((q) => q.status === "pending_tahsildar");
  const completed = queue.filter((q) => q.status === "approved");

  const openDetail = (item: OfficerQueueItem) => {
    setSelected(item);
    setToken(null);
    setShowReject(false);
    setRejectReason("");
    setApprovedItem(null);
    setTokenLoading(true);
    slateApi.citizen
      .getPropertyDetail(item.ulpin)
      .then(setToken)
      .catch(() => setToken(null))
      .finally(() => setTokenLoading(false));
  };

  const handleApprove = async () => {
    if (!selected) return;
    setActionBusy(true);
    try {
      await slateApi.revenue.approve(selected.txnId as unknown as string);
      const buyerName = selected.recipientName ?? selected.parties?.split("→")[1]?.trim() ?? "the new owner";
      setApprovedItem({ txnId: selected.txnId as unknown as string, ulpin: selected.ulpin, buyerName });
      toast.success(`Mutation approved. Patta being generated for ${selected.ulpin}.`);
      if (token) {
        generatePattaPDF(token, selected.txnId as unknown as string);
      }
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not approve.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleReject = async () => {
    if (!selected || !rejectReason.trim()) return;
    setActionBusy(true);
    try {
      await slateApi.revenue.reject(selected.txnId as unknown as string, rejectReason.trim());
      toast.info(`Transaction ${selected.id} rejected and returned for correction.`);
      setSelected(null);
      setToken(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reject.");
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <DashboardHero
          eyebrow="Revenue Officer Portal"
          title={`Welcome back, ${currentUser?.name ?? "Revenue Officer"}`}
          sub="Review and approve land mutation transactions forwarded after survey verification. Approval triggers Revenue Document generation and notifies the new owner."
          accent="#1d4670"
          icon={<Landmark size={22} />}
        />
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(3, 1fr)", margin: "16px 0 20px" }}>
          <KpiCard
            label="Pending Mutation"
            value={pending.length}
            icon={<ListChecks size={18} />}
            accent="#B8722E"
            foot={pending.length ? "Awaiting approval" : "All clear"}
            footKind={pending.length ? "warn" : "up"}
          />
          <KpiCard label="Approved" value={completed.length} icon={<CheckCircle2 size={18} />} accent="#1C7A4E" />
          <KpiCard label="Revenue Office" value={currentUser?.jurisdictionLabel ?? currentUser?.jurisdiction?.district ?? "-"} icon={<Landmark size={18} />} accent="#1d4670" />
        </div>
      </div>

      {loadError && <Alert type="error" message={loadError} dismissible={false} />}

      <div className="flex-1" style={{ minHeight: 0, display: "grid", gridTemplateColumns: selected ? "340px 1fr" : "1fr", gap: 16, overflow: "hidden" }}>
        {/* ── Left: queue list ── */}
        <div style={{ overflowY: "auto", minHeight: 0 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F2A4A" }}>
              Pending Mutations
              {pending.length > 0 && (
                <span style={{ marginLeft: 6, fontSize: 11, background: "#e85d04", color: "#fff", borderRadius: 10, padding: "1px 7px" }}>
                  {pending.length}
                </span>
              )}
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
            <div style={{ fontSize: 12.5, color: "#9aa1a9", padding: "20px 0" }}>Loading…</div>
          ) : pending.length === 0 ? (
            <Empty variant="no-data" title="No mutations pending" description="Transactions forwarded by the Survey Office appear here." />
          ) : (
            <div className="flex flex-col gap-2" style={{ marginBottom: 16 }}>
              {pending.map((item) => {
                const isActive = selected?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => openDetail(item)}
                    style={{
                      textAlign: "left",
                      background: isActive ? "#f0f8f4" : "#fafbfc",
                      border: `1px solid ${isActive ? "#1C7A4E" : "#eceef0"}`,
                      borderRadius: 8,
                      padding: "12px 14px",
                      cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 12.5, fontWeight: 700, color: "#0F2A4A" }}>{item.id}</span>
                      {item.priority === "high" && <Badge size="sm" variant="danger">High</Badge>}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#545c66" }}>
                      <strong>{item.type}</strong> · <span style={{ fontFamily: "monospace" }}>{item.ulpin}</span>
                    </div>
                    {item.parties && <div style={{ fontSize: 11, color: "#9aa1a9", marginTop: 2 }}>{item.parties}</div>}
                    <div className="flex items-center justify-between" style={{ marginTop: 5 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: "#1C7A4E" }}>{inr(item.amount)}</span>
                      <span style={{ fontSize: 10.5, color: "#b5bdc5" }}>{item.submitted}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Completed section */}
          {completed.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9aa1a9", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Approved
              </div>
              <div className="flex flex-col gap-2">
                {completed.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openDetail(item)}
                    style={{
                      textAlign: "left",
                      background: "#f5faf7",
                      border: "1px solid #d4edda",
                      borderRadius: 8,
                      padding: "10px 12px",
                      cursor: "pointer",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#0F2A4A" }}>{item.id}</span>
                      <Badge size="sm" variant="success">Approved</Badge>
                    </div>
                    <div style={{ fontSize: 11, color: "#717881", marginTop: 3 }}>{item.type} · {item.ulpin}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Right: detail + actions ── */}
        {selected && (
          <div style={{ overflowY: "auto", minHeight: 0 }} className="flex flex-col gap-4">
            {/* Post-approval panel */}
            {approvedItem && (
              <div
                style={{
                  padding: "14px 18px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #f0f8f2 0%, #e8f5e9 100%)",
                  border: "1.5px solid #1C7A4E",
                }}
              >
                <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                  <CheckCircle2 size={16} style={{ color: "#1C7A4E" }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1C7A4E" }}>Mutation Approved & Patta Generated</div>
                </div>
                <div style={{ fontSize: 12, color: "#161b22", marginBottom: 8 }}>
                  The ownership of <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{approvedItem.ulpin}</span> has been transferred.
                  The Patta document opened for printing.
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    padding: "9px 12px",
                    background: "#fff",
                    borderRadius: 7,
                    border: "1px solid #bfe6cc",
                    marginBottom: 10,
                  }}
                >
                  <Bell size={13} style={{ color: "#1C7A4E", marginTop: 1, flexShrink: 0 }} />
                  <div style={{ fontSize: 11.5, color: "#1a5c35" }}>
                    <strong>{approvedItem.buyerName}</strong> has been notified that{" "}
                    <span style={{ fontFamily: "monospace" }}>{approvedItem.ulpin}</span> is now registered under their name.
                    The Patta document is visible in their citizen portal.
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => { if (token) generatePattaPDF(token, approvedItem.txnId); }}
                  style={{ borderColor: "#B8923D", color: "#B8923D", width: "100%" }}
                >
                  <FileText size={13} /> Re-print Patta
                </Button>
              </div>
            )}

            {tokenLoading && (
              <div style={{ fontSize: 12.5, color: "#9aa1a9", padding: "20px 0" }}>Loading parcel details…</div>
            )}

            {!tokenLoading && token && (
              <>
                {/* Property Passport */}
                <div>
                  <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F2A4A" }}>
                      Property Passport -{" "}
                      <span style={{ fontFamily: "monospace", color: "#1d4670" }}>{token.ulpin}</span>
                    </div>
                    <StateBadge state={token.state} size="sm" />
                    <span style={{ fontSize: 11.5, color: "#9aa1a9" }}>
                      {[token.location.village, token.location.taluk, token.location.district].filter(Boolean).join(", ")}
                    </span>
                  </div>

                  <Tabs
                    variant="underline"
                    size="sm"
                    tabs={[
                      {
                        id: "identity",
                        label: "Identity & Location",
                        icon: <MapPin size={13} />,
                        content: (
                          <Card>
                            <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                              <ParcelMap gps={token.location.gpsCentroid} height={200} />
                              <DlGrid>
                                <DlRow label="Survey No." value={token.identity.surveyNo} />
                                <DlRow label="Sub-division" value={token.identity.subDivision} />
                                <DlRow label="Token ID" value={token.identity.tokenId} />
                                <DlRow label="Parcel Type" value={token.identity.parcelType} />
                                <DlRow label="District" value={token.location.district} />
                                <DlRow label="Taluk" value={token.location.taluk} />
                                <DlRow label="Village" value={token.location.village} />
                                <DlRow label="Area" value={token.physical.area} />
                                <DlRow label="Boundaries" full value={token.physical.boundaries} />
                              </DlGrid>
                            </div>
                          </Card>
                        ),
                      },
                      {
                        id: "ownership",
                        label: "Ownership & Physical",
                        icon: <Users size={13} />,
                        content: (
                          <Card>
                            <DlGrid>
                              <DlRow label="Owner(s)" full value={token.ownership.owners.map((o) => `${o.name} (${o.share}%)`).join(", ")} />
                              <DlRow label="Ownership Type" value={token.ownership.ownershipType} />
                              <DlRow label="Acquired" value={token.ownership.acquisitionDate} />
                              <DlRow label="Classification" value={token.physical.classification} />
                              <DlRow label="FMB Ref" value={token.physical.fmbRef} />
                            </DlGrid>
                          </Card>
                        ),
                      },
                      {
                        id: "financial",
                        label: "Encumbrance & Financial",
                        icon: <Landmark size={13} />,
                        content: (
                          <Card>
                            <DlGrid>
                              <DlRow label="Encumbrance" value={token.encumbrance.flag ? `${token.encumbrance.lienType} (${token.encumbrance.lender})` : "None"} />
                              <DlRow label="Charge Amount" value={inr(token.encumbrance.chargeAmount)} />
                              <DlRow label="Dispute" value={token.dispute.flag ? token.dispute.status : "Clear"} />
                              <DlRow label="Guideline Value" value={inrShort(token.financial.guidanceValue)} />
                              <DlRow label="Last Sale Value" value={inrShort(token.financial.lastSaleValue)} />
                              <DlRow label="Stamp Duty Ref" value={token.financial.stampDutyRef ?? "-"} />
                            </DlGrid>
                          </Card>
                        ),
                      },
                      ...(token.survey
                        ? [
                            {
                              id: "survey",
                              label: "Survey",
                              icon: <Compass size={13} />,
                              content: (
                                <Card>
                                  {token.survey.conflict?.flag ? (
                                    <Alert
                                      type="error"
                                      title="Survey area conflict - review carefully before approving"
                                      message={`Surveyor recorded ${token.survey.conflict.reportedArea} vs token record ${token.survey.conflict.tokenArea}. Verify physical documents before mutation.`}
                                      dismissible={false}
                                    />
                                  ) : (
                                    <Alert
                                      type="success"
                                      title="Survey verified - no conflict"
                                      message={`Verified by ${token.survey.verifiedBy} on ${token.survey.verifiedAt}.`}
                                      dismissible={false}
                                    />
                                  )}
                                  <div style={{ marginTop: 14 }}>
                                    <DlGrid>
                                      <DlRow label="Verified by" value={token.survey.verifiedBy} />
                                      <DlRow label="Verified on" value={token.survey.verifiedAt} />
                                      <DlRow label="Latitude" value={token.survey.lat.toFixed(5)} />
                                      <DlRow label="Longitude" value={token.survey.lng.toFixed(5)} />
                                      {token.survey.surveyedArea && <DlRow label="Surveyed Area" value={token.survey.surveyedArea} />}
                                      {token.survey.notes && <DlRow label="Site Notes" full value={token.survey.notes} />}
                                    </DlGrid>
                                    {token.survey.measurements && token.survey.measurements.length > 0 && (
                                      <div style={{ marginTop: 14 }}>
                                        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9aa1a9", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                                          Boundary Measurements
                                        </div>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                          <thead>
                                            <tr style={{ background: "#f4f8fd" }}>
                                              <th style={{ padding: "5px 8px", textAlign: "left", border: "1px solid #dce0e5", fontWeight: 600, color: "#545c66" }}>From</th>
                                              <th style={{ padding: "5px 8px", textAlign: "center", border: "1px solid #dce0e5", color: "#9aa1a9" }}>→</th>
                                              <th style={{ padding: "5px 8px", textAlign: "left", border: "1px solid #dce0e5", fontWeight: 600, color: "#545c66" }}>To</th>
                                              <th style={{ padding: "5px 8px", textAlign: "right", border: "1px solid #dce0e5", fontWeight: 600, color: "#545c66" }}>Measurement</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {token.survey.measurements.map((m, i) => (
                                              <tr key={i}>
                                                <td style={{ padding: "5px 8px", border: "1px solid #eceef0" }}>{m.from}</td>
                                                <td style={{ padding: "5px 8px", border: "1px solid #eceef0", textAlign: "center", color: "#9aa1a9" }}>→</td>
                                                <td style={{ padding: "5px 8px", border: "1px solid #eceef0" }}>{m.to}</td>
                                                <td style={{ padding: "5px 8px", border: "1px solid #eceef0", textAlign: "right", fontFamily: "monospace" }}>{m.val}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              ),
                            },
                          ]
                        : []),
                    ]}
                  />
                </div>

                {/* Action card - only show when not yet approved */}
                {!approvedItem && (
                  <Card>
                    {/* Conflict warning */}
                    {token.survey?.conflict?.flag && (
                      <div
                        style={{
                          marginBottom: 14,
                          padding: "10px 14px",
                          borderRadius: 8,
                          background: "#fdf0ee",
                          border: "1px solid #f5c6cb",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <AlertTriangle size={14} style={{ color: "#B0392F", marginTop: 1, flexShrink: 0 }} />
                        <div style={{ fontSize: 11.5, color: "#7c2d2d" }}>
                          <strong>Conflict on record.</strong> Surveyed area ({token.survey.conflict.reportedArea}) vs token area ({token.survey.conflict.tokenArea}).
                          Ensure physical documents are verified before approving.
                        </div>
                      </div>
                    )}

                    {/* Irreversible notice */}
                    <div
                      style={{
                        marginBottom: 14,
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid #ffd6a5",
                        background: "#fff8f0",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <AlertTriangle size={14} style={{ color: "#e85d04", marginTop: 1, flexShrink: 0 }} />
                      <div style={{ fontSize: 11.5, color: "#7c4a00" }}>
                        <strong>Revenue Mutation:</strong> Approving transfers ownership on-chain for{" "}
                        <span style={{ fontFamily: "monospace" }}>{selected.ulpin}</span>, generates the Patta document, and notifies{" "}
                        <strong>{selected.recipientName ?? "the buyer"}</strong>. This action is irreversible.
                      </div>
                    </div>

                    {!showReject ? (
                      <div className="flex gap-2">
                        <Button onClick={handleApprove} disabled={actionBusy} style={{ flex: 1 }}>
                          <CheckCircle2 size={14} />
                          {actionBusy ? "Approving…" : "Approve & Generate Patta"}
                        </Button>
                        <Button variant="outline" onClick={() => setShowReject(true)} disabled={actionBusy}>
                          <XCircle size={14} /> Reject
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => generatePattaPDF(token, selected.txnId as unknown as string)}
                          style={{ borderColor: "#B8923D", color: "#B8923D" }}
                        >
                          <FileText size={13} /> Preview Patta
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Input
                          label="Reason for rejection"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Briefly describe why this mutation is being rejected"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleReject}
                            disabled={actionBusy || !rejectReason.trim()}
                            style={{ flex: 1 }}
                          >
                            <XCircle size={14} /> {actionBusy ? "Rejecting…" : "Confirm Rejection"}
                          </Button>
                          <Button variant="outline" onClick={() => setShowReject(false)} disabled={actionBusy}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                )}
              </>
            )}

            {!tokenLoading && !token && (
              <Alert type="error" message="Could not load parcel details for this transaction." dismissible={false} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
