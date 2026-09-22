import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, Lock, ShieldCheck, UserRound, Phone, Mail, AlertTriangle } from "lucide-react";
import { Button } from "@/ui/primitives/Button/Button";
import { Input } from "@/ui/primitives/Input/Input";
import { Select } from "@/ui/primitives/Select/Select";
import { Textarea } from "@/ui/primitives/Textarea/Textarea";
import { Alert } from "@/ui/primitives/Alert/Alert";
import { ROUTES } from "@/navigation/routes";
import { useSlateStore } from "../state/SlateProvider";
import OtpBoxInput from "../components/OtpBoxInput";

const NAVY_900 = "#0a1628";
const NAVY_800 = "#0f2138";
const NAVY_700 = "#16304f";
const GOLD = "#d4af67";
const GOLD_LIGHT = "#e8cd95";
const MUTED = "#7d8aa3";
const LINE = "#e6e9ef";

const REG_STEPS = [
  { id: "details", label: "Your Details" },
  { id: "otp",     label: "Verify OTP" },
  { id: "done",    label: "Done" },
];

export default function CitizenRegisterPage() {
  const { session, updateRegisterDraft, requestRegisterOtp, verifyRegisterOtp } = useSlateStore();
  const navigate = useNavigate();
  const draft = session.registerDraft;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [devOtpHint, setDevOtpHint] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const passwordMismatch = password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword;
  const stepIndex = draft.step - 1;

  const handleSendOtp = async () => {
    setSending(true);
    setSendError("");
    try {
      const result = await requestRegisterOtp();
      if (result?.devOtp) {
        setOtp(result.devOtp);
        setDevOtpHint(result.devOtp);
      }
      updateRegisterDraft({ step: 2 });
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Could not send the OTP. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await verifyRegisterOtp(otp, password);
      setOtpError("");
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Incorrect or expired OTP.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", width: "100vw", background: "#f4f6f9", overflow: "hidden" }}>

      {/* ── LEFT: logo panel ── */}
      <aside
        className="hidden lg:flex flex-col items-center justify-center"
        style={{
          flex: "0 0 38%",
          background: `linear-gradient(150deg, ${NAVY_900} 0%, ${NAVY_800} 55%, ${NAVY_700} 100%)`,
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div aria-hidden style={{ position: "absolute", top: -180, left: -180, width: 520, height: 520, borderRadius: "50%", background: `radial-gradient(circle, rgba(212,175,103,.14), transparent 65%)` }} />
        <div aria-hidden style={{ position: "absolute", bottom: -200, right: -140, width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.05), transparent 70%)" }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 24, textAlign: "center", padding: "40px 48px" }}>
          <div style={{ position: "relative", width: 120, height: 120 }}>
            <div style={{ position: "absolute", inset: -8, borderRadius: "50%", background: `conic-gradient(from 0deg, ${GOLD}55, transparent 40%, ${GOLD}88, transparent 80%, ${GOLD}44)`, animation: "spin 18s linear infinite" }} />
            <div style={{ position: "absolute", inset: -3, borderRadius: "50%", border: `1.5px solid rgba(212,175,103,.35)` }} />
            <img src="/slate-logo.jpeg" alt="SLATE" style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", boxShadow: "0 20px 60px rgba(0,0,0,.5), 0 0 0 4px rgba(212,175,103,.22)", display: "block", position: "relative", zIndex: 1 }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 42, letterSpacing: "0.18em", background: `linear-gradient(135deg, #fff 30%, ${GOLD_LIGHT} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>SLATE</div>
            <div style={{ fontSize: 12, color: "#8a9ab8", letterSpacing: ".16em", textTransform: "uppercase" as const, fontWeight: 500 }}>Citizen Registration</div>
          </div>

          <div style={{ width: 48, height: 1.5, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

          <div style={{ fontSize: 13, color: "#6c7e9e", maxWidth: 240, lineHeight: 1.7 }}>
            Create your SLATE account to manage and transact your land parcels securely.
          </div>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </aside>

      {/* ── RIGHT: form panel - centers the card, no scroll here ── */}
      <div className="flex-1 flex items-center justify-center" style={{ padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 justify-center" style={{ marginBottom: 20 }}>
            <img src="/slate-logo.jpeg" alt="SLATE" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", boxShadow: `0 0 0 2px ${GOLD}55` }} />
            <div style={{ fontWeight: 800, fontSize: 18, color: NAVY_900, letterSpacing: "0.12em" }}>SLATE</div>
          </div>

          {/* ── White card - scroll lives here ── */}
          <div style={{
            background: "#fff",
            borderRadius: 18,
            border: `1px solid ${LINE}`,
            boxShadow: "0 24px 60px -20px rgba(10,22,40,.16), 0 2px 8px rgba(10,22,40,.04)",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100vh - 80px)",
          }}>
            {/* Gold top bar */}
            <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${GOLD}, ${NAVY_800})`, zIndex: 1 }} />

            {/* ── Stepper - fixed, never scrolls ── */}
            <div style={{ flexShrink: 0, padding: "28px 28px 0", paddingTop: 32 }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
                {REG_STEPS.map((step, idx) => {
                  const isCompleted = stepIndex > idx;
                  const isActive = stepIndex === idx;
                  return (
                    <div key={step.id} style={{ display: "flex", alignItems: "center", flex: idx < REG_STEPS.length - 1 ? 1 : 0 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: isCompleted ? "#1C7A4E" : isActive ? NAVY_900 : "#eceef0",
                          color: (isCompleted || isActive) ? "#fff" : "#9aa1a9",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 700, flexShrink: 0,
                        }}>
                          {isCompleted ? <CheckCircle2 size={14} /> : idx + 1}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 600, marginTop: 4, textAlign: "center" as const, whiteSpace: "nowrap" as const, color: isActive ? NAVY_900 : isCompleted ? "#1C7A4E" : "#9aa1a9" }}>
                          {step.label}
                        </div>
                      </div>
                      {idx < REG_STEPS.length - 1 && (
                        <div style={{ flex: 1, height: 2, background: isCompleted ? "#1C7A4E" : "#eceef0", margin: "0 6px", marginBottom: 16 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Form content - scrolls inside the card ── */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "4px 28px 28px" }}>

              {/* ── Step 1: Your Details ── */}
              {draft.step === 1 && (
                <div className="flex flex-col gap-3">
                  <div style={{ fontSize: 16, fontWeight: 700, color: NAVY_900, marginBottom: 2, letterSpacing: "-.2px" }}>Create your account</div>
                  <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 4, lineHeight: 1.5 }}>Fill in your details as per Aadhaar. Your mobile OTP will verify your identity.</div>

                  <Input
                    label="Full name (as per Aadhaar)"
                    value={draft.name}
                    onChange={(e) => updateRegisterDraft({ name: e.target.value })}
                    placeholder="e.g. Ravi Kumar"
                    startAdornment={<UserRound size={14} style={{ color: "#9aa1a9" }} />}
                  />
                  <Input
                    label="Aadhaar number"
                    value={draft.aadhaar}
                    onChange={(e) => updateRegisterDraft({ aadhaar: e.target.value.replace(/\D/g, "").slice(0, 12) })}
                    placeholder="12-digit Aadhaar number"
                    maxLength={12}
                  />
                  <Input
                    label="Mobile number (linked to Aadhaar)"
                    value={draft.mobile}
                    onChange={(e) => updateRegisterDraft({ mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    startAdornment={<Phone size={14} style={{ color: "#9aa1a9" }} />}
                  />
                  <Input
                    label="Email (optional)"
                    type="email"
                    value={draft.email}
                    onChange={(e) => updateRegisterDraft({ email: e.target.value })}
                    placeholder="name@example.com"
                    startAdornment={<Mail size={14} style={{ color: "#9aa1a9" }} />}
                  />
                  <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    <Select
                      label="Gender"
                      value={draft.gender}
                      onChange={(e) => updateRegisterDraft({ gender: e.target.value })}
                      options={[
                        { label: "Select gender", value: "" },
                        { label: "Male", value: "Male" },
                        { label: "Female", value: "Female" },
                        { label: "Other", value: "Other" },
                      ]}
                    />
                    <Input
                      label="Date of birth"
                      type="date"
                      value={draft.dob}
                      onChange={(e) => updateRegisterDraft({ dob: e.target.value })}
                    />
                  </div>
                  <Textarea
                    label="Address"
                    value={draft.address}
                    onChange={(e) => updateRegisterDraft({ address: e.target.value })}
                    placeholder="House no., street, village/town, district, state, PIN"
                    rows={2}
                  />
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    startAdornment={<Lock size={14} style={{ color: "#9aa1a9" }} />}
                    endAdornment={
                      <button onClick={() => setShowPassword((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9aa1a9", display: "flex" }}>
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    }
                  />
                  <Input
                    label="Confirm password"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    error={passwordMismatch ? "Passwords don't match" : undefined}
                    endAdornment={
                      <button onClick={() => setShowConfirm((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9aa1a9", display: "flex" }}>
                        {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    }
                  />

                  {sendError && <Alert type="error" message={sendError} dismissible={false} />}

                  <Button
                    disabled={
                      !draft.name ||
                      draft.aadhaar.length !== 12 ||
                      draft.mobile.length !== 10 ||
                      !draft.gender ||
                      !draft.dob ||
                      !draft.address.trim() ||
                      password.length < 6 ||
                      password !== confirmPassword ||
                      sending
                    }
                    onClick={handleSendOtp}
                    fullWidth
                  >
                    {sending ? "Sending OTP…" : "Send OTP"}
                  </Button>

                  <div style={{ textAlign: "center", fontSize: 12.5, color: MUTED }}>
                    Already registered?{" "}
                    <Link to={ROUTES.PATHS.APP.SLATE.LOGIN} style={{ color: NAVY_800, fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
                  </div>
                </div>
              )}

              {/* ── Step 2: Verify OTP ── */}
              {draft.step === 2 && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col items-center" style={{ marginBottom: 4 }}>
                    <div style={{ width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(145deg, #fbf2e2, #f4e3bd)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, boxShadow: "0 6px 18px rgba(212,175,103,.25)" }}>
                      <ShieldCheck size={24} style={{ color: "#a9791f" }} />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: NAVY_900, letterSpacing: "-.2px" }}>Verify your mobile</div>
                    <div style={{ fontSize: 13, color: MUTED, marginTop: 6, textAlign: "center" as const, lineHeight: 1.6 }}>
                      An OTP was sent to <strong style={{ color: NAVY_900 }}>+91 {draft.mobile}</strong>
                    </div>
                  </div>

                  {devOtpHint && (
                    <div style={{ padding: "8px 12px", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, fontSize: 12.5, color: "#92400e", display: "flex", gap: 6, alignItems: "center" }}>
                      <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                      <span><strong>Dev mode:</strong> OTP auto-filled ({devOtpHint}). Check server logs if needed.</span>
                    </div>
                  )}

                  <OtpBoxInput
                    value={otp}
                    onChange={(v) => { setOtp(v); setOtpError(""); }}
                    error={otpError}
                  />

                  <Button
                    disabled={otp.length !== 6 || verifying}
                    onClick={handleVerify}
                    fullWidth
                  >
                    <ShieldCheck size={15} />
                    {verifying ? "Verifying…" : "Verify & Continue"}
                  </Button>

                  <button
                    onClick={handleSendOtp}
                    disabled={sending}
                    style={{ fontSize: 12.5, color: NAVY_800, fontWeight: 600, background: "none", border: "none", cursor: "pointer", textAlign: "center" as const }}
                  >
                    {sending ? "Resending…" : "Resend OTP"}
                  </button>
                </div>
              )}

              {/* ── Step 3: Done ── */}
              {draft.step === 3 && (
                <div className="flex flex-col gap-4 items-center text-center" style={{ padding: "12px 0" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(145deg, #e6f5ee, #c3e8d4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(28,122,78,.2)" }}>
                    <CheckCircle2 size={30} style={{ color: "#1C7A4E" }} />
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: NAVY_900 }}>Account created!</div>
                  <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, maxWidth: 320 }}>
                    Welcome, <strong style={{ color: NAVY_900 }}>{draft.name}</strong>. Your citizen account is now active on SLATE.
                  </div>
                  <Button onClick={() => navigate(ROUTES.PATHS.APP.SLATE.DASHBOARD)} fullWidth>
                    Go to my dashboard
                  </Button>
                </div>
              )}

            </div>
            {/* end scrollable form content */}
          </div>
          {/* end white card */}

          <div style={{ textAlign: "center", marginTop: 14 }}>
            <Link to={ROUTES.PATHS.APP.SLATE.LOGIN} style={{ color: "#7d8aa3", fontSize: 12.5, textDecoration: "none" }}>
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
