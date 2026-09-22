import { useState } from "react";
import {  Clock, CirclePlus } from "lucide-react";
import { useTheme } from "@/ui/theme/ThemeContext";
import { Button } from "@/ui/primitives/Button/Button";
import { Tooltip } from "@/ui/primitives/Tooltip/Tooltip";
import { AuditModal, type AuditRecord } from "./AuditModal";

// ── Static demo data ───────────────────────────────────────────────────────────
export const STATIC_AUDIT: AuditRecord[] = [
    {
        id: "1",
        action: "created",
        timestamp: "2026-03-01T09:15:00Z",
        performedBy: "system_admin",
    },
    {
        id: "2",
        action: "updated",
        timestamp: "2026-03-05T14:32:00Z",
        performedBy: "ram.surya",
        changes: [
            { field: "Country Name", from: "United State", to: "United States" },
            { field: "ISO Code",     from: "US",           to: "USA"           },
        ],
    },
    {
        id: "3",
        action: "updated",
        timestamp: "2026-03-08T11:04:00Z",
        performedBy: "ram.surya",
        changes: [
            { field: "Status", from: "Inactive", to: "Active" },
        ],
    },
    {
        id: "4",
        action: "deleted",
        timestamp: "2026-03-10T16:50:00Z",
        performedBy: "system_admin",
    },
];

type MasterHeaderProps = {
    title: string;
    onAdd: () => void;
    description?: string;
};

export const MasterHeader = ({ title, onAdd, description }: MasterHeaderProps) => {
    const { theme } = useTheme();
    const c = theme.colors;
    const [auditOpen, setAuditOpen] = useState(false);

    const tooltipContent = description
        ?? `Use this screen to view, add, edit, and deactivate ${title.replace(" Master", "").toLowerCase()} records.`;

    return (
        <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                {/* Left */}
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: c.text, margin: 0 }}>{title}</h2>
                        <Tooltip
                            content={
                                <div style={{ maxWidth: 280, lineHeight: 1.6, fontSize: 12 }}>
                                    <p style={{ fontWeight: 700, marginBottom: 4, color: c.accent }}>How to use</p>
                                    {tooltipContent}
                                </div>
                            }
                            placement="bottom" trigger="click" interactive offset={10}
                        >
                            <span
                                style={{
                                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                                    width: 18, height: 18, borderRadius: "50%",
                                    border: `1.5px solid ${c.primaryBorder}`,
                                    background: c.primaryLight, color: c.textMuted,
                                    fontSize: 10, fontWeight: 700, cursor: "pointer",
                                    userSelect: "none", flexShrink: 0, transition: "border-color 0.15s, color 0.15s",
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLElement).style.borderColor = c.accent;
                                    (e.currentTarget as HTMLElement).style.color = c.accent;
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.borderColor = c.primaryBorder;
                                    (e.currentTarget as HTMLElement).style.color = c.textMuted;
                                }}
                            >?</span>
                        </Tooltip>
                    </div>
                    <p style={{ fontSize: 12, color: c.textMuted, margin: "2px 0 0" }}>
                        Manage and configure {title.toLowerCase()} records
                    </p>
                </div>

                {/* Right: Audit + Add */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Button
                        variant="outline"
                        size="md"
                        onClick={() => setAuditOpen(true)}
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                        <Clock size={14} />
                        Audit Records
                    </Button>
                    <Button
                        variant="primary"
                        size="md"
                        onClick={onAdd}
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                        {/* <Plus size={15} /> */}
                        <CirclePlus size={15} color={c.surface} />
                        Add {title.replace(" Master", "").replace(" master", "")}
                    </Button>
                </div>
            </div>

            <AuditModal
                isOpen={auditOpen}
                onClose={() => setAuditOpen(false)}
                title={title}
                records={STATIC_AUDIT}
            />
        </>
    );
};