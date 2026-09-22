/**
 * Reusable 58/42 split layout for property detail.
 * Left: Identity, Ownership, Encumbrance, Chain of Title, Audit, History + any extras.
 * Right: Map View + Diagram.
 * Used across citizen, surveyor, officer, and VAO portals.
 */
import { useState, useEffect } from "react";
import {
  Map, PenLine,
  Filter, CheckCircle2, AlertTriangle, XCircle, Info, UserRound, FileText,
  ShieldCheck, ShieldAlert, Loader2, ArrowRight,
} from "lucide-react";
import { slateApi } from "../services/apiClient";
import { Card } from "@/ui/primitives/Card/Card";
import { Tabs } from "@/ui/primitives/Tabs/Tabs";
import Badge from "@/ui/primitives/Badge/Badge";
import ParcelMap from "./ParcelMap";
import { DlGrid, DlRow } from "./DefinitionList";
import { inr, inrShort } from "../utils/format";
import type { SlateToken, SlateHistoryEntry, SlateHistoryKind, SurveyMeasurementRow } from "../types/slate.types";

// ─── role / kind helpers ──────────────────────────────────────────────────────

const KIND_COLOR: Record<string, string> = {
  ok: "#1C7A4E", warn: "#B8722E", danger: "#B0392F", info: "#B8923D",
};
const KIND_BADGE: Record<string, "success" | "warning" | "danger" | "info"> = {
  ok: "success", warn: "warning", danger: "danger", info: "info",
};

function kindIcon(kind: SlateHistoryKind, size = 11) {
  if (kind === "ok") return <CheckCircle2 size={size} />;
  if (kind === "warn") return <AlertTriangle size={size} />;
  if (kind === "danger") return <XCircle size={size} />;
  return <Info size={size} />;
}

export function deriveRole(actor: string, action: string): string {
  const a = actor.toLowerCase();
  const act = action.toLowerCase();
  if (a.includes("surveyor") || act.includes("survey")) return "Surveyor";
  if (a.includes("bank") || a.includes("hdfc") || a.includes("icici") || act.includes("mortgage")) return "Bank";
  if (a.includes("court") || act.includes("court") || act.includes("dispute")) return "Court";
  if (a.includes("registrar") || a.includes("officer") || a.includes("revenue") || a.includes("admin")
    || act.includes("mint") || act.includes("endorse") || act.includes("verified")) return "Officer";
  if (act.includes("heir") || act.includes("consent") || act.includes("transfer") || act.includes("sale")) return "Citizen";
  return "System";
}

// ─── diagram helpers ─────────────────────────────────────────────────────────

function parseLength(val: string): number {
  const m = val.match(/([\d.]+)/);
  return m ? parseFloat(m[1]) : 10;
}

export function buildSketchPolygon(measurements: SurveyMeasurementRow[], svgSize: number) {
  const n = measurements.length;
  if (n < 3) return null;
  const lengths = measurements.map((m) => parseLength(m.val));
  const maxLen = Math.max(...lengths);
  const scale = (svgSize * 0.55) / maxLen;
  const scaledLengths = lengths.map((l) => l * scale);
  const angleStep = (2 * Math.PI) / n;
  const relPts: [number, number][] = [[0, 0]];
  let x = 0, y = 0, angle = -Math.PI / 2;
  for (let i = 0; i < n - 1; i++) {
    angle += angleStep;
    x += scaledLengths[i] * Math.cos(angle);
    y += scaledLengths[i] * Math.sin(angle);
    relPts.push([x, y]);
  }
  const minX = Math.min(...relPts.map((p) => p[0]));
  const maxX = Math.max(...relPts.map((p) => p[0]));
  const minY = Math.min(...relPts.map((p) => p[1]));
  const maxY = Math.max(...relPts.map((p) => p[1]));
  const cx = svgSize / 2, cy = svgSize / 2;
  const offX = cx - (minX + maxX) / 2;
  const offY = cy - (minY + maxY) / 2;
  const pts: [number, number][] = relPts.map((rp) => [rp[0] + offX, rp[1] + offY]);
  const midpoints = pts.map((pt, i) => {
    const next = pts[(i + 1) % pts.length];
    return { mx: (pt[0] + next[0]) / 2, my: (pt[1] + next[1]) / 2, label: measurements[i].val };
  });
  return { pts, midpoints };
}

export function buildGpsSketch(polygon: [number, number][], svgSize: number) {
  if (polygon.length < 3) return null;
  const lats = polygon.map((p) => p[0]);
  const lngs = polygon.map((p) => p[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const latSpan = maxLat - minLat || 0.0001;
  const lngSpan = maxLng - minLng || 0.0001;
  const pad = svgSize * 0.16;
  const usable = svgSize - 2 * pad;
  const maxSpan = Math.max(latSpan, lngSpan);
  const scale = usable / maxSpan;
  const drawW = lngSpan * scale;
  const drawH = latSpan * scale;
  const offX = pad + (usable - drawW) / 2;
  const offY = pad + (usable - drawH) / 2;
  const pts: [number, number][] = polygon.map(([lat, lng]) => [
    offX + (lng - minLng) * scale,
    offY + (maxLat - lat) * scale,
  ]);
  const midpoints = pts.map((pt, i) => {
    const next = pts[(i + 1) % pts.length];
    const [lat1, lng1] = polygon[i];
    const [lat2, lng2] = polygon[(i + 1) % polygon.length];
    const R = 6371000;
    const φ1 = (lat1 * Math.PI) / 180, φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const label = dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${Math.round(dist)} m`;
    return { mx: (pt[0] + next[0]) / 2, my: (pt[1] + next[1]) / 2, label };
  });
  return { pts, midpoints };
}

export function buildFallbackRect(svgSize: number) {
  const w = svgSize * 0.54, h = svgSize * 0.40;
  const cx = svgSize / 2, cy = svgSize / 2;
  const pts: [number, number][] = [
    [cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2],
    [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2],
  ];
  return { pts, midpoints: [{ mx: cx, my: cy - h / 2 - 14, label: "-" }, { mx: cx, my: cy, label: "" }, { mx: cx, my: cy + h / 2 + 14, label: "" }, { mx: cx, my: cy, label: "" }] };
}

// ─── Shared SketchSVG ────────────────────────────────────────────────────────

export function SketchSVG({
  sketch,
  svgSize,
}: {
  sketch: ReturnType<typeof buildSketchPolygon>;
  svgSize: number;
}) {
  const data = sketch ?? buildFallbackRect(svgSize);
  const pointsStr = data.pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} style={{ display: "block" }}>
      <defs>
        <pattern id="psvg-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e8ebee" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width={svgSize} height={svgSize} fill="url(#psvg-grid)" />
      <g transform={`translate(${svgSize - 34}, 10)`}>
        <circle cx="12" cy="12" r="11" fill="#fff" stroke="#c8d0d8" strokeWidth="1" />
        <polygon points="12,3 10,12 12,10 14,12" fill="#B0392F" />
        <polygon points="12,21 10,12 12,14 14,12" fill="#888" />
        <text x="12" y="7" textAnchor="middle" fontSize="5" fontWeight="700" fill="#B0392F">N</text>
      </g>
      <polygon points={pointsStr} fill="rgba(15,42,74,0.07)" stroke="#0F2A4A" strokeWidth="2" strokeLinejoin="round" />
      {data.pts.map((pt, i) => (
        <g key={i}>
          <circle cx={pt[0]} cy={pt[1]} r="4" fill="#fff" stroke="#0F2A4A" strokeWidth="1.5" />
          <text x={pt[0]} y={pt[1] - 7} textAnchor="middle" fontSize="9" fontWeight="700" fill="#0F2A4A">
            {String.fromCharCode(65 + (i % 26))}
          </text>
          {data.midpoints[i]?.label && (
            <text
              x={data.midpoints[i].mx} y={data.midpoints[i].my}
              textAnchor="middle" fontSize="9.5" fill="#1C7A4E" fontWeight="600"
              stroke="#fff" strokeWidth="3"
              style={{ paintOrder: "stroke" } as React.CSSProperties}
            >
              {data.midpoints[i].label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ─── Chain of Title tab ──────────────────────────────────────────────────────

/** Parse the structured deed detail string produced by approveChecker */
function parseDeedDetail(detail: string): Record<string, string> | null {
  if (!detail.includes("Deed type:") && !detail.includes("Parties:")) return null;
  const result: Record<string, string> = {};
  const pairs = detail.split("·").map((s) => s.trim());
  for (const pair of pairs) {
    const colonIdx = pair.indexOf(":");
    if (colonIdx === -1) continue;
    const key = pair.slice(0, colonIdx).trim();
    const val = pair.slice(colonIdx + 1).trim();
    if (key && val) result[key] = val;
  }
  return Object.keys(result).length > 0 ? result : null;
}

function ChainOfTitleTab({ token }: { token: SlateToken }) {
  const ownershipEvents = token.history.filter((h) =>
    /transfer|sale|gift|partition|inherit|mint|succession|owner|deed/i.test(h.action + " " + h.detail)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Current holders */}
      <div style={{ background: "#f0f8f4", border: "1.5px solid #1C7A4E30", borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#1C7A4E", textTransform: "uppercase" as const, letterSpacing: ".06em", marginBottom: 10 }}>
          Current Title Holders
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {token.ownership.owners.map((o) => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", borderRadius: 8, padding: "10px 14px", border: "1px solid #dceedd" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1C7A4E18", display: "flex", alignItems: "center", justifyContent: "center", color: "#1C7A4E" }}>
                  <UserRound size={15} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#161b22" }}>{o.name}</div>
                  <div style={{ fontSize: 11, color: "#717881" }}>ID: {o.id}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" as const }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1C7A4E" }}>{o.share}%</div>
                <div style={{ fontSize: 10.5, color: "#9aa1a9" }}>share</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 11.5, color: "#545c66" }}>
          <span style={{ fontWeight: 600 }}>Type:</span> {token.ownership.ownershipType} &nbsp;·&nbsp;
          <span style={{ fontWeight: 600 }}>Acquired:</span> {token.ownership.acquisitionDate}
        </div>
      </div>

      {/* Provenance timeline */}
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: ".06em", marginTop: 4 }}>
        Provenance Timeline
      </div>
      {ownershipEvents.length === 0 ? (
        <div style={{ color: "#9aa1a9", fontSize: 12.5, padding: "12px 0" }}>No prior ownership events recorded.</div>
      ) : (
        <div style={{ position: "relative", paddingLeft: 28 }}>
          <div style={{ position: "absolute", left: 9, top: 4, bottom: 4, width: 2, background: "#dee2e6" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...ownershipEvents].reverse().map((h, i) => {
              const color = KIND_COLOR[h.kind] ?? KIND_COLOR.info;
              const deed = parseDeedDetail(h.detail);
              const isTransfer = /deed registered|ownership transferred/i.test(h.action);
              const partiesRaw = deed?.["Parties"] ?? "";
              const [seller, buyer] = partiesRaw.split(/→|->/).map((s) => s.trim());
              return (
                <div key={i} style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: -28, top: 10, width: 20, height: 20, borderRadius: "50%", background: "#fff", border: `2px solid ${color}`, color, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                    {kindIcon(h.kind)}
                  </div>
                  <div style={{ borderRadius: 10, border: `1px solid ${color}30`, background: `${color}0a`, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#161b22" }}>{h.action}</span>
                      <Badge size="sm" variant={KIND_BADGE[h.kind] ?? "info"}>{h.kind}</Badge>
                    </div>

                    {/* Deed Details card for transfer events */}
                    {isTransfer && deed ? (
                      <div style={{ background: "#fff", border: "1px solid #e0e4e8", borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
                        {/* Seller → Buyer flow */}
                        {seller && buyer && (
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #f0f1f3" }}>
                            <div style={{ textAlign: "center" as const }}>
                              <div style={{ fontSize: 11, color: "#9aa1a9", marginBottom: 2 }}>Seller</div>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F2A4A" }}>{seller}</div>
                            </div>
                            <ArrowRight size={16} style={{ color: "#B8923D", flexShrink: 0 }} />
                            <div style={{ textAlign: "center" as const }}>
                              <div style={{ fontSize: 11, color: "#9aa1a9", marginBottom: 2 }}>Buyer</div>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1C7A4E" }}>{buyer}</div>
                            </div>
                          </div>
                        )}
                        {/* Deed fields */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                          {deed["Deed type"] && (
                            <div><span style={{ fontSize: 10.5, color: "#9aa1a9" }}>Deed Type</span><div style={{ fontSize: 12, fontWeight: 600 }}>{deed["Deed type"]}</div></div>
                          )}
                          {deed["Consideration"] && (
                            <div><span style={{ fontSize: 10.5, color: "#9aa1a9" }}>Consideration</span><div style={{ fontSize: 12, fontWeight: 600 }}>{deed["Consideration"]}</div></div>
                          )}
                          {deed["Initiated by"] && (
                            <div><span style={{ fontSize: 10.5, color: "#9aa1a9" }}>Initiated By</span><div style={{ fontSize: 12, fontWeight: 600 }}>{deed["Initiated by"]}</div></div>
                          )}
                          {deed["Txn"] && (
                            <div><span style={{ fontSize: 10.5, color: "#9aa1a9" }}>Transaction ID</span><div style={{ fontSize: 11, fontFamily: "monospace", color: "#545c66" }}>{deed["Txn"]}</div></div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12.3, color: "#545c66", lineHeight: 1.55, marginBottom: 8 }}>{h.detail}</div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 11 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#717881" }}>
                        <UserRound size={11} /> {h.actor}
                      </span>
                      <span style={{ color: "#9aa1a9", fontFamily: "monospace" }}>{h.ts}</span>
                      <span style={{ color: "#B8923D", fontWeight: 600, fontSize: 10.5 }}>{deriveRole(h.actor, h.action)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Audit tab ───────────────────────────────────────────────────────────────

const ALL_ROLES = ["All", "Officer", "Citizen", "Surveyor", "Bank", "Court", "System"];

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  Officer:  { bg: "#e8f0fe", color: "#1a4fa3" },
  Citizen:  { bg: "#f0f8f4", color: "#1C7A4E" },
  Surveyor: { bg: "#fff7e0", color: "#B8722E" },
  Bank:     { bg: "#fce8e0", color: "#B0392F" },
  Court:    { bg: "#f4f0fd", color: "#6d3da8" },
  System:   { bg: "#f4f5f7", color: "#545c66" },
};

function AuditTab({ history, ulpin }: { history: SlateHistoryEntry[]; ulpin: string }) {
  const [roleFilter, setRoleFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; brokenAt?: string; reason?: string; eventCount?: number } | null>(null);

  const enriched = history.map((h, idx) => ({
    ...h,
    role: deriveRole(h.actor, h.action),
    prev: idx > 0 ? history[idx - 1].detail : "-",
    idx,
  }));

  const roleCounts = ALL_ROLES.slice(1).reduce<Record<string, number>>((acc, role) => {
    acc[role] = enriched.filter((r) => r.role === role).length;
    return acc;
  }, {});

  const filtered = enriched.filter((r) => {
    const matchRole = roleFilter === "All" || r.role === roleFilter;
    const matchSearch = !search || [r.actor, r.action, r.detail, r.role].some((f) =>
      f.toLowerCase().includes(search.toLowerCase())
    );
    return matchRole && matchSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
        <Filter size={13} color="#717881" />
        <span style={{ fontSize: 11.5, color: "#717881", fontWeight: 600 }}>Filter by role:</span>
        {ALL_ROLES.map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            style={{
              padding: "3px 11px", borderRadius: 20, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
              border: roleFilter === role ? "1.5px solid #0F2A4A" : "1.5px solid #dee2e6",
              background: roleFilter === role ? "#0F2A4A" : "#f4f5f7",
              color: roleFilter === role ? "#fff" : "#545c66",
              transition: "all 140ms",
            }}
          >
            {role}{role !== "All" && roleCounts[role] ? ` (${roleCounts[role]})` : ""}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search actor, action, or detail…"
        style={{ width: "100%", padding: "7px 12px", borderRadius: 8, border: "1.5px solid #dee2e6", fontSize: 12.5, color: "#161b22", outline: "none", boxSizing: "border-box" as const }}
      />

      {/* Table */}
      <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #eceef0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f4f8fd" }}>
              {["Timestamp", "Actor", "Role", "Action", "Change Description", "Previous State", "Type"].map((h) => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left" as const, borderBottom: "1.5px solid #dce0e5", fontWeight: 700, color: "#545c66", whiteSpace: "nowrap" as const, fontSize: 11 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "20px", textAlign: "center" as const, color: "#9aa1a9", fontSize: 12.5 }}>No records match the current filter.</td></tr>
            ) : (
              filtered.map((r, i) => {
                const rs = ROLE_STYLE[r.role] ?? ROLE_STYLE.System;
                return (
                  <tr key={r.idx} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f1f3", fontFamily: "monospace", fontSize: 11, color: "#9aa1a9", whiteSpace: "nowrap" as const }}>{r.ts}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f1f3", fontWeight: 600, color: "#161b22" }}>{r.actor}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f1f3" }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: rs.bg, color: rs.color }}>{r.role}</span>
                    </td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f1f3", fontWeight: 600, color: "#2d3748" }}>{r.action}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f1f3", color: "#545c66", maxWidth: 220 }}>{r.detail}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f1f3", color: "#9aa1a9", fontStyle: "italic" as const, maxWidth: 180, fontSize: 11.5 }}>
                      {r.idx === 0
                        ? <span style={{ color: "#1C7A4E", fontStyle: "normal" as const, fontWeight: 600 }}>Token created</span>
                        : r.prev}
                    </td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f1f3" }}>
                      <Badge size="sm" variant={KIND_BADGE[r.kind] ?? "info"}>{r.kind}</Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: "#9aa1a9" }}>Showing {filtered.length} of {history.length} records</div>

      {/* Cryptographic chain integrity verification */}
      <div style={{ marginTop: 4, padding: "14px 16px", borderRadius: 10, border: "1.5px solid #dee2e6", background: "#f8f9fb" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 10 }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#161b22", marginBottom: 2 }}>Cryptographic Chain Integrity</div>
            <div style={{ fontSize: 11.5, color: "#717881" }}>Verify that the SHA-256 hash chain for all events on this ULPIN has not been tampered with.</div>
          </div>
          <button
            onClick={() => {
              setVerifying(true);
              setVerifyResult(null);
              slateApi.ledger.verifyChain(ulpin)
                .then((r) => setVerifyResult(r))
                .catch(() => setVerifyResult({ valid: false, reason: "Could not reach verification endpoint." }))
                .finally(() => setVerifying(false));
            }}
            disabled={verifying}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: verifying ? "not-allowed" : "pointer", border: "1.5px solid #0F2A4A", background: "#0F2A4A", color: "#fff", opacity: verifying ? 0.7 : 1 }}
          >
            {verifying ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <ShieldCheck size={13} />}
            {verifying ? "Verifying…" : "Verify Hash Chain"}
          </button>
        </div>

        {verifyResult && (
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: verifyResult.valid ? "#f0f8f4" : "#fff5f5", border: `1.5px solid ${verifyResult.valid ? "#1C7A4E" : "#B0392F"}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: verifyResult.valid ? 4 : 8 }}>
              {verifyResult.valid
                ? <ShieldCheck size={16} style={{ color: "#1C7A4E" }} />
                : <ShieldAlert size={16} style={{ color: "#B0392F" }} />}
              <span style={{ fontSize: 13, fontWeight: 700, color: verifyResult.valid ? "#1C7A4E" : "#B0392F" }}>
                {verifyResult.valid ? "Hash chain intact - all events verified" : "Hash chain integrity failure detected"}
              </span>
            </div>
            {verifyResult.valid && verifyResult.eventCount !== undefined && (
              <div style={{ fontSize: 11.5, color: "#545c66" }}>{verifyResult.eventCount} events verified · SHA-256 ECDSA-P256 · All hashes match</div>
            )}
            {!verifyResult.valid && (
              <div style={{ fontSize: 11.5, color: "#B0392F" }}>
                {verifyResult.brokenAt && <div>Broken at event: <strong>{verifyResult.brokenAt}</strong></div>}
                {verifyResult.reason && <div style={{ marginTop: 2 }}>{verifyResult.reason}</div>}
              </div>
            )}
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ─── Encumbrance details (EC table) ─────────────────────────────────────────

function EncumbranceDetailsTab({ token }: { token: SlateToken }) {
  const ec = token.ecData;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Lien / mortgage summary */}
      <Card>
        <DlGrid>
          <DlRow label="Encumbrance" value={token.encumbrance.flag ? `${token.encumbrance.lienType} (${token.encumbrance.lender})` : "None"} />
          <DlRow label="Charge Amount" value={inr(token.encumbrance.chargeAmount)} />
          {token.encumbrance.since && <DlRow label="Since" value={token.encumbrance.since} />}
          <DlRow label="Second Charge" value={token.encumbrance.secondCharge ? "Yes" : "No"} />
          <DlRow label="Dispute" value={token.dispute.flag ? token.dispute.status : "Clear"} />
          {token.dispute.court && <DlRow label="Court" value={token.dispute.court} />}
          {token.dispute.petitioner && <DlRow label="Petitioner" value={token.dispute.petitioner} />}
          <DlRow label="Guideline Value" value={inrShort(token.financial.guidanceValue)} />
          <DlRow label="Last Sale Value" value={inrShort(token.financial.lastSaleValue)} />
          {token.financial.stampDutyRef && <DlRow label="Stamp Duty Ref" value={token.financial.stampDutyRef} />}
          <DlRow label="Tax Status" value={token.financial.taxStatus} />
        </DlGrid>
      </Card>

      {/* EC Certificate data */}
      {ec ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0F2A4A" }}>Encumbrance Certificate - {ec.sro}</div>
            <div style={{ fontSize: 11, color: "#717881" }}>{ec.searchPeriod.from} to {ec.searchPeriod.to}</div>
          </div>
          <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #dee2e6" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
              <thead>
                <tr style={{ background: "#f4f8fd" }}>
                  {["Sr.", "Doc No.", "Date", "Nature", "Executant", "Claimant", "Value", "Status"].map((h) => (
                    <th key={h} style={{ padding: "7px 10px", textAlign: "left" as const, borderBottom: "1.5px solid #dce0e5", fontWeight: 700, color: "#545c66", whiteSpace: "nowrap" as const, fontSize: 10.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ec.entries.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: "16px", textAlign: "center" as const, color: "#9aa1a9" }}>No EC entries found.</td></tr>
                ) : (
                  ec.entries.map((e, i) => (
                    <tr key={e.srNo} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid #f0f1f3", fontWeight: 600, color: "#545c66" }}>{e.srNo}</td>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid #f0f1f3", fontFamily: "monospace", color: "#1d4670" }}>{e.docNo}/{e.docYear}</td>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid #f0f1f3", whiteSpace: "nowrap" as const }}>{e.registrationDate}</td>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid #f0f1f3", fontWeight: 600 }}>{e.nature}</td>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid #f0f1f3" }}>{e.executant}</td>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid #f0f1f3" }}>{e.claimant}</td>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid #f0f1f3", textAlign: "right" as const }}>{e.considerationValue ? inrShort(e.considerationValue) : "-"}</td>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid #f0f1f3" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: e.status === "active" ? "#fce8e0" : "#f0f8f4", color: e.status === "active" ? "#B0392F" : "#1C7A4E" }}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ padding: "12px 16px", borderRadius: 8, background: "#f8f9fb", fontSize: 12.5, color: "#9aa1a9" }}>
          No Encumbrance Certificate data on record.
        </div>
      )}
    </div>
  );
}

// ─── FMB Diagram tab ─────────────────────────────────────────────────────────

function FmbDiagramTab({ token }: { token: SlateToken }) {
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token.physical.fmbRef || token.physical.fmbRef === "-") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    slateApi.fmb.getImage(token.physical.fmbRef)
      .then((res) => setImageData(res.imageData))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [token.physical.fmbRef]);

  return (
    <div style={{ background: "#fff", border: "1.5px solid #b0b8c4", borderRadius: 8, overflow: "hidden" }}>
      {/* FMB diagram image */}
      <div style={{ position: "relative", minHeight: 220, background: "#f4f8fb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {loading && (
          <div style={{ textAlign: "center" as const, color: "#9aa1a9", fontFamily: "sans-serif" }}>
            <div style={{ fontSize: 12 }}>Loading FMB diagram…</div>
          </div>
        )}
        {!loading && imageData && (
          <img
            src={imageData}
            alt={`FMB Diagram - ${token.physical.fmbRef}`}
            style={{ width: "100%", display: "block", borderBottom: "1px solid #e0e4e8" }}
          />
        )}
        {!loading && !imageData && (
          <div style={{ textAlign: "center" as const, padding: "20px 0" }}>
            <FileText size={28} color="#b0b8c4" />
            <div style={{ fontSize: 12, color: "#9aa1a9", marginTop: 6, fontFamily: "sans-serif" }}>
              {error ? "Could not load FMB diagram" : "FMB diagram not available"}
            </div>
            <div style={{ fontSize: 11, color: "#b0b8c4", marginTop: 2, fontFamily: "sans-serif" }}>Ref: {token.physical.fmbRef}</div>
          </div>
        )}
      </div>
      {/* Boundary description + measurements */}
      <div style={{ padding: "10px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: ".05em", marginBottom: 4 }}>Boundary Description</div>
        <div style={{ fontSize: 12.5, color: "#161b22", lineHeight: 1.65 }}>{token.physical.boundaries}</div>
      </div>
      {token.survey?.measurements && token.survey.measurements.length > 0 && (
        <div style={{ padding: "0 16px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: ".05em", marginBottom: 6 }}>Site Measurements</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f4f8fd" }}>
                {["From", "→", "To", "Length"].map((h, i) => (
                  <th key={i} style={{ padding: "5px 8px", textAlign: i === 3 ? "right" as const : i === 1 ? "center" as const : "left" as const, border: "1px solid #dce0e5", fontWeight: 700, color: "#545c66" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {token.survey.measurements.map((m, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                  <td style={{ padding: "5px 8px", border: "1px solid #eceef0" }}>{m.from}</td>
                  <td style={{ padding: "5px 8px", border: "1px solid #eceef0", textAlign: "center" as const, color: "#9aa1a9" }}>→</td>
                  <td style={{ padding: "5px 8px", border: "1px solid #eceef0" }}>{m.to}</td>
                  <td style={{ padding: "5px 8px", border: "1px solid #eceef0", textAlign: "right" as const, fontWeight: 600 }}>{m.val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── PropertySplitView ───────────────────────────────────────────────────────

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  badge?: number;
}

interface PropertySplitViewProps {
  token: SlateToken;
  /** Extra tabs inserted between Encumbrance and Chain of Title. */
  extraLeftTabs?: TabItem[];
  accentColor?: string;
}

export function PropertySplitView({
  token,
  extraLeftTabs = [],
  accentColor = "#1d4670",
}: PropertySplitViewProps) {
  const svgSize = 300;
  const sketch = token.survey?.measurements && token.survey.measurements.length >= 3
    ? buildSketchPolygon(token.survey.measurements, svgSize)
    : null;

  const leftTabs: TabItem[] = [
    {
      id: "identity",
      label: "Identity & Location",
      content: (
        <Card>
          <DlGrid>
            <DlRow label="Survey No." value={token.identity.surveyNo} />
            <DlRow label="Sub-division" value={token.identity.subDivision} />
            <DlRow label="Token ID" value={token.identity.tokenId} />
            <DlRow label="Parcel Type" value={token.identity.parcelType} />
            <DlRow label="District" value={token.location.district} />
            <DlRow label="Taluk" value={token.location.taluk} />
            <DlRow label="Village" value={token.location.village} />
            <DlRow label="GPS Centroid" full value={token.location.gpsCentroid || "-"} />
            <DlRow label="Geometry Ref" value={token.location.geometryRef} />
          </DlGrid>
        </Card>
      ),
    },
    {
      id: "ownership",
      label: "Ownership & Physical",
      content: (
        <Card>
          <DlGrid>
            <DlRow label="Owner(s)" full value={token.ownership.owners.map((o) => `${o.name} (${o.share}%)`).join(", ")} />
            <DlRow label="Ownership Type" value={token.ownership.ownershipType} />
            <DlRow label="Acquired" value={token.ownership.acquisitionDate} />
            <DlRow label="Area" value={token.physical.area} />
            <DlRow label="Classification" value={token.physical.classification} />
            <DlRow label="Boundaries" full value={token.physical.boundaries} />
            <DlRow label="FMB Ref" value={token.physical.fmbRef} />
          </DlGrid>
        </Card>
      ),
    },
    {
      id: "encumbrance",
      label: "Encumbrance & Financial",
      content: <EncumbranceDetailsTab token={token} />,
    },
    ...extraLeftTabs,
    {
      id: "chain_of_title",
      label: "Chain of Title",
      content: <ChainOfTitleTab token={token} />,
    },
    {
      id: "audit",
      label: "Audit",
      badge: token.history.length,
      content: <AuditTab history={token.history} ulpin={token.ulpin} />,
    },
  ];

  const rightTabs: TabItem[] = [
    {
      id: "map",
      label: "Map View",
      icon: <Map size={13} />,
      content: <ParcelMap
        gps={token.location.gpsCentroid}
        height={420}
        polygon={token.survey?.polygonVertices?.map((v) => [v.lat, v.lng] as [number, number])}
      />,
    },
    {
      id: "fmb",
      label: "FMB Diagram",
      icon: <FileText size={13} />,
      content: <FmbDiagramTab token={token} />,
    },
    {
      id: "sketch",
      label: "Diagram",
      icon: <PenLine size={13} />,
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ background: "#fff", border: "1.5px solid #c8d0d8", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ borderBottom: "1px solid #e0e4e8", padding: "7px 14px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "#545c66", textTransform: "uppercase" as const, letterSpacing: ".05em" }}>
                Parcel Sketch - {token.ulpin}
              </span>
              <span style={{ fontSize: 10, color: "#9aa1a9" }}>{sketch ? "Verified survey" : "Estimated"}</span>
            </div>
            <div style={{ padding: 14, background: "#fefefe", display: "flex", justifyContent: "center" }}>
              <SketchSVG sketch={sketch} svgSize={svgSize} />
            </div>
            <div style={{ borderTop: "1px solid #e0e4e8", padding: "8px 14px", display: "flex", gap: 20, flexWrap: "wrap" as const }}>
              <span style={{ fontSize: 11 }}><span style={{ color: "#9aa1a9" }}>Area: </span><strong>{token.physical.area}</strong></span>
              <span style={{ fontSize: 11 }}><span style={{ color: "#9aa1a9" }}>FMB: </span><strong>{token.physical.fmbRef}</strong></span>
              {token.identity.parcelType && (
                <span style={{ fontSize: 11 }}><span style={{ color: "#9aa1a9" }}>Type: </span><strong>{token.identity.parcelType}</strong></span>
              )}
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden", gap: 3, background: "#dce0e5" }}>
      {/* Left - data tabs */}
      <div style={{ flex: "0 0 calc(58% - 2px)", display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff" }}>
        <div style={{ padding: "6px 16px 0", borderBottom: "1.5px solid #eceef0", background: "#f8f9fb", flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: ".08em" }}>
            Property Details
          </span>
        </div>
        <Tabs tabs={leftTabs} variant="underline" size="sm" scrollable className="flex-1" accentColor={accentColor} />
      </div>

      {/* Right - map + diagram */}
      <div style={{ flex: "0 0 calc(42% - 2px)", display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff" }}>
        <div style={{ padding: "6px 16px 0", borderBottom: "1.5px solid #eceef0", background: "#f8f9fb", flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: ".08em" }}>
            Maps &amp; Diagrams
          </span>
        </div>
        <Tabs tabs={rightTabs} variant="underline" size="sm" scrollable className="flex-1" accentColor={accentColor} />
      </div>
    </div>
  );
}
