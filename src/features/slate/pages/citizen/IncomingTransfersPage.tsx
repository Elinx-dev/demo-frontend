import { useEffect, useState, useCallback } from "react";
import { Clock, CheckCircle2, ShieldCheck, Gift, ArrowRightLeft } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { Button } from "@/ui/primitives/Button/Button";
import { Modal } from "@/ui/primitives/Modal/Modal";
import { Alert } from "@/ui/primitives/Alert/Alert";
import Badge from "@/ui/primitives/Badge/Badge";
import Empty from "@/ui/primitives/Empty/Empty";
import { Tabs } from "@/ui/primitives/Tabs/Tabs";
import { useToast } from "@/ui/feedback/toast/useToast";
import { slateApi } from "../../services/apiClient";
import { useSlateStore } from "../../state/SlateProvider";
import PageHead from "../../components/PageHead";
import OtpBoxInput from "../../components/OtpBoxInput";
import { inr } from "../../utils/format";
import type { ConsentRequest, OfficerQueueItem } from "../../types/slate.types";

const STATUS_LABEL: Record<string, string> = {
  pending_maker: "Awaiting Maker review",
  pending_checker: "Awaiting Checker approval",
  exception: "Under exception review",
  approved: "Registered to you",
};
const STATUS_VARIANT: Record<string, "info" | "warning" | "danger" | "success"> = {
  pending_maker: "info",
  pending_checker: "warning",
  exception: "danger",
  approved: "success",
};
const TYPE_LABEL: Record<string, string> = { sale: "Sale", gift: "Gift", partition: "Partition", mortgage_request: "Mortgage request" };

export default function IncomingTransfersPage() {
  const { currentUser } = useSlateStore();
  const toast = useToast();
  const [incoming, setIncoming] = useState<OfficerQueueItem[]>([]);
  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeRequest, setActiveRequest] = useState<ConsentRequest | null>(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const load = useCallback(() => {
    return slateApi.citizen
      .getIncoming()
      .then((r) => {
        setIncoming(r.queueItems);
        setConsentRequests(r.pendingConsent);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load incoming transfers."));
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const pending = incoming.filter((q) => q.status !== "approved");
  const completed = incoming.filter((q) => q.status === "approved");

  const consentIdentifier = currentUser?.phone || currentUser?.email || "";

  const sendConsentOtp = () => {
    setSendingOtp(true);
    setOtpError("");
    return slateApi
      .requestOtp({ identifier: consentIdentifier, channel: currentUser?.phone ? "mobile" : "email", purpose: "CONSENT" })
      .then((result) => { if (result?.devOtp) setOtp(result.devOtp); })
      .catch((err) => setOtpError(err instanceof Error ? err.message : "Could not send the OTP."))
      .finally(() => setSendingOtp(false));
  };

  const openConsent = (r: ConsentRequest) => {
    setActiveRequest(r);
    setOtp("");
    setOtpError("");
    sendConsentOtp();
  };

  const handleGiveConsent = async () => {
    if (!activeRequest) return;
    setVerifying(true);
    try {
      await slateApi.verifyConsentOtp({ identifier: consentIdentifier, otp });
      await slateApi.citizen.giveRecipientConsent(activeRequest.id);
      toast.success(`Digital consent recorded for ${activeRequest.ulpin}.`);
      setActiveRequest(null);
      await load();
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Could not record consent.");
    } finally {
      setVerifying(false);
    }
  };

  const renderRow = (q: OfficerQueueItem) => (
    <Card key={q.id} style={{ padding: "14px 16px" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: "#0F2A4A" }}>{q.id} · {q.type}</div>
        <Badge size="sm" variant={STATUS_VARIANT[q.status]}>{STATUS_LABEL[q.status] ?? q.status}</Badge>
      </div>
      <div style={{ fontSize: 12.5, color: "#545c66" }}>{q.parties}</div>
      <div style={{ fontSize: 11.5, color: "#9aa1a9", marginTop: 3, fontFamily: "monospace" }}>
        {q.ulpin} {q.amount ? `· ${inr(q.amount)}` : ""} · submitted {q.submitted}
      </div>
      {q.status === "approved" && (
        <div style={{ fontSize: 11.5, color: "#1C7A4E", marginTop: 6 }}>
          This parcel now appears in your My Properties list.
        </div>
      )}
    </Card>
  );

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="Citizen Portal"
          title="Incoming Transfers"
          sub="Parcels someone else is transferring to you (sale, gift, or partition) and where each stands in registration."
        />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {error && <Alert type="error" title="Could not load incoming transfers" message={error} dismissible={false} />}
        {loading && !error && <div style={{ fontSize: 12.5, color: "#9aa1a9", padding: "20px 0" }}>Loading…</div>}

        {!loading && !error && (
          <>
            {consentRequests.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                  <ShieldCheck size={15} style={{ color: "#8f6a26" }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F2A4A" }}>Action needed: give your digital consent</div>
                </div>
                <div className="flex flex-col gap-2.5">
                  {consentRequests.map((r) => (
                    <Card key={r.id} style={{ padding: "14px 16px", border: "1px solid #ecddb8", background: "#fbf7ee" }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {r.type === "gift" ? <Gift size={15} style={{ color: "#8f6a26" }} /> : <ArrowRightLeft size={15} style={{ color: "#8f6a26" }} />}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#161b22" }}>
                              {r.senderName} is sending you a {TYPE_LABEL[r.type] ?? r.type}
                            </div>
                            <div style={{ fontSize: 11.5, color: "#717881", marginTop: 2, fontFamily: "monospace" }}>
                              {r.ulpin}{r.price ? ` · ${inr(Number(r.price))}` : ""}{r.sharePercent ? ` · ${r.sharePercent}% share` : ""}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => openConsent(r)}>
                          <ShieldCheck size={13} /> Give Digital Consent
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {incoming.length === 0 ? (
              <Empty variant="no-data" title="Nothing incoming right now" description="When someone initiates a sale, gift, or partition naming you as the recipient, it will show up here." />
            ) : (
              <Tabs
                variant="underline"
                tabs={[
                  {
                    id: "pending",
                    label: "In Progress",
                    icon: <Clock size={14} />,
                    badge: pending.length || undefined,
                    content: pending.length === 0 ? (
                      <Empty variant="no-data" title="Nothing in progress" description="Incoming transfers awaiting registration will appear here." />
                    ) : (
                      <div className="flex flex-col gap-2.5">{pending.map(renderRow)}</div>
                    ),
                  },
                  {
                    id: "completed",
                    label: "Completed",
                    icon: <CheckCircle2 size={14} />,
                    badge: completed.length || undefined,
                    content: completed.length === 0 ? (
                      <Empty variant="no-data" title="Nothing completed yet" description="Once an incoming transfer is registered, it'll show here." />
                    ) : (
                      <div className="flex flex-col gap-2.5">{completed.map(renderRow)}</div>
                    ),
                  },
                ]}
              />
            )}
          </>
        )}
      </div>

      <Modal isOpen={!!activeRequest} onClose={() => setActiveRequest(null)} size="sm" title="Digital Consent">
        <div className="flex flex-col gap-3" style={{ padding: 20 }}>
          {activeRequest && (
            <div style={{ fontSize: 12.5, color: "#717881" }}>
              Confirming you accept the {TYPE_LABEL[activeRequest.type] ?? activeRequest.type} of{" "}
              <strong style={{ fontFamily: "monospace" }}>{activeRequest.ulpin}</strong> from {activeRequest.senderName}.
            </div>
          )}
          <Alert type="info" message={sendingOtp ? "Sending a verification code…" : `A verification code was sent to your registered ${currentUser?.phone ? "mobile number" : "email"}.`} dismissible={false} />
          {otpError && <Alert type="error" message={otpError} dismissible={false} />}
          <OtpBoxInput value={otp} onChange={(v) => { setOtp(v); setOtpError(""); }} error="" />
          <Button disabled={otp.length !== 6 || verifying || sendingOtp} onClick={handleGiveConsent} fullWidth>
            <ShieldCheck size={14} /> {verifying ? "Verifying…" : "Verify & Give Consent"}
          </Button>
          <button
            onClick={sendConsentOtp}
            disabled={sendingOtp}
            style={{ fontSize: 12, color: "#1d4670", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "center" }}
          >
            Resend OTP
          </button>
        </div>
      </Modal>
    </div>
  );
}
