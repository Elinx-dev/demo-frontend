import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  User,
  Clock,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/ui/primitives/Button/Button";
import { Modal } from "@/ui/primitives/Modal/Modal";
import { Alert } from "@/ui/primitives/Alert/Alert";
import { Card } from "@/ui/primitives/Card/Card";
import { PropertySplitView } from "../../components/PropertySplitView";
import { DlGrid, DlRow } from "../../components/DefinitionList";
import { slateApi } from "../../services/apiClient";
import { generatePattaPDF, buildPattaHtmlBlob } from "../../services/pattaService";
import { inr, fmtTs } from "../../utils/format";
import { ROUTES } from "@/navigation/routes";
import type { OfficerQueueItem, SlateToken } from "../../types/slate.types";

const SLATE_PATHS = ROUTES.PATHS.APP.SLATE;

const STATUS_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  pending_checker: { bg: "#fff3e0", color: "#b8722e", label: "Pending VAO Verification" },
  pending_tahsildar: { bg: "#e8f4ff", color: "#1d4670", label: "Pending Thasildar" },
  approved: { bg: "#edf7f1", color: "#1C7A4E", label: "Approved" },
  exception: { bg: "#fef3f2", color: "#B0392F", label: "Exception" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_COLOR[status] ?? { bg: "#f4f5f7", color: "#545c66", label: status };
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 12,
        background: s.bg,
        color: s.color,
        whiteSpace: "nowrap" as const,
      }}
    >
      {s.label}
    </span>
  );
}

export default function VaoVerificationDetailPage() {
  const { txnId } = useParams<{ txnId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const navItem = (location.state as { item?: OfficerQueueItem } | null)?.item ?? null;
  const [item, setItem] = useState<OfficerQueueItem | null>(navItem);
  const [token, setToken] = useState<SlateToken | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [pattaGenerated, setPattaGenerated] = useState(false);
  const [pattaUrl, setPattaUrl] = useState("");
  const [showPattaModal, setShowPattaModal] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectBusy, setRejectBusy] = useState(false);

  const loadItem = useCallback(async () => {
    if (item || !txnId) return;
    try {
      const items = await slateApi.vao.getVerificationQueue();
      const found = items.find((i) => i.id === txnId);
      if (found) setItem(found);
    } catch {
      /* item data unavailable */
    }
  }, [item, txnId]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  useEffect(() => {
    if (!item?.ulpin) return;
    setLoadingToken(true);
    slateApi.citizen
      .getPropertyDetail(item.ulpin)
      .then(setToken)
      .catch(() => setToken(null))
      .finally(() => setLoadingToken(false));
  }, [item?.ulpin]);

  const handleApprove = async () => {
    if (!item || !token) return;
    setBusy(true);
    setError("");
    try {
      await slateApi.vao.approveAndGeneratePatta(item.id);
    } catch {
      /* best-effort - still generate PDF locally */
    }
    const url = buildPattaHtmlBlob(token, item.id);
    setPattaUrl(url);
    setPattaGenerated(true);
    setBusy(false);
    setShowPattaModal(true);
  };

  const handlePreviewPatta = () => {
    if (!token || !item) return;
    if (!pattaUrl) {
      setPattaUrl(buildPattaHtmlBlob(token, item.id));
    }
    setShowPattaModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!item || !rejectReason.trim()) return;
    setRejectBusy(true);
    try {
      await slateApi.vao.rejectDeed(item.id, rejectReason.trim());
    } catch {
      /* best-effort */
    } finally {
      setRejectBusy(false);
    }
    setShowRejectModal(false);
    navigate(SLATE_PATHS.VAO_VERIFICATION_QUEUE);
  };

  const canApprove = item?.status === "pending_checker";

  const surveyorInfo = token?.survey
    ? {
        verifiedBy: token.survey.verifiedBy,
        verifiedAt: token.survey.verifiedAt,
        lat: token.survey.lat,
        lng: token.survey.lng,
        surveyedArea: token.survey.surveyedArea,
        conflict: token.survey.conflict?.flag,
      }
    : null;

  const deedTab =
    item && token
      ? [
          {
            id: "deed_details",
            label: "Deed Details",
            icon: <FileText size={13} />,
            content: (
              <Card>
                <div
                  style={{ fontSize: 12.5, fontWeight: 700, color: "#0F2A4A", marginBottom: 10 }}
                >
                  Sale Deed Information
                </div>
                <DlGrid>
                  <DlRow label="Deed Type" value={item.type} />
                  <DlRow label="Transaction ID" value={item.id} />
                  <DlRow label="ULPIN" value={item.ulpin} />
                  {(() => {
                    const [seller, buyer] = (item.parties ?? "").split(/->|→/).map((s) => s.trim());
                    return (
                      <>
                        <DlRow label="Seller" value={seller || item.parties} />
                        {buyer && <DlRow label="Buyer" value={buyer} />}
                      </>
                    );
                  })()}
                  {item.initiatedByName && (
                    <DlRow
                      label="Initiated By"
                      full
                      value={
                        item.initiatedByRole && item.initiatedByRole !== "Citizen"
                          ? `${item.initiatedByName} (${item.initiatedByRole})`
                          : item.initiatedByRole === "Citizen"
                          ? `${item.initiatedByName} (Seller / Citizen)`
                          : item.initiatedByName
                      }
                    />
                  )}
                  <DlRow label="Consideration" value={`₹${inr(item.amount)}`} />
                  <DlRow label="Submitted" value={fmtTs(item.submitted)} />
                  {item.stampDutyCode && <DlRow label="Stamp Duty" value={item.stampDutyCode} />}
                  {item.priority && <DlRow label="Priority" value={item.priority} />}
                </DlGrid>

                {surveyorInfo && (
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 14,
                      borderTop: "1px solid #eceef0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "#0F2A4A",
                        marginBottom: 10,
                      }}
                    >
                      Surveyor Verification
                    </div>
                    <DlGrid>
                      <DlRow label="Verified By" value={surveyorInfo.verifiedBy} />
                      <DlRow label="Verified On" value={surveyorInfo.verifiedAt} />
                      <DlRow
                        label="GPS"
                        value={`${surveyorInfo.lat?.toFixed(5)}, ${surveyorInfo.lng?.toFixed(5)}`}
                      />
                      {surveyorInfo.surveyedArea && (
                        <DlRow label="Area" value={surveyorInfo.surveyedArea} />
                      )}
                      <DlRow
                        label="Conflict"
                        value={surveyorInfo.conflict ? "Area mismatch flagged" : "Clear"}
                      />
                    </DlGrid>
                  </div>
                )}

                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #eceef0" }}>
                  {canApprove && !pattaGenerated && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button
                        onClick={handleApprove}
                        disabled={busy}
                        style={{ flex: 1, background: "#1C7A4E", borderColor: "#1C7A4E" }}
                      >
                        <CheckCircle2 size={14} />
                        {busy ? "Processing…" : "Approve and Generate Patta"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowRejectModal(true)}
                        style={{ flex: 1, borderColor: "#B0392F", color: "#B0392F" }}
                      >
                        <XCircle size={14} /> Reject
                      </Button>
                    </div>
                  )}
                  {pattaGenerated && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button
                        onClick={handlePreviewPatta}
                        style={{ flex: 1, background: "#B8923D", borderColor: "#B8923D" }}
                      >
                        <Eye size={14} /> Preview Patta
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => generatePattaPDF(token, item.id)}
                        style={{ flex: 1 }}
                      >
                        Download / Print
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ),
          },
        ]
      : [];

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      {/* Top action bar */}
      <div
        style={{
          flexShrink: 0,
          padding: "10px 16px",
          borderBottom: "1.5px solid #eceef0",
          background: "#f8f9fb",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap" as const,
        }}
      >
        <button
          onClick={() => navigate(SLATE_PATHS.VAO_VERIFICATION_QUEUE)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            color: "#545c66",
            background: "none",
            border: "1px solid #dee2e6",
            borderRadius: 6,
            padding: "5px 10px",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={13} /> Back to Queue
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#0F2A4A",
              fontFamily: "monospace",
            }}
          >
            {txnId}
          </span>
          {item && (
            <span style={{ fontSize: 12, color: "#717881", marginLeft: 10 }}>
              {item.parties}
            </span>
          )}
        </div>

        {item && <StatusPill status={item.status} />}

        {error && <span style={{ fontSize: 12, color: "#B0392F" }}>{error}</span>}

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {canApprove && !pattaGenerated && (
            <>
              <Button
                onClick={handleApprove}
                disabled={busy || !token}
                style={{ background: "#1C7A4E", borderColor: "#1C7A4E", fontSize: 12 }}
              >
                <CheckCircle2 size={13} />
                {busy ? "Processing…" : "Approve and Generate Patta"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRejectModal(true)}
                style={{ fontSize: 12, borderColor: "#B0392F", color: "#B0392F" }}
              >
                <XCircle size={13} /> Reject
              </Button>
            </>
          )}
          {pattaGenerated && (
            <Button
              onClick={handlePreviewPatta}
              style={{ background: "#B8923D", borderColor: "#B8923D", fontSize: 12 }}
            >
              <Eye size={13} /> Preview Patta
            </Button>
          )}
        </div>
      </div>

      {/* Transaction info strip */}
      {item && (
        <div
          style={{
            flexShrink: 0,
            padding: "8px 16px",
            background: "#fafbfc",
            borderBottom: "1px solid #eceef0",
            display: "flex",
            gap: 20,
            flexWrap: "wrap" as const,
          }}
        >
          <span style={{ fontSize: 11 }}>
            <span style={{ color: "#9aa1a9" }}>Type: </span>
            <strong>{item.type}</strong>
          </span>
          <span style={{ fontSize: 11 }}>
            <span style={{ color: "#9aa1a9" }}>Amount: </span>
            <strong>{inr(item.amount)}</strong>
          </span>
          <span style={{ fontSize: 11 }}>
            <span style={{ color: "#9aa1a9" }}>ULPIN: </span>
            <strong style={{ fontFamily: "monospace" }}>{item.ulpin}</strong>
          </span>
          <span style={{ fontSize: 11 }}>
            <span style={{ color: "#9aa1a9" }}>Submitted: </span>
            <strong>{fmtTs(item.submitted)}</strong>
          </span>
          {item.stampDutyCode && (
            <span style={{ fontSize: 11 }}>
              <span style={{ color: "#9aa1a9" }}>Stamp Duty: </span>
              <strong>{item.stampDutyCode}</strong>
            </span>
          )}
        </div>
      )}

      {/* Surveyor strip */}
      {surveyorInfo && (
        <div
          style={{
            flexShrink: 0,
            padding: "8px 16px",
            background: "#f0f8f2",
            borderBottom: "1px solid #bfe6cc",
            display: "flex",
            gap: 16,
            flexWrap: "wrap" as const,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#1C7A4E",
              textTransform: "uppercase" as const,
              letterSpacing: ".06em",
            }}
          >
            Surveyor Data
          </span>
          <span style={{ fontSize: 11 }}>
            <User size={10} style={{ display: "inline", marginRight: 4 }} />
            <strong>{surveyorInfo.verifiedBy}</strong>
          </span>
          <span style={{ fontSize: 11 }}>
            <Clock size={10} style={{ display: "inline", marginRight: 4 }} />
            {surveyorInfo.verifiedAt}
          </span>
          <span style={{ fontSize: 11 }}>
            <MapPin size={10} style={{ display: "inline", marginRight: 4 }} />
            {surveyorInfo.lat?.toFixed(4)}, {surveyorInfo.lng?.toFixed(4)}
          </span>
          {surveyorInfo.surveyedArea && (
            <span style={{ fontSize: 11 }}>
              <strong>Area: </strong>
              {surveyorInfo.surveyedArea}
            </span>
          )}
          {surveyorInfo.conflict && (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 10,
                background: "#fef3f2",
                color: "#B0392F",
              }}
            >
              Area Conflict
            </span>
          )}
        </div>
      )}

      {/* Survey conflict alert */}
      {token?.survey?.conflict?.flag && (
        <div
          style={{
            flexShrink: 0,
            margin: "0 16px",
            marginTop: 8,
            padding: "10px 14px",
            borderRadius: 8,
            background: "#fdf0ee",
            border: "1px solid #f5c6cb",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <AlertTriangle size={14} style={{ color: "#B0392F", marginTop: 1, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#B0392F" }}>
              Survey Area Conflict
            </div>
            <div style={{ fontSize: 11.5, color: "#7c2d2d", marginTop: 2 }}>
              Surveyor recorded <strong>{token.survey.conflict.reportedArea}</strong> but token
              shows <strong>{token.survey.conflict.tokenArea}</strong>. Verify before approving.
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      {loadingToken ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9aa1a9",
            fontSize: 13,
          }}
        >
          Loading property data…
        </div>
      ) : token ? (
        <div style={{ flex: 1, minHeight: 0, marginTop: 8 }}>
          <PropertySplitView
            token={token}
            accentColor="#1d4670"
            extraLeftTabs={deedTab}
          />
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column" as const,
            gap: 10,
            color: "#9aa1a9",
          }}
        >
          <FileText size={28} style={{ opacity: 0.4 }} />
          <div style={{ fontSize: 13 }}>
            {item ? `No property data for ULPIN ${item.ulpin}` : "Loading transaction…"}
          </div>
        </div>
      )}

      {/* Patta Preview Modal */}
      <Modal
        isOpen={showPattaModal}
        onClose={() => setShowPattaModal(false)}
        title="Patta Document Preview"
        size="5xl"
      >
        <div style={{ height: 560 }}>
          {pattaUrl && (
            <iframe
              src={pattaUrl}
              style={{ width: "100%", height: "100%", border: "none", borderRadius: 6 }}
              title="Patta Preview"
            />
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          {token && item && (
            <Button variant="outline" onClick={() => generatePattaPDF(token, item.id)}>
              Download / Print
            </Button>
          )}
          <Button onClick={() => setShowPattaModal(false)}>Close</Button>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Deed"
        size="md"
      >
        <div style={{ marginBottom: 14, fontSize: 12.5, color: "#545c66", lineHeight: 1.6 }}>
          Rejecting this deed will notify the citizen and all involved parties (Surveyor, Registration
          Officer). Please provide a clear, specific reason.
        </div>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="State the reason for rejection…"
          rows={4}
          style={{
            width: "100%",
            padding: "8px 10px",
            border: "1.5px solid #dee2e6",
            borderRadius: 7,
            fontSize: 12.5,
            resize: "vertical" as const,
            outline: "none",
            color: "#161b22",
            boxSizing: "border-box" as const,
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
          <Button
            variant="outline"
            onClick={() => setShowRejectModal(false)}
            disabled={rejectBusy}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRejectSubmit}
            disabled={rejectBusy || !rejectReason.trim()}
            style={{ background: "#B0392F", borderColor: "#B0392F" }}
          >
            <XCircle size={13} />
            {rejectBusy ? "Submitting…" : "Confirm Rejection"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
