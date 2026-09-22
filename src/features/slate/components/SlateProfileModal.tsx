import { useRef, useState } from "react";
import { Camera, LogOut, IdCard, Phone, ShieldCheck, MapPin, X, UserIcon, Stamp, Landmark, Gavel, Compass, Mail, Home, Pencil, KeyRound, Eye, EyeOff } from "lucide-react";
import { Modal } from "@/ui/primitives/Modal/Modal";
import { Button } from "@/ui/primitives/Button/Button";
import { Input } from "@/ui/primitives/Input/Input";
import { Select } from "@/ui/primitives/Select/Select";
import { Textarea } from "@/ui/primitives/Textarea/Textarea";
import { Alert } from "@/ui/primitives/Alert/Alert";
import Avatar from "@/ui/primitives/Avatar/Avatar";
import { useToast } from "@/ui/feedback/toast/useToast";
import { jurisdictionLabel } from "../utils/jurisdiction";
import { useSlateStore } from "../state/SlateProvider";

const PORTAL_LABEL: Record<string, string> = {
  citizen: "Citizen Portal",
  officer: "Registration Officer Portal",
  bank: "Bank Portal",
  court: "Court / Admin Portal",
  surveyor: "Surveyor Portal",
};

const PORTAL_ICON: Record<string, typeof UserIcon> = {
  citizen: UserIcon,
  officer: Stamp,
  bank: Landmark,
  court: Gavel,
  surveyor: Compass,
};

interface SlateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  accent: string;
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4" style={{ padding: "11px 0", borderBottom: "1px solid #f1f3f5" }}>
      <span className="flex items-center gap-2" style={{ fontSize: 11.5, color: "#9aa1a9", fontWeight: 600, flexShrink: 0 }}>
        <span style={{ color: "#c3cad1" }}>{icon}</span>
        {label}
      </span>
      <span style={{ fontSize: 13, color: "#161b22", fontWeight: 500, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "#0F2A4A", margin: "18px 0 2px" }}>
      {children}
    </div>
  );
}

export default function SlateProfileModal({ isOpen, onClose, onSignOut, accent }: SlateProfileModalProps) {
  const { currentUser, uploadProfilePhoto, removeProfilePhoto, updateProfile, changePassword } = useSlateStore();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", gender: "", dob: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  if (!currentUser) return null;
  const u = currentUser;
  const jurisdiction = jurisdictionLabel(u);
  const PortalIcon = PORTAL_ICON[u.portal] ?? UserIcon;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      uploadProfilePhoto(String(reader.result))
        .then(() => toast.success("Profile photo updated."))
        .catch((err) => toast.error(err instanceof Error ? err.message : "Could not upload photo."));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    removeProfilePhoto()
      .then(() => toast.success("Profile photo removed."))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not remove photo."));
  };

  const startEdit = () => {
    setForm({ name: u.name, email: u.email ?? "", gender: u.gender ?? "", dob: u.dob ?? "", address: u.address ?? "" });
    setSaveError("");
    setEditing(true);
  };

  const handleSaveProfile = () => {
    setSaving(true);
    setSaveError("");
    updateProfile({ fullName: form.name, email: form.email, gender: form.gender, dob: form.dob, address: form.address })
      .then(() => {
        toast.success("Profile updated.");
        setEditing(false);
      })
      .catch((err) => setSaveError(err instanceof Error ? err.message : "Could not update profile."))
      .finally(() => setSaving(false));
  };

  const handleChangePassword = () => {
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords don't match.");
      return;
    }
    setPwSaving(true);
    setPwError("");
    changePassword(currentPassword, newPassword)
      .then(() => {
        toast.success("Password changed.");
        setChangingPassword(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      })
      .catch((err) => setPwError(err instanceof Error ? err.message : "Could not change password."))
      .finally(() => setPwSaving(false));
  };

  const idValue = u.employeeId ?? u.aadhaar;
  const idLabel = u.employeeId ? "Employee / Officer ID" : "Aadhaar";

  return (
    <Modal isOpen={isOpen} onClose={() => onClose()} size="3xl" showCloseButton={false}>
      <div className="flex" style={{ height: "min(640px, 86vh)" }}>
        {/* LEFT - ID badge panel */}
        <div
          className="flex flex-col items-center text-center"
          style={{
            width: 270,
            flexShrink: 0,
            padding: "40px 26px",
            background: `linear-gradient(160deg, ${accent} 0%, #0F2A4A 100%)`,
            backgroundImage: `linear-gradient(160deg, ${accent} 0%, #0F2A4A 100%), repeating-linear-gradient(45deg, rgba(255,255,255,.04) 0px, rgba(255,255,255,.04) 1px, transparent 1px, transparent 14px)`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div aria-hidden style={{ position: "absolute", left: -50, top: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
          <div aria-hidden style={{ position: "absolute", right: -60, bottom: -70, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <Avatar src={u.photo ?? undefined} name={u.name} bgColor="rgba(255,255,255,.16)" textColor="#fff" size={92} border="border-[3px] border-white/70" shadow="shadow-lg" />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload photo"
              className="flex items-center justify-center"
              style={{ position: "absolute", bottom: -2, right: -2, width: 28, height: 28, borderRadius: "50%", background: "#fff", border: "1px solid #dee2e6", cursor: "pointer", color: "#717881", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }}
            >
              <Camera size={13} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
          </div>

          <div style={{ marginTop: 18, position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>{u.name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.65)", marginTop: 3 }}>{u.role}</div>
          </div>

          <div className="flex flex-col items-center gap-2" style={{ marginTop: 16, position: "relative", zIndex: 1 }}>
            <span className="flex items-center gap-1.5" style={{ fontSize: 10.8, fontWeight: 700, padding: "4px 11px", borderRadius: 999, background: "rgba(255,255,255,.14)", color: "#fff" }}>
              <PortalIcon size={11} /> {PORTAL_LABEL[u.portal] ?? u.portal}
            </span>
            {jurisdiction && (
              <span className="flex items-center gap-1.5" style={{ fontSize: 10.8, fontWeight: 600, padding: "4px 11px", borderRadius: 999, background: "rgba(255,255,255,.10)", color: "rgba(255,255,255,.85)" }}>
                <MapPin size={10} /> {jurisdiction}
              </span>
            )}
            {u.status && (
              <span className="flex items-center gap-1.5" style={{ fontSize: 10.5, fontWeight: 700, color: u.status === "active" ? "#9adfb8" : "rgba(255,255,255,.6)" }}>
                <ShieldCheck size={11} /> {u.status === "active" ? "Active account" : u.status}
              </span>
            )}
          </div>

          {u.photo && (
            <button onClick={handleRemovePhoto} style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,.7)", background: "none", border: "none", cursor: "pointer", padding: 0, position: "relative", zIndex: 1 }}>
              Remove photo
            </button>
          )}

          {idValue && (
            <div style={{ marginTop: "auto", paddingTop: 24, width: "100%", position: "relative", zIndex: 1 }}>
              <div style={{ borderTop: "1px solid rgba(255,255,255,.16)", paddingTop: 16 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "rgba(255,255,255,.5)" }}>{idLabel}</div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "#fff", fontFamily: "monospace", letterSpacing: ".03em", marginTop: 3 }}>{idValue}</div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT - details panel */}
        <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
          <div className="flex items-center justify-between" style={{ flexShrink: 0, padding: "22px 28px 0" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F2A4A" }}>Profile</div>
            <div className="flex items-center gap-2">
              {!editing && !changingPassword && (
                <Button size="sm" variant="outline" onClick={startEdit}>
                  <Pencil size={12} /> Edit
                </Button>
              )}
              <button
                onClick={() => onClose()}
                aria-label="Close"
                className="flex items-center justify-center"
                style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid #dee2e6", background: "#fff", color: "#717881", cursor: "pointer" }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ padding: "4px 28px 8px" }}>
            {!editing ? (
              <>
                <SectionLabel>Identity</SectionLabel>
                <DetailRow icon={<UserIcon size={13} />} label="Gender" value={u.gender ?? "-"} />
                <DetailRow icon={<IdCard size={13} />} label="Date of birth" value={u.dob ?? "-"} />

                <SectionLabel>Contact</SectionLabel>
                {u.phone && <DetailRow icon={<Phone size={13} />} label="Phone" value={u.phone} />}
                <DetailRow icon={<Mail size={13} />} label="Email" value={u.email || "-"} />
                <DetailRow icon={<Home size={13} />} label="Address" value={u.address ?? "-"} />
              </>
            ) : (
              <div className="flex flex-col gap-3" style={{ paddingTop: 10 }}>
                <Input label="Full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <Select
                    label="Gender"
                    value={form.gender}
                    onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                    placeholder="Select gender"
                    options={[
                      { label: "Male", value: "Male" },
                      { label: "Female", value: "Female" },
                      { label: "Other", value: "Other" },
                    ]}
                  />
                  <Input label="Date of birth" type="date" value={form.dob} onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))} />
                </div>
                <Textarea label="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={2} />
                {saveError && <Alert type="error" message={saveError} dismissible={false} />}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button onClick={handleSaveProfile} disabled={!form.name.trim() || saving}>{saving ? "Saving…" : "Save changes"}</Button>
                </div>
              </div>
            )}

            <SectionLabel>Security</SectionLabel>
            {!changingPassword ? (
              <button
                onClick={() => { setChangingPassword(true); setPwError(""); }}
                className="flex items-center gap-2"
                style={{ padding: "10px 0", fontSize: 12.5, fontWeight: 600, color: "#15375c", background: "none", border: "none", cursor: "pointer" }}
              >
                <KeyRound size={13} /> Change password
              </button>
            ) : (
              <div className="flex flex-col gap-3" style={{ paddingTop: 8 }}>
                <Input
                  label="Current password"
                  type={showPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  endAdornment={
                    <button onClick={() => setShowPw((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9aa1a9", display: "flex" }}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  }
                />
                <Input label="New password" type={showPw ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
                <Input label="Confirm new password" type={showPw ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                {pwError && <Alert type="error" message={pwError} dismissible={false} />}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setChangingPassword(false)}>Cancel</Button>
                  <Button onClick={handleChangePassword} disabled={!currentPassword || newPassword.length < 6 || pwSaving}>
                    {pwSaving ? "Saving…" : "Update password"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div style={{ flexShrink: 0, borderTop: "1px solid #eceef0", padding: "14px 28px" }}>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => onClose()}>Close</Button>
              <Button variant="danger" onClick={onSignOut}>
                <LogOut size={14} /> Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
