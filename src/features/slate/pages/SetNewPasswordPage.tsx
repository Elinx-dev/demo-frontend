import { useState } from "react";
import { ShieldCheck, Lock, Eye, EyeOff } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { Button } from "@/ui/primitives/Button/Button";
import { Input } from "@/ui/primitives/Input/Input";
import { Alert } from "@/ui/primitives/Alert/Alert";
import { useSlateStore } from "../state/SlateProvider";

export default function SetNewPasswordPage() {
  const { changePassword, logout } = useSlateStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const mismatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = () => {
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    setError("");
    changePassword(currentPassword, newPassword).catch((err) => {
      setError(err instanceof Error ? err.message : "Could not set your new password.");
      setSubmitting(false);
    });
  };

  return (
    <div className="h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F2A4A 0%, #15375c 60%, #1d4670 100%)" }}>
      <div style={{ width: 440 }}>
        <div className="flex items-center gap-2.5 justify-center" style={{ marginBottom: 22, color: "#fff" }}>
          <img src="/slate-logo.jpeg" alt="SLATE" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: ".02em" }}>SLATE</div>
            <div style={{ fontSize: 11, color: "#bcd0e6" }}>Set a new password</div>
          </div>
        </div>

        <Card style={{ background: "#fff" }}>
          <div className="flex flex-col items-center text-center" style={{ marginBottom: 18 }}>
            <span className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: "50%", background: "#fbf3e2", color: "#8f6a26", marginBottom: 10 }}>
              <ShieldCheck size={22} />
            </span>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0F2A4A" }}>Set your new password</div>
            <div style={{ fontSize: 12.5, color: "#717881", marginTop: 4, maxWidth: 340 }}>
              You're signing in with a temporary password. Choose a new password to continue to your dashboard.
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Input
              label="Temporary / current password"
              type={show ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              startAdornment={<Lock size={15} style={{ color: "#9aa1a9" }} />}
            />
            <Input
              label="New password"
              type={show ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              startAdornment={<Lock size={15} style={{ color: "#9aa1a9" }} />}
              endAdornment={
                <button onClick={() => setShow((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9aa1a9", display: "flex" }}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
            <Input
              label="Confirm new password"
              type={show ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={mismatch ? "Passwords don't match" : undefined}
              startAdornment={<Lock size={15} style={{ color: "#9aa1a9" }} />}
            />
            {error && <Alert type="error" message={error} dismissible={false} />}
            <Button
              disabled={!currentPassword || newPassword.length < 6 || newPassword !== confirmPassword || submitting}
              onClick={handleSubmit}
              fullWidth
            >
              {submitting ? "Saving…" : "Set new password & continue"}
            </Button>
            <button
              onClick={() => logout()}
              style={{ fontSize: 12.5, color: "#717881", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "center" }}
            >
              Sign out instead
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
