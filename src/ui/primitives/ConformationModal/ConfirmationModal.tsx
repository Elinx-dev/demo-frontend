import React, { useEffect, useState } from "react";
import { Modal } from "@/ui/primitives/Modal/Modal";
import { AlertTriangle, Info, ShieldAlert, X } from "lucide-react";
import { useTheme } from "@/ui/theme/ThemeContext";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;

  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
}) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) setTimeout(() => setVisible(true), 10);
    else setVisible(false);
  }, [isOpen]);

  const variants = {
    danger: {
      icon: <ShieldAlert size={22} />,
      iconBg: "rgba(239,68,68,0.12)",
      iconColor: "#ef4444",
      accent: "#ef4444",
      accentSoft: "rgba(239,68,68,0.08)",
      confirmBg: "linear-gradient(135deg, #dc2626, #ef4444)",
      confirmShadow: "0 4px 14px rgba(239,68,68,0.35)",
      glow: "rgba(239,68,68,0.15)",
    },
    warning: {
      icon: <AlertTriangle size={22} />,
      iconBg: "rgba(234,179,8,0.12)",
      iconColor: "#eab308",
      accent: "#eab308",
      accentSoft: "rgba(234,179,8,0.08)",
      confirmBg: "linear-gradient(135deg, #ca8a04, #eab308)",
      confirmShadow: "0 4px 14px rgba(234,179,8,0.35)",
      glow: "rgba(234,179,8,0.15)",
    },
    info: {
      icon: <Info size={22} />,
      iconBg: `rgba(99,102,241,0.12)`,
      iconColor: c.accent,
      accent: c.accent,
      accentSoft: `${c.accent}12`,
      confirmBg: `linear-gradient(135deg, ${c.primary}, ${c.accent})`,
      confirmShadow: `0 4px 14px ${c.accent}40`,
      glow: `${c.accent}20`,
    },
  };

  const v = variants[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div
        style={{
          background: c.surface,
          borderRadius: 18,
          overflow: "hidden",
          transform: visible
            ? "translateY(0) scale(1)"
            : "translateY(12px) scale(0.97)",
          opacity: visible ? 1 : 0,
          transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Glow strip at top */}
        <div
          style={{
            height: 3,
            background: `linear-gradient(to right, transparent, ${v.accent}, transparent)`,
            opacity: 0.8,
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            background: v.accentSoft,
            borderBottom: `1px solid ${c.primaryBorder}`,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Icon badge */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: v.iconBg,
                border: `1.5px solid ${v.accent}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: v.iconColor,
                flexShrink: 0,
                boxShadow: `0 0 16px ${v.glow}`,
              }}
            >
              {v.icon}
            </div>

            <div>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: c.text,
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                {title}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: v.iconColor,
                  margin: "2px 0 0",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  opacity: 0.85,
                }}
              >
                {variant} · action required
              </p>
            </div>
          </div>

          {/* Close X */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close confirmation modal"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: `1px solid ${c.primaryBorder}`,
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: c.textMuted,
              flexShrink: 0,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                c.primaryLight;
              (e.currentTarget as HTMLElement).style.color = c.text;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = c.textMuted;
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 24px" }}>
          <p
            style={{
              fontSize: 13.5,
              color: c.textMuted,
              lineHeight: 1.65,
              margin: "0 0 24px",
            }}
          >
            {message}
          </p>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={() => {
                if (onCancel) {
                  onCancel();
                } else {
                  onClose();
                }
              }}
              style={{
                padding: "9px 18px",
                borderRadius: 9,
                border: `1.5px solid ${c.primaryBorder}`,
                background: "transparent",
                color: c.text,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  c.primaryLight)
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "transparent")
              }
            >
              {cancelText}
            </button>

            <button
              onClick={onConfirm}
              style={{
                padding: "9px 22px",
                borderRadius: 9,
                border: "none",
                background: v.confirmBg,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: v.confirmShadow,
                transition: "all 0.15s",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-1px)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  v.confirmShadow.replace("0.35", "0.5");
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  v.confirmShadow;
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
