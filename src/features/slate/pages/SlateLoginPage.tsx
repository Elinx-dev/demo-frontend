import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, ShieldCheck, Lock, UserRound } from "lucide-react";
import { Button } from "@/ui/primitives/Button/Button";
import { Input } from "@/ui/primitives/Input/Input";
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
const BG = "#f4f6f9";

type LoginStep = "credentials" | "otp";

/** A typed identifier is an email if it contains "@"; otherwise it's treated
 * as a mobile number - the backend only ever matches against email or a
 * 10-digit mobile number, never a username/employee ID. */
function detectChannel(identifier: string): "mobile" | "email" {
  return identifier.includes("@") ? "email" : "mobile";
}

function maskIdentifier(identifier: string, channel: "mobile" | "email") {
  if (!identifier) return channel === "email" ? "your registered email" : "your registered mobile number";
  if (channel === "email") {
    const [user, domain] = identifier.split("@");
    if (!domain) return identifier;
    return `${user.slice(0, 2)}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
  }
  const digits = identifier.replace(/\D/g, "");
  return `${"•".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

export default function SlateLoginPage() {
  const { requestLoginOtp, verifyLoginOtp } = useSlateStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<LoginStep>("credentials");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSentAt, setOtpSentAt] = useState<number | null>(null);
  const [verifyHover, setVerifyHover] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | undefined>();

  const channel = detectChannel(identifier.trim());

  const handleSendOtp = async () => {
    const trimmed = identifier.trim();
    if (!trimmed || !password) return;
    setSendError("");
    setSendLoading(true);
    try {
      const result = await requestLoginOtp(trimmed, detectChannel(trimmed), password);
      setOtp(result.devOtp ?? "");
      setDevOtpHint(result.devOtp);
      setOtpError("");
      setOtpSentAt(Date.now());
      setStep("otp");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Could not send the OTP. Please try again.");
    } finally {
      setSendLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const trimmed = identifier.trim();
    if (!trimmed) return;
    setVerifyLoading(true);
    try {
      await verifyLoginOtp(trimmed, otp);
      navigate(ROUTES.PATHS.APP.SLATE.DASHBOARD);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Incorrect or expired OTP.");
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="h-screen flex" style={{ width: "100vw", background: BG }}>
      {/* LEFT - logo panel */}
      <aside
        className="hidden lg:flex flex-col items-center justify-center"
        style={{
          flex: "1.05",
          background: `linear-gradient(150deg, ${NAVY_900} 0%, ${NAVY_800} 55%, ${NAVY_700} 100%)`,
          padding: "56px 64px",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative glow blobs */}
        <div aria-hidden style={{ position: "absolute", top: -180, left: -180, width: 520, height: 520, borderRadius: "50%", background: `radial-gradient(circle, rgba(212,175,103,.14), transparent 65%)` }} />
        <div aria-hidden style={{ position: "absolute", bottom: -200, right: -140, width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.05), transparent 70%)" }} />
        <div aria-hidden style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,103,.06), transparent 60%)", pointerEvents: "none" }} />

        {/* Centered logo block */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 28, textAlign: "center" }}>

          {/* Logo image with ring */}
          <div style={{
            position: "relative",
            width: 152,
            height: 152,
          }}>
            {/* Outer ring */}
            <div style={{
              position: "absolute",
              inset: -8,
              borderRadius: "50%",
              background: `conic-gradient(from 0deg, ${GOLD}55, transparent 40%, ${GOLD}88, transparent 80%, ${GOLD}44)`,
              animation: "spin 18s linear infinite",
            }} />
            {/* Inner ring */}
            <div style={{
              position: "absolute",
              inset: -3,
              borderRadius: "50%",
              border: `1.5px solid rgba(212,175,103,.35)`,
            }} />
            <img
              src="/slate-logo.jpeg"
              alt="SLATE"
              style={{
                width: 152,
                height: 152,
                borderRadius: "50%",
                objectFit: "cover",
                boxShadow: "0 20px 60px rgba(0,0,0,.5), 0 0 0 4px rgba(212,175,103,.22)",
                display: "block",
                position: "relative",
                zIndex: 1,
              }}
            />
          </div>

          {/* Brand text */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{
              fontWeight: 800,
              fontSize: 52,
              letterSpacing: "0.18em",
              background: `linear-gradient(135deg, #fff 30%, ${GOLD_LIGHT} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1,
            }}>
              SLATE
            </div>
            <div style={{
              fontSize: 13,
              color: "#8a9ab8",
              letterSpacing: ".18em",
              textTransform: "uppercase" as const,
              fontWeight: 500,
            }}>
              Secured Land Asset Token Exchange
            </div>
          </div>

          {/* Thin gold rule */}
          <div style={{ width: 64, height: 1.5, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </aside>

      {/* RIGHT - form panel */}
      <div className="flex-1 flex items-center justify-center overflow-y-auto" style={{ flex: "0.95", padding: 48 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          {/* Mobile-only logo */}
          <div className="flex lg:hidden items-center gap-2.5 justify-center" style={{ marginBottom: 24 }}>
            <img src="/slate-logo.jpeg" alt="SLATE" style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", boxShadow: `0 0 0 2px ${GOLD}55` }} />
            <div style={{ fontWeight: 800, fontSize: 20, color: NAVY_900, letterSpacing: "0.12em" }}>SLATE</div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              border: `1px solid ${LINE}`,
              boxShadow: "0 24px 60px -20px rgba(10,22,40,.18), 0 2px 8px rgba(10,22,40,.04)",
              padding: "40px 38px 36px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${GOLD}, ${NAVY_800})` }} />

            {step === "credentials" && (
              <>
                <div style={{ fontSize: 17, fontWeight: 700, color: NAVY_900, marginBottom: 5, letterSpacing: "-.2px" }}>Sign in to SLATE</div>
                <div style={{ fontSize: 13, color: MUTED, marginBottom: 22, lineHeight: 1.5 }}>
                  Enter your mobile number or email with your password. We'll send a one-time code to verify it's you.
                </div>

                <div className="flex flex-col gap-3">
                  <Input
                    label="Mobile number or email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 98XXXXXXXX or name@department.gov.in"
                    startAdornment={<UserRound size={15} style={{ color: "#9aa1a9" }} />}
                  />
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    startAdornment={<Lock size={15} style={{ color: "#9aa1a9" }} />}
                    endAdornment={
                      <button onClick={() => setShowPassword((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9aa1a9", display: "flex" }}>
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    }
                  />
                  {sendError && <div style={{ fontSize: 12, color: "#B0392F" }}>{sendError}</div>}
                  <Button disabled={!identifier.trim() || !password || sendLoading} onClick={handleSendOtp} fullWidth>
                    {sendLoading ? "Sending…" : "Continue"}
                  </Button>
                </div>

                <div style={{ marginTop: 18, textAlign: "center", fontSize: 12.5, color: MUTED }}>
                  New citizen?{" "}
                  <Link to={ROUTES.PATHS.APP.SLATE.REGISTER} style={{ color: NAVY_800, fontWeight: 700, textDecoration: "none" }}>
                    Register with Aadhaar
                  </Link>
                </div>
              </>
            )}

            {step === "otp" && (
              <>
                <a
                  onClick={() => setStep("credentials")}
                  className="flex items-center gap-1.5"
                  style={{ fontSize: 13.5, color: MUTED, fontWeight: 600, cursor: "pointer", width: "fit-content" }}
                >
                  <ArrowLeft size={14} /> Back
                </a>

                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: "50%",
                    background: "linear-gradient(145deg, #fbf2e2, #f4e3bd)",
                    margin: "26px auto 18px",
                    boxShadow: "0 6px 18px rgba(212,175,103,.25)",
                  }}
                >
                  <ShieldCheck size={26} style={{ color: "#a9791f" }} />
                </div>

                <div style={{ fontSize: 21, fontWeight: 700, textAlign: "center", color: NAVY_900, letterSpacing: "-.2px" }}>Verify OTP</div>
                <div style={{ fontSize: 13.5, textAlign: "center", color: MUTED, marginTop: 8, lineHeight: 1.6 }}>
                  An OTP was sent to your registered {channel === "email" ? "email" : "mobile number"}{" "}
                  <strong style={{ color: NAVY_900, fontWeight: 600 }}>{maskIdentifier(identifier.trim(), channel)}</strong>.
                </div>

                {devOtpHint && (
                  <div style={{ marginTop: 16, padding: "8px 12px", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, fontSize: 12.5, color: "#92400e", display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontWeight: 600 }}>Dev mode:</span> OTP auto-filled ({devOtpHint}). Check server logs if needed.
                  </div>
                )}

                <div style={{ marginTop: devOtpHint ? 10 : 26 }}>
                  <OtpBoxInput value={otp} onChange={(v) => { setOtp(v); setOtpError(""); }} error={otpError} />
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 6 || verifyLoading}
                  onMouseEnter={() => setVerifyHover(true)}
                  onMouseLeave={() => setVerifyHover(false)}
                  className="flex items-center justify-center gap-2 w-full"
                  style={{
                    marginTop: 26,
                    padding: "14px 0",
                    border: "none",
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${NAVY_800}, ${NAVY_900})`,
                    color: "#fff",
                    fontSize: 14.5,
                    fontWeight: 700,
                    letterSpacing: ".02em",
                    cursor: otp.length !== 6 || verifyLoading ? "not-allowed" : "pointer",
                    opacity: otp.length !== 6 || verifyLoading ? 0.5 : 1,
                    boxShadow: verifyHover && otp.length === 6 ? "0 14px 28px -8px rgba(10,22,40,.55)" : "0 10px 24px -8px rgba(10,22,40,.45)",
                    transform: verifyHover && otp.length === 6 ? "translateY(-1px)" : "translateY(0)",
                    transition: "transform .15s, box-shadow .15s",
                  }}
                >
                  <ShieldCheck size={16} style={{ color: GOLD_LIGHT }} />
                  {verifyLoading ? "Verifying…" : "Verify & sign in"}
                </button>

                <div className="flex items-center justify-center gap-1.5" style={{ marginTop: 18, fontSize: 13, color: MUTED }}>
                  Didn't receive the code?
                  <button
                    onClick={handleSendOtp}
                    disabled={sendLoading}
                    style={{ color: NAVY_800, fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    {otpSentAt ? "Resend OTP" : "Send OTP"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
