import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, XCircle, AlertTriangle, FileStack, Compass, FileText } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { Button } from "@/ui/primitives/Button/Button";
import Badge from "@/ui/primitives/Badge/Badge";
import Empty from "@/ui/primitives/Empty/Empty";
import { UploadZone } from "@/ui/primitives/UploadZone/UploadZone";
import { Alert } from "@/ui/primitives/Alert/Alert";
import { ConfirmationModal } from "@/ui/primitives/ConformationModal/ConfirmationModal";
import { useToast } from "@/ui/feedback/toast/useToast";
import { slateApi } from "../../services/apiClient";
import PageHead from "../../components/PageHead";
import StateBadge from "../../components/StateBadge";
import { PropertySplitView } from "../../components/PropertySplitView";
import { DlGrid, DlRow } from "../../components/DefinitionList";
import { inr, inrShort } from "../../utils/format";
import { generatePattaPDF } from "../../services/pattaService";
import type { OfficerQueueItem, SlateToken, SlateDocument } from "../../types/slate.types";

export default function TransactionDetailPage() {
  const { txnId = "" } = useParams<{ txnId: string }>();
  const toast = useToast();
  const [confirmAction, setConfirmAction] = useState<"approve" | "exception" | null>(null);
  const [item, setItem] = useState<OfficerQueueItem | null | undefined>(undefined);
  const [token, setToken] = useState<SlateToken | null>(null);
  const [checks, setChecks] = useState<{ label: string; pass: boolean; detail: string }[]>([]);
  const [pattaDoc, setPattaDoc] = useState<SlateDocument | null>(null);

  const load = useCallback(() => {
    return slateApi.officer.getQueue().then((all) => {
      const found = all.find((q) => q.id === txnId) ?? null;
      setItem(found);
      if (!found) return;
      slateApi.citizen.getPropertyDetail(found.ulpin).then(setToken).catch(() => setToken(null));
      slateApi.citizen.getRuleChecks(found.ulpin).then(setChecks).catch(() => setChecks([]));
      slateApi.citizen
        .getDocuments(found.ulpin)
        .then((docs) => setPattaDoc(docs.find((d) => d.docType === "patta") ?? null))
        .catch(() => setPattaDoc(null));
    });
  }, [txnId]);

  useEffect(() => {
    load();
  }, [load]);

  if (item === undefined) {
    return <div style={{ fontSize: 12.5, color: "#9aa1a9", padding: "20px 0" }}>Loading…</div>;
  }
  if (!item) {
    return <Empty variant="no-data" title="Transaction not found" description={`No queue item found for ${txnId}.`} />;
  }

  const canAct = item.status === "pending_maker";

  const handleUploadPatta = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      slateApi.citizen
        .uploadDocument({ ulpin: item.ulpin, docType: "patta", fileName: file.name, dataUrl: String(reader.result) })
        .then(() => {
          toast.success(`Patta document uploaded for ${item.ulpin}.`);
          load();
        })
        .catch((err) => toast.error(err instanceof Error ? err.message : "Upload failed."));
    };
    reader.readAsDataURL(file);
  };

  const handleApprove = () => {
    slateApi.officer.approveMaker(item.id)
      .then(() => {
        toast.success(`${item.id} approved - forwarded for site visit and VAO review.`);
        setConfirmAction(null);
        load();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not approve this transaction."));
  };

  const handleException = () => {
    slateApi.officer
      .routeToException(item.id, "Routed to exception queue by officer for manual review.")
      .then(() => {
        toast.info(`${item.id} routed to the Exception Queue.`);
        setConfirmAction(null);
        load();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not route to exception."));
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="Registration Officer Portal"
          title={item.id}
          sub={item.parties}
          actions={
            <>
              <Badge variant={item.status === "exception" ? "danger" : item.status === "approved" ? "success" : "info"}>
                {item.status.replace("_", " ")}
              </Badge>
              {canAct && (
                <>
                  <Button onClick={() => setConfirmAction("approve")}>
                    <CheckCircle2 size={14} /> Approve
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmAction("exception")}>
                    <AlertTriangle size={14} /> Route to Exception
                  </Button>
                </>
              )}
            </>
          }
        />
      </div>

      {/* ── Full-height property split view ─────────────────────────── */}
      {token ? (
        <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
          <PropertySplitView
            token={token}
            accentColor="#1d4670"
            extraLeftTabs={[
              {
                id: "txn_details",
                label: "Transaction",
                icon: <FileText size={13} />,
                content: (
                  <Card>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F2A4A", marginBottom: 10 }}>Transaction Details</div>
                    <DlGrid>
                      <DlRow label="Type" value={item.type} />
                      <DlRow label="ULPIN" value={item.ulpin} />
                      <DlRow label="Parties" full value={item.parties} />
                      <DlRow label="Amount" value={inr(item.amount)} />
                      <DlRow label="Submitted" value={item.submitted} />
                      <DlRow label="Priority" value={item.priority} />
                      {item.paymentRef && <DlRow label="Payment Ref" value={item.paymentRef} />}
                      {item.reason && <DlRow label="Reason" full value={item.reason} />}
                      {item.recipientName && <DlRow label="Recipient" value={item.recipientName} />}
                      {item.sharePercent != null && <DlRow label="Share %" value={`${item.sharePercent}%`} />}
                      {item.stampDutyCode && <DlRow label="Stamp Duty" value={item.stampDutyCode} />}
                    </DlGrid>

                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #eceef0" }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F2A4A", marginBottom: 10 }}>RegMutate Rule Checks</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 11.5 }}>Token state:</span>
                        <StateBadge state={token.state} size="sm" />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {checks.map((c) => (
                          <div key={c.label} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", borderRadius: 7, background: c.pass ? "#f0f8f2" : "#fdf0ee" }}>
                            {c.pass
                              ? <CheckCircle2 size={15} style={{ color: "#1C7A4E", marginTop: 1, flexShrink: 0 }} />
                              : <XCircle size={15} style={{ color: "#B0392F", marginTop: 1, flexShrink: 0 }} />}
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600 }}>{c.label}</div>
                              <div style={{ fontSize: 11, color: "#717881" }}>{c.detail}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ),
              },
              ...(token.surveyPending || token.survey ? [{
                id: "survey",
                label: "Survey",
                icon: <Compass size={13} />,
                content: (
                  <Card>
                    {token.surveyPending ? (
                      <Alert type="warning" title="Survey verification pending" message="A Surveyor must visit and record verified GPS coordinates before the record is finalised." dismissible={false} />
                    ) : token.survey ? (
                      <>
                        {token.survey.conflict?.flag
                          ? <Alert type="error" title="Survey area conflict" message={`Surveyor recorded ${token.survey.conflict.reportedArea} but token shows ${token.survey.conflict.tokenArea}. Revenue Department review required.`} dismissible={false} />
                          : <Alert type="success" title="Site verified" message={`Verified by ${token.survey.verifiedBy} on ${token.survey.verifiedAt}.`} dismissible={false} />}
                        <div style={{ marginTop: 14 }}>
                          <DlGrid>
                            <DlRow label="Verified by" value={token.survey.verifiedBy} />
                            <DlRow label="Verified on" value={token.survey.verifiedAt} />
                            <DlRow label="Latitude" value={token.survey.lat.toFixed(5)} />
                            <DlRow label="Longitude" value={token.survey.lng.toFixed(5)} />
                            {token.survey.surveyedArea && <DlRow label="Extended area" value={token.survey.surveyedArea} />}
                            {token.survey.notes && <DlRow label="Site notes" full value={token.survey.notes} />}
                          </DlGrid>
                          {token.survey.measurements && token.survey.measurements.length > 0 && (
                            <div style={{ marginTop: 14 }}>
                              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>Boundary Measurements</div>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                <thead>
                                  <tr style={{ background: "#f4f8fd" }}>
                                    {["From", "→", "To", "Measurement"].map((h, i) => (
                                      <th key={i} style={{ padding: "5px 8px", textAlign: i === 3 ? "right" as const : i === 1 ? "center" as const : "left" as const, border: "1px solid #dce0e5", fontWeight: 600, color: i === 1 ? "#9aa1a9" : "#545c66" }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {token.survey.measurements.map((m, i) => (
                                    <tr key={i}>
                                      <td style={{ padding: "5px 8px", border: "1px solid #eceef0" }}>{m.from}</td>
                                      <td style={{ padding: "5px 8px", border: "1px solid #eceef0", textAlign: "center" as const, color: "#9aa1a9" }}>→</td>
                                      <td style={{ padding: "5px 8px", border: "1px solid #eceef0" }}>{m.to}</td>
                                      <td style={{ padding: "5px 8px", border: "1px solid #eceef0", textAlign: "right" as const, fontFamily: "monospace" }}>{m.val}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </>
                    ) : null}
                  </Card>
                ),
              }] : []),
              ...(item.status === "approved" ? [{
                id: "patta",
                label: "Patta",
                icon: <FileStack size={13} />,
                content: (
                  <Card>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F2A4A" }}>Patta / Mutation Certificate</div>
                      <Button variant="outline" onClick={() => generatePattaPDF(token, item.id)} style={{ borderColor: "#B8923D", color: "#B8923D", fontSize: 12 }}>
                        <FileText size={13} /> Generate Patta
                      </Button>
                    </div>
                    {pattaDoc
                      ? <Alert type="success" message={`Uploaded: ${pattaDoc.fileName} (${pattaDoc.uploadedAt}).`} dismissible={false} />
                      : (
                        <>
                          <div style={{ fontSize: 11.5, color: "#717881", marginBottom: 10 }}>
                            Mutation is complete on-chain. Generate or upload the Patta document below.
                          </div>
                          <UploadZone label="Patta document" description="Drag a file here or click to browse" accept=".pdf,.jpg,.jpeg,.png" maxFiles={1} onUpload={handleUploadPatta} />
                        </>
                      )}
                  </Card>
                ),
              }] : []),
            ]}
          />
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9aa1a9", fontSize: 13 }}>
          Loading property data…
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmAction === "approve"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleApprove}
        variant="info"
        title="Approve Transaction"
        message="This approves the transaction and forwards it to the Surveyor and VAO for site visit, or directly to the VAO for direct sales."
        confirmText="Approve"
      />
      <ConfirmationModal
        isOpen={confirmAction === "exception"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleException}
        variant="warning"
        title="Route to Exception Queue"
        message="This transaction will be moved out of the normal approval flow for manual review."
        confirmText="Route to Exception"
      />
    </div>
  );
}
