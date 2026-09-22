/**
 * exportUtils.tsx
 * ─────────────────────────────────────────────────────────────
 * Drop this file in  src/utils/exportUtils.tsx  (or wherever
 * you keep shared utilities).
 *
 * Usage in ANY component:
 *
 *   import { ExportDropdown } from "@/utils/exportUtils";
 *
 *   <ExportDropdown
 *     data={myData}
 *     flatten={item => ({ ID: item.id, Name: item.name })}
 *     label="Export"
 *     filenamePrefix="my-master"
 *     c={c}                  // pass your theme colors
 *   />
 *
 * That's it. No extra code needed in your component.
 * ─────────────────────────────────────────────────────────────
 */

import  { useEffect, useRef, useState } from "react";
import { Download, FileText, FileJson, Sheet } from "lucide-react";

// ─── Core download trigger ────────────────────────────────────────────────────

function triggerDownload(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// ─── Format exporters ─────────────────────────────────────────────────────────

/**
 * Export any array as CSV.
 * @param data         Raw data array
 * @param flatten      Function that maps one item → flat key/value object
 * @param filename     Downloaded file name (e.g. "tenants.csv")
 */
export function exportCSV<T>(
    data: T[],
    flatten: (item: T) => Record<string, any>,
    filename = "export.csv"
) {
    const rows = data.map(flatten);
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
        headers.join(","),
        ...rows.map(r =>
            headers
                .map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`)
                .join(",")
        ),
    ].join("\n");
    triggerDownload(csv, filename, "text/csv");
}

/**
 * Export any array as JSON.
 */
export function exportJSON<T>(
    data: T[],
    flatten: (item: T) => Record<string, any>,
    filename = "export.json"
) {
    triggerDownload(
        JSON.stringify(data.map(flatten), null, 2),
        filename,
        "application/json"
    );
}

/**
 * Export any array as TSV (Tab-Separated Values - opens cleanly in Excel).
 */
export function exportTSV<T>(
    data: T[],
    flatten: (item: T) => Record<string, any>,
    filename = "export.tsv"
) {
    const rows = data.map(flatten);
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const tsv = [
        headers.join("\t"),
        ...rows.map(r => headers.map(h => r[h] ?? "").join("\t")),
    ].join("\n");
    triggerDownload(tsv, filename, "text/tab-separated-values");
}

// ─── ExportDropdown component ─────────────────────────────────────────────────

export interface ExportDropdownProps<T> {
    /** The data to export (current page, selected rows, whatever you pass) */
    data: T[];
    /**
     * Maps one raw item → a flat plain object whose keys become column headers.
     * Example:
     *   flatten={item => ({ ID: item.id, Name: item.name, Type: item.type?.name })}
     */
    flatten: (item: T) => Record<string, any>;
    /** Button label. Default: "Export" */
    label?: string;
    /** Prefix for downloaded filename. Default: "export" */
    filenamePrefix?: string;
    /** Your theme colors object (c = theme.colors) */
    c: any;
    /** Disable the button regardless of data length */
    disabled?: boolean;
}

export function ExportDropdown<T>({
    data,
    flatten,
    label = "Export",
    filenamePrefix = "export",
    c,
    disabled = false,
}: ExportDropdownProps<T>) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const isDisabled = disabled || !data.length;

    const options = [
        {
            label: "CSV",
            desc:  "Spreadsheet-compatible",
            icon:  <FileText size={15} />,
            color: "#16a34a",
            bg:    "#f0fdf4",
            fn:    () => exportCSV(data, flatten, `${filenamePrefix}.csv`),
        },
        {
            label: "JSON",
            desc:  "Raw data / API-ready",
            icon:  <FileJson size={15} />,
            color: "#2563eb",
            bg:    "#eff6ff",
            fn:    () => exportJSON(data, flatten, `${filenamePrefix}.json`),
        },
        {
            label: "TSV / Excel",
            desc:  "Tab-separated for Excel",
            icon:  <Sheet size={15} />,
            color: "#9333ea",
            bg:    "#faf5ff",
            fn:    () => exportTSV(data, flatten, `${filenamePrefix}.tsv`),
        },
    ];

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <button
                onClick={() => !isDisabled && setOpen(prev => !prev)}
                disabled={isDisabled}
                style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.45 : 1,
                    background: c.primaryLight,
                    color: c.primary,
                    border: `1px solid ${c.primaryBorder}`,
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                }}
                onMouseEnter={e => {
                    if (!isDisabled) {
                        e.currentTarget.style.background = c.accent;
                        e.currentTarget.style.color = "#fff";
                    }
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = c.primaryLight;
                    e.currentTarget.style.color = c.primary;
                }}
            >
                <Download size={14} />
                {label}
                <span style={{
                    fontSize: 9, opacity: 0.7,
                    display: "inline-block",
                    transition: "transform 0.2s",
                    transform: open ? "rotate(180deg)" : "rotate(0deg)",
                }}>▼</span>
            </button>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 6px)", right: 0,
                    background: c.background,
                    border: `1px solid ${c.primaryBorder}`,
                    borderRadius: 12, padding: 6, zIndex: 999, minWidth: 210,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)",
                    animation: "exportDropIn 0.15s ease",
                }}>
                    <style>{`
                        @keyframes exportDropIn {
                            from { opacity: 0; transform: translateY(-6px); }
                            to   { opacity: 1; transform: translateY(0);    }
                        }
                    `}</style>

                    <p style={{
                        fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.08em", color: c.textMuted, margin: "4px 10px 8px",
                    }}>
                        Choose format
                    </p>

                    {options.map(opt => (
                        <button
                            key={opt.label}
                            onClick={() => { opt.fn(); setOpen(false); }}
                            style={{
                                display: "flex", alignItems: "center", gap: 10,
                                width: "100%", padding: "9px 12px", borderRadius: 8,
                                background: "none", border: "none", cursor: "pointer",
                                textAlign: "left", transition: "background 0.12s",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = opt.bg)}
                            onMouseLeave={e => (e.currentTarget.style.background = "none")}
                        >
                            <span style={{
                                width: 30, height: 30, borderRadius: 8,
                                background: opt.bg, color: opt.color,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                            }}>
                                {opt.icon}
                            </span>
                            <div>
                                <p style={{ fontSize: 12.5, fontWeight: 700, color: c.text, margin: 0 }}>{opt.label}</p>
                                <p style={{ fontSize: 10.5, color: c.textMuted, margin: 0 }}>{opt.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}