import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, Gift, ArrowRightLeft, CheckCircle2, RefreshCw } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { Button } from "@/ui/primitives/Button/Button";
import { Alert } from "@/ui/primitives/Alert/Alert";
import Empty from "@/ui/primitives/Empty/Empty";
import { useToast } from "@/ui/feedback/toast/useToast";
import { slateApi } from "../../services/apiClient";
import { useSlateStore } from "../../state/SlateProvider";
import PageHead from "../../components/PageHead";
import OtpBoxInput from "../../components/OtpBoxInput";
import { inr } from "../../utils/format";
import type { ConsentRequest } from "../../types/slate.types";

const TYPE_LABEL: Record<string, string> = {
  sale: "Sale Deed",
  gift: "Gift Deed",
  partition: "Partition Deed",
  mortgage_request: "Mortgage",
};

type ConsentCardState = "idle" | "otp_sent" | "verifying" | "done";

function ConsentCard({
  req,
  identifier,
  channel,
  onDone,
}: {
  req: ConsentRequest;
  identifier: string;
  channel: "mobile" | "email";
  onDone: () => void;
}) {
  const [cardState, setCardState] = useState<ConsentCardState>("idle");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const toast = useToast();

  const sendOtp = async () => {
    setSendingOtp(true);
    setOtpError("");
    try {
      const result = await slateApi.requestOtp({ identifier, channel, purpose: "CONSENT" });
      if (result?.devOtp) setOtp(result.devOtp);
      setCardState("otp_sent");
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Could not send OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerify = async () => {
    setCardState("verifying");
    setOtpError("");
    try {
      await slateApi.verifyConsentOtp({ identifier, otp });
      await slateApi.citizen.giveRecipientConsent(req.id);
      setCardState("done");
      toast.success(`Consent recorded for ${req.ulpin}.`);
      setTimeout(onDone, 1200);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Verification failed. Check your OTP and try again.");
      setCardState("otp_sent");
    }
  };

  if (cardState === "done") {
    return (
      <Card style={{ padding: "16px 18px", border: "1px solid #c3e6cb", background: "#f0f8f2" }}>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 size={18} style={{ color: "#1C7A4E", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1C7A4E" }}>Consent recorded</div>
            <div style={{ fontSize: 11.5, color: "#545c66", marginTop: 2, fontFamily: "monospace" }}>{req.ulpin}</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ padding: "16px 18px", border: "1px solid #ecddb8", background: "#fbf7ee" }}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3" style={{ marginBottom: cardState !== "idle" ? 14 : 0 }}>
        <div className="flex items-center gap-2.5">
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {req.type === "gift" ? <Gift size={15} style={{ color: "#8f6a26" }} /> : <ArrowRightLeft size={15} style={{ color: "#8f6a26" }} />}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#161b22" }}>
              {req.senderName} is transferring via {TYPE_LABEL[req.type] ?? req.type}
            </div>
            <div style={{ fontSize: 11.5, color: "#717881", marginTop: 2 }}>
              <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{req.ulpin}</span>
              {req.price ? <span> · {inr(Number(req.price))}</span> : null}
              {req.sharePercent ? <span> · {req.sharePercent}% share</span> : null}
            </div>
          </div>
        </div>

        {cardState === "idle" && (
          <Button size="sm" onClick={sendOtp} disabled={sendingOtp} style={{ flexShrink: 0 }}>
            <ShieldCheck size={13} />
            {sendingOtp ? "Sending…" : "Give Consent"}
          </Button>
        )}
      </div>

      {/* OTP section (expands inline) */}
      {cardState !== "idle" && (
        <div className="flex flex-col gap-3" style={{ borderTop: "1px solid #ecddb8", paddingTop: 14 }}>
          <Alert
            type="info"
            message={`A 6-digit verification code was sent to your registered ${channel === "email" ? "email address" : "mobile number"}. Enter it below to confirm your consent.`}
            dismissible={false}
          />
          {otpError && <Alert type="error" message={otpError} dismissible={false} />}

          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#545c66", marginBottom: 8 }}>Enter OTP to confirm your consent</div>
            <OtpBoxInput
              value={otp}
              onChange={(v) => { setOtp(v); setOtpError(""); }}
              error=""
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              disabled={otp.length !== 6 || cardState === "verifying"}
              onClick={handleVerify}
              style={{ flex: 1 }}
            >
              <ShieldCheck size={14} />
              {cardState === "verifying" ? "Verifying…" : "Verify & Give Consent"}
            </Button>
            <button
              onClick={sendOtp}
              disabled={sendingOtp}
              style={{ fontSize: 12, color: "#1d4670", fontWeight: 600, background: "none", border: "none", cursor: sendingOtp ? "not-allowed" : "pointer", padding: "0 4px", display: "flex", alignItems: "center", gap: 4, opacity: sendingOtp ? 0.5 : 1 }}
            >
              <RefreshCw size={12} /> Resend
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function ConsentVerificationPage() {
  const { currentUser } = useSlateStore();
  const [requests, setRequests] = useState<ConsentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const identifier = currentUser?.phone || currentUser?.email || "";
  const channel: "mobile" | "email" = currentUser?.phone ? "mobile" : "email";

  const load = useCallback(() => {
    return slateApi.citizen
      .getIncoming()
      .then((r) => setRequests(r.pendingConsent ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load pending consents."));
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const handleDone = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="Citizen Portal"
          title="Consent Inbox"
          sub="Transactions waiting for your digital approval. Your OTP acts as your legally binding digital signature."
        />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {error && (
          <Alert type="error" title="Could not load consents" message={error} dismissible={false} style={{ marginBottom: 16 }} />
        )}

        {loading && !error && (
          <div style={{ fontSize: 12.5, color: "#9aa1a9", padding: "24px 0" }}>Loading…</div>
        )}

        {!loading && !error && requests.length === 0 && (
          <Empty
            variant="no-data"
            title="No pending consents"
            description="When someone initiates a sale, gift, or partition naming you as the recipient, it will appear here for your approval."
          />
        )}

        {!loading && !error && requests.length > 0 && (
          <div className="flex flex-col gap-3">
            <div style={{ fontSize: 12, color: "#8f6a26", fontWeight: 600, padding: "4px 0" }}>
              {requests.length} pending {requests.length === 1 ? "consent" : "consents"} - your approval is required to proceed with registration.
            </div>
            {requests.map((req) => (
              <ConsentCard
                key={req.id}
                req={req}
                identifier={identifier}
                channel={channel}
                onDone={() => handleDone(req.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
