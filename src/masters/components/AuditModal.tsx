import { Clock, Plus, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/ui/primitives/Modal/Modal";
import { useTheme } from "@/ui/theme/ThemeContext";

export type AuditAction = "created" | "updated" | "deleted";

export interface AuditRecord {
    id: string;
    action: AuditAction;
    timestamp: string;
    performedBy: string;
    changes?: { field: string; from: string; to: string }[];
}

interface AuditModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    records: AuditRecord[];
}

const ACTION_CONFIG: Record<AuditAction, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    created: { label: "Created", icon: <Plus size={11} />, color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    updated: { label: "Updated", icon: <Pencil size={11} />, color: "#f97316", bg: "rgba(249,115,22,0.1)" },
    deleted: { label: "Deleted", icon: <Trash2 size={11} />, color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

export const AuditModal = ({ isOpen, onClose, title, records }: AuditModalProps) => {
    const { theme } = useTheme();
    const c = theme.colors;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <div style={{ background: c.surface, borderRadius: 18, overflow: "hidden" }}>
                {/* Glow strip */}
                <div style={{ height: 3, background: `linear-gradient(to right, transparent, ${c.accent}, transparent)` }} />

                {/* Header */}
                <div style={{
                    padding: "18px 24px",
                    borderBottom: `1px solid ${c.primaryBorder}`,
                    background: c.primaryLight,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: 10,
                            background: `${c.accent}18`,
                            border: `1.5px solid ${c.accent}30`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: c.accent,
                        }}>
                            <Clock size={18} />
                        </div>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: c.text, margin: 0 }}>Audit Trail</p>
                            <p style={{ fontSize: 11, color: c.textMuted, margin: "2px 0 0" }}>{title} · {records.length} events</p>
                        </div>
                    </div>
                    {/* <button
                        onClick={onClose}
                        style={{
                            width: 28, height: 28, borderRadius: 8,
                            border: `1px solid ${c.primaryBorder}`,
                            background: "transparent", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: c.textMuted, transition: "all 0.15s",
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = c.primaryHover;
                            (e.currentTarget as HTMLElement).style.color = c.text;
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                            (e.currentTarget as HTMLElement).style.color = c.textMuted;
                        }}
                    >
                        <X size={14} />
                    </button> */}
                </div>

                {/* Timeline */}
                <div style={{ padding: "20px 24px", maxHeight: 440, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0 }}>
                    {records.map((rec, i) => {
                        const cfg = ACTION_CONFIG[rec.action];
                        const isLast = i === records.length - 1;

                        return (
                            <div key={rec.id} style={{ display: "flex", gap: 14 }}>
                                {/* Timeline spine */}
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                                    <div style={{
                                        width: 30, height: 30, borderRadius: "50%",
                                        background: cfg.bg,
                                        border: `2px solid ${cfg.color}40`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: cfg.color, flexShrink: 0,
                                        boxShadow: `0 0 10px ${cfg.color}25`,
                                    }}>
                                        {cfg.icon}
                                    </div>
                                    {!isLast && (
                                        <div style={{ width: 1.5, flex: 1, minHeight: 24, background: `${c.primaryBorder}`, margin: "4px 0" }} />
                                    )}
                                </div>

                                {/* Card */}
                                <div style={{
                                    flex: 1,
                                    marginBottom: isLast ? 0 : 16,
                                    background: c.primaryLight,
                                    border: `1px solid ${c.primaryBorder}`,
                                    borderRadius: 10,
                                    padding: "12px 14px",
                                }}>
                                    {/* Top row */}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: rec.changes ? 10 : 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 700,
                                                color: cfg.color,
                                                background: cfg.bg,
                                                border: `1px solid ${cfg.color}30`,
                                                borderRadius: 999,
                                                padding: "2px 9px",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.06em",
                                            }}>
                                                {cfg.label}
                                            </span>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: c.text }}>
                                                by {rec.performedBy}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: 11, color: c.textMuted }}>
                                            {new Date(rec.timestamp).toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Changes diff */}
                                    {rec.changes && rec.changes.length > 0 && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                            {rec.changes.map((ch, ci) => (
                                                <div key={ci} style={{
                                                    display: "flex", alignItems: "center", gap: 6,
                                                    fontSize: 11, flexWrap: "wrap",
                                                }}>
                                                    <span style={{
                                                        fontWeight: 600, color: c.textMuted,
                                                        background: c.surface,
                                                        border: `1px solid ${c.primaryBorder}`,
                                                        borderRadius: 5, padding: "1px 7px",
                                                    }}>
                                                        {ch.field}
                                                    </span>
                                                    <span style={{
                                                        color: "#ef4444",
                                                        background: "rgba(239,68,68,0.08)",
                                                        border: "1px solid rgba(239,68,68,0.2)",
                                                        borderRadius: 5, padding: "1px 7px",
                                                        textDecoration: "line-through",
                                                    }}>
                                                        {ch.from}
                                                    </span>
                                                    <span style={{ color: c.textMuted, fontSize: 12 }}>→</span>
                                                    <span style={{
                                                        color: "#22c55e",
                                                        background: "rgba(34,197,94,0.08)",
                                                        border: "1px solid rgba(34,197,94,0.2)",
                                                        borderRadius: 5, padding: "1px 7px",
                                                    }}>
                                                        {ch.to}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
};