import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRightLeft, MapPin, Users, Link2, ClipboardList,
  Landmark, Compass, Map, FileText, PenLine, Filter,
  CheckCircle2, AlertTriangle, XCircle, Info, UserRound,
} from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { Button } from "@/ui/primitives/Button/Button";
import { Tabs } from "@/ui/primitives/Tabs/Tabs";
import { Alert } from "@/ui/primitives/Alert/Alert";
import Badge from "@/ui/primitives/Badge/Badge";
import Empty from "@/ui/primitives/Empty/Empty";
import { useToast } from "@/ui/feedback/toast/useToast";
import { ROUTES } from "@/navigation/routes";
import { slateApi } from "../../services/apiClient";
import PageHead from "../../components/PageHead";
import StateBadge from "../../components/StateBadge";
import ParcelMap from "../../components/ParcelMap";
import { DlGrid, DlRow } from "../../components/DefinitionList";
import { inr, inrShort } from "../../utils/format";
import type { SlateToken, SlateHistoryEntry, SlateHistoryKind } from "../../types/slate.types";

// ─── helpers ────────────────────────────────────────────────────────────────

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

function deriveRole(actor: string, action: string): string {
  const a = actor.toLowerCase();
  const act = action.toLowerCase();
  if (a.includes("surveyor") || act.includes("survey")) return "Surveyor";
  if (a.includes("bank") || a.includes("hdfc") || a.includes("icici") || act.includes("mortgage")) return "Bank";
  if (a.includes("court") || act.includes("court") || act.includes("dispute")) return "Court";
  if (a.includes("registrar") || a.includes("officer") || a.includes("revenue") || a.includes("admin")
    || act.includes("mint") || act.includes("endorse") || act.includes("verified") || act.includes("verified")) return "Officer";
  if (act.includes("heir") || act.includes("consent") || act.includes("transfer") || act.includes("sale")) return "Citizen";
  return "System";
}

function parseLength(val: string): number {
  const m = val.match(/([\d.]+)/);
  return m ? parseFloat(m[1]) : 10;
}

function buildSketchPolygon(measurements: { from: string; to: string; val: string }[], svgSize: number) {
  const n = measurements.length;
  if (n < 3) return null;

  const lengths = measurements.map((m) => parseLength(m.val));
  const maxLen = Math.max(...lengths);
  const scale = (svgSize * 0.55) / maxLen;
  const scaledLengths = lengths.map((l) => l * scale);

  // distribute angles evenly clockwise from top
  const angleStep = (2 * Math.PI) / n;
  const pts: [number, number][] = [];
  let x = 0, y = 0;
  const cx = svgSize / 2, cy = svgSize / 2;

  // first pass: build relative polygon
  const relPts: [number, number][] = [[0, 0]];
  let angle = -Math.PI / 2; // start pointing up
  for (let i = 0; i < n - 1; i++) {
    angle += angleStep;
    x += scaledLengths[i] * Math.cos(angle);
    y += scaledLengths[i] * Math.sin(angle);
    relPts.push([x, y]);
  }

  // centre the polygon
  const minX = Math.min(...relPts.map((p) => p[0]));
  const maxX = Math.max(...relPts.map((p) => p[0]));
  const minY = Math.min(...relPts.map((p) => p[1]));
  const maxY = Math.max(...relPts.map((p) => p[1]));
  const offX = cx - (minX + maxX) / 2;
  const offY = cy - (minY + maxY) / 2;

  for (const rp of relPts) pts.push([rp[0] + offX, rp[1] + offY]);

  // midpoints for dimension labels
  const midpoints = pts.map((pt, i) => {
    const next = pts[(i + 1) % pts.length];
    return { mx: (pt[0] + next[0]) / 2, my: (pt[1] + next[1]) / 2, label: measurements[i].val };
  });

  return { pts, midpoints, measurements };
}

function buildFallbackRect(area: string, svgSize: number) {
  // Always fill a reasonable portion of the SVG regardless of the raw area value
  const w = svgSize * 0.54;
  const h = svgSize * 0.40;
  const cx = svgSize / 2, cy = svgSize / 2;
  const pts: [number, number][] = [
    [cx - w / 2, cy - h / 2],
    [cx + w / 2, cy - h / 2],
    [cx + w / 2, cy + h / 2],
    [cx - w / 2, cy + h / 2],
  ];
  const sides = [
    { label: area, mx: cx, my: cy - h / 2 - 14 },
    { label: "", mx: cx + w / 2 + 14, my: cy },
    { label: "", mx: cx, my: cy + h / 2 + 14 },
    { label: "", mx: cx - w / 2 - 14, my: cy },
  ];
  return { pts, midpoints: sides };
}

// ─── Chain of Title tab ─────────────────────────────────────────────────────

function ChainOfTitleTab({ token }: { token: SlateToken }) {
  const ownershipEvents = token.history.filter((h) =>
    /transfer|sale|gift|partition|inherit|mint|succession|owner/i.test(h.action + " " + h.detail)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Current holders */}
      <div style={{ background: "#f0f8f4", border: "1.5px solid #1C7A4E30", borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#1C7A4E", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
          Current Title Holders
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {token.ownership.owners.map((o) => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", borderRadius: 8, padding: "10px 14px", border: "1px solid #dceedd" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1C7A4E18", display: "flex", alignItems: "center", justifyContent: "center", color: "#1C7A4E" }}>
                  <UserRound size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#161b22" }}>{o.name}</div>
                  <div style={{ fontSize: 11, color: "#717881" }}>ID: {o.id}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
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
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9aa1a9", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 4 }}>
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
                    <div style={{ fontSize: 12.3, color: "#545c66", lineHeight: 1.55, marginBottom: 8 }}>{h.detail}</div>
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

      {/* All history events not matching ownership */}
      {token.history.filter((h) => !/transfer|sale|gift|partition|inherit|mint|succession|owner/i.test(h.action + " " + h.detail)).length > 0 && (
        <>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9aa1a9", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 8 }}>
            All Recorded Events
          </div>
          <div style={{ position: "relative", paddingLeft: 28 }}>
            <div style={{ position: "absolute", left: 9, top: 4, bottom: 4, width: 2, background: "#dee2e6" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {token.history.filter((h) => !/transfer|sale|gift|partition|inherit|mint|succession|owner/i.test(h.action + " " + h.detail)).map((h, i) => {
                const color = KIND_COLOR[h.kind] ?? KIND_COLOR.info;
                return (
                  <div key={i} style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: -28, top: 10, width: 20, height: 20, borderRadius: "50%", background: "#fff", border: `2px solid ${color}`, color, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                      {kindIcon(h.kind)}
                    </div>
                    <div style={{ borderRadius: 10, border: `1px solid ${color}30`, background: `${color}0a`, padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#161b22" }}>{h.action}</span>
                        <span style={{ fontSize: 10.5, color: "#9aa1a9", fontFamily: "monospace" }}>{h.ts}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#545c66", lineHeight: 1.5 }}>{h.detail}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.8, color: "#9aa1a9", marginTop: 6 }}>
                        <UserRound size={11} /> {h.actor}
                        <span style={{ marginLeft: 8, color: "#B8923D", fontWeight: 600 }}>{deriveRole(h.actor, h.action)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Audit tab ───────────────────────────────────────────────────────────────

const ALL_ROLES = ["All", "Officer", "Citizen", "Surveyor", "Bank", "Court", "System"];

function AuditTab({ history }: { history: SlateHistoryEntry[] }) {
  const [roleFilter, setRoleFilter] = useState("All");
  const [search, setSearch] = useState("");

  const enriched = history.map((h, idx) => ({
    ...h,
    role: deriveRole(h.actor, h.action),
    prev: idx > 0 ? history[idx - 1].detail : "-",
    idx,
  }));

  const filtered = enriched.filter((r) => {
    const matchRole = roleFilter === "All" || r.role === roleFilter;
    const matchSearch = !search || [r.actor, r.action, r.detail, r.role].some((f) =>
      f.toLowerCase().includes(search.toLowerCase())
    );
    return matchRole && matchSearch;
  });

  const roleCounts = ALL_ROLES.slice(1).reduce<Record<string, number>>((acc, role) => {
    acc[role] = enriched.filter((r) => r.role === role).length;
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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
        style={{
          width: "100%", padding: "7px 12px", borderRadius: 8, border: "1.5px solid #dee2e6",
          fontSize: 12.5, color: "#161b22", outline: "none", boxSizing: "border-box",
        }}
      />

      {/* Table */}
      <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #eceef0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f4f8fd" }}>
              {["Timestamp", "Actor", "Role", "Action", "Change Description", "Previous State", "Type"].map((h) => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1.5px solid #dce0e5", fontWeight: 700, color: "#545c66", whiteSpace: "nowrap", fontSize: 11 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#9aa1a9", fontSize: 12.5 }}>
                  No audit records match the current filter.
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr key={r.idx} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f1f3", fontFamily: "monospace", fontSize: 11, color: "#9aa1a9", whiteSpace: "nowrap" }}>{r.ts}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f1f3", fontWeight: 600, color: "#161b22" }}>{r.actor}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f1f3" }}>
                    <span style={{
                      fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                      background: r.role === "Officer" ? "#e8f0fe" : r.role === "Citizen" ? "#f0f8f4" : r.role === "Surveyor" ? "#fff7e0" : r.role === "Bank" ? "#fce8e0" : "#f4f5f7",
                      color: r.role === "Officer" ? "#1a4fa3" : r.role === "Citizen" ? "#1C7A4E" : r.role === "Surveyor" ? "#B8722E" : r.role === "Bank" ? "#B0392F" : "#545c66",
                    }}>{r.role}</span>
                  </td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f1f3", fontWeight: 600, color: "#2d3748" }}>{r.action}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f1f3", color: "#545c66", maxWidth: 220 }}>{r.detail}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f1f3", color: "#9aa1a9", fontStyle: "italic", maxWidth: 180, fontSize: 11.5 }}>
                    {r.idx === 0 ? <span style={{ color: "#1C7A4E", fontStyle: "normal", fontWeight: 600 }}>Token created</span> : r.prev}
                  </td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f1f3" }}>
                    <Badge size="sm" variant={KIND_BADGE[r.kind] ?? "info"}>{r.kind}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: "#9aa1a9" }}>Showing {filtered.length} of {history.length} records</div>
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
          <div style={{ textAlign: "center", color: "#9aa1a9", fontFamily: "sans-serif" }}>
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
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <FileText size={28} color="#b0b8c4" />
            <div style={{ fontSize: 12, color: "#9aa1a9", marginTop: 6, fontFamily: "sans-serif" }}>
              {error ? "Could not load FMB diagram" : "FMB diagram not available"}
            </div>
            <div style={{ fontSize: 11, color: "#b0b8c4", marginTop: 2, fontFamily: "sans-serif" }}>Ref: {token.physical.fmbRef}</div>
          </div>
        )}
      </div>

      {/* Boundary desc */}
      <div style={{ padding: "10px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#9aa1a9", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Boundary Description</div>
        <div style={{ fontSize: 12.5, color: "#161b22", lineHeight: 1.65 }}>{token.physical.boundaries}</div>
      </div>

      {/* Survey measurements table */}
      {token.survey?.measurements && token.survey.measurements.length > 0 && (
        <div style={{ padding: "0 16px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#9aa1a9", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Site Measurements</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f4f8fd" }}>
                <th style={{ padding: "5px 8px", textAlign: "left", border: "1px solid #dce0e5", fontWeight: 700, color: "#545c66" }}>From</th>
                <th style={{ padding: "5px 8px", textAlign: "center", border: "1px solid #dce0e5", color: "#9aa1a9" }}>→</th>
                <th style={{ padding: "5px 8px", textAlign: "left", border: "1px solid #dce0e5", fontWeight: 700, color: "#545c66" }}>To</th>
                <th style={{ padding: "5px 8px", textAlign: "right", border: "1px solid #dce0e5", fontWeight: 700, color: "#545c66" }}>Length</th>
              </tr>
            </thead>
            <tbody>
              {token.survey.measurements.map((m, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                  <td style={{ padding: "5px 8px", border: "1px solid #eceef0" }}>{m.from}</td>
                  <td style={{ padding: "5px 8px", border: "1px solid #eceef0", textAlign: "center", color: "#9aa1a9" }}>→</td>
                  <td style={{ padding: "5px 8px", border: "1px solid #eceef0" }}>{m.to}</td>
                  <td style={{ padding: "5px 8px", border: "1px solid #eceef0", textAlign: "right", fontWeight: 600 }}>{m.val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Land sketch diagram tab ──────────────────────────────────────────────────

function LandDiagramTab({ token }: { token: SlateToken }) {
  const SVG_SIZE = 340;
  const hasMeasurements = token.survey?.measurements && token.survey.measurements.length >= 3;

  const sketch = hasMeasurements
    ? buildSketchPolygon(token.survey!.measurements!, SVG_SIZE)
    : buildFallbackRect(token.physical.area, SVG_SIZE);

  const pointsStr = sketch?.pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Paper sheet */}
      <div style={{
        background: "#fff",
        border: "1.5px solid #c8d0d8",
        borderRadius: 8,
        boxShadow: "0 2px 12px rgba(0,0,0,.08)",
        padding: 0,
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Paper header */}
        <div style={{ borderBottom: "1px solid #e0e4e8", padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#545c66", textTransform: "uppercase", letterSpacing: ".06em" }}>
            Parcel Sketch - {token.ulpin}
          </div>
          <div style={{ fontSize: 10, color: "#9aa1a9" }}>
            {hasMeasurements ? "Based on verified survey measurements" : "Estimated from physical record"}
          </div>
        </div>

        {/* SVG drawing area */}
        <div style={{ background: "#fefefe", display: "flex", justifyContent: "center", padding: "14px 0" }}>
          <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} style={{ display: "block" }}>
            {/* Very light graph paper grid */}
            <defs>
              <pattern id="sketch-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e8ebee" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width={SVG_SIZE} height={SVG_SIZE} fill="url(#sketch-grid)" />

            {/* Compass rose top-right */}
            <g transform={`translate(${SVG_SIZE - 38}, 14)`}>
              <circle cx="14" cy="14" r="13" fill="#fff" stroke="#c8d0d8" strokeWidth="1" />
              <polygon points="14,3 12,14 14,12 16,14" fill="#B0392F" />
              <polygon points="14,25 12,14 14,16 16,14" fill="#888" />
              <text x="14" y="8" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#B0392F">N</text>
              <text x="14" y="23" textAnchor="middle" fontSize="5" fill="#888">S</text>
              <text x="24" y="15.5" textAnchor="middle" fontSize="5" fill="#888">E</text>
              <text x="4" y="15.5" textAnchor="middle" fontSize="5" fill="#888">W</text>
            </g>

            {sketch && (
              <>
                {/* Filled polygon */}
                <polygon
                  points={pointsStr}
                  fill="rgba(15,42,74,0.06)"
                  stroke="#0F2A4A"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />

                {/* Vertex dots + labels */}
                {sketch.pts.map((pt, i) => {
                  const label = sketch.midpoints[i]?.label ?? "";
                  const mx = sketch.midpoints[i]?.mx ?? 0;
                  const my = sketch.midpoints[i]?.my ?? 0;
                  const hasMidLabel = "label" in (sketch.midpoints[i] ?? {});
                  return (
                    <g key={i}>
                      {/* Vertex circle */}
                      <circle cx={pt[0]} cy={pt[1]} r="4" fill="#fff" stroke="#0F2A4A" strokeWidth="1.5" />
                      {/* Vertex letter */}
                      <text x={pt[0]} y={pt[1] - 7} textAnchor="middle" fontSize="9" fontWeight="700" fill="#0F2A4A">
                        {String.fromCharCode(65 + (i % 26))}
                      </text>
                      {/* Side dimension label */}
                      {hasMidLabel && (
                        <text x={mx} y={my} textAnchor="middle" fontSize="9.5" fill="#1C7A4E" fontWeight="600"
                          style={{ paintOrder: "stroke" } as React.CSSProperties}
                          stroke="#fff" strokeWidth="3">
                          {label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </>
            )}

            {/* Scale bar at bottom */}
            <g transform={`translate(14, ${SVG_SIZE - 18})`}>
              <line x1="0" y1="0" x2="50" y2="0" stroke="#545c66" strokeWidth="1.5" />
              <line x1="0" y1="-4" x2="0" y2="4" stroke="#545c66" strokeWidth="1.5" />
              <line x1="50" y1="-4" x2="50" y2="4" stroke="#545c66" strokeWidth="1.5" />
              <text x="25" y="-6" textAnchor="middle" fontSize="8" fill="#545c66">≈ scale</text>
            </g>
          </svg>
        </div>

        {/* Footer info */}
        <div style={{ borderTop: "1px solid #e0e4e8", padding: "8px 14px", display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div style={{ fontSize: 11 }}>
            <span style={{ color: "#9aa1a9" }}>Classification: </span>
            <span style={{ fontWeight: 700, color: "#161b22" }}>{token.physical.classification}</span>
          </div>
          <div style={{ fontSize: 11 }}>
            <span style={{ color: "#9aa1a9" }}>Area: </span>
            <span style={{ fontWeight: 700, color: "#161b22" }}>{token.physical.area}</span>
          </div>
          <div style={{ fontSize: 11 }}>
            <span style={{ color: "#9aa1a9" }}>FMB Ref: </span>
            <span style={{ fontWeight: 700, color: "#161b22" }}>{token.physical.fmbRef}</span>
          </div>
        </div>
      </div>

      {/* Boundary description */}
      <Card>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9aa1a9", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
          Boundary Description
        </div>
        <div style={{ fontSize: 12.5, color: "#161b22", lineHeight: 1.7 }}>{token.physical.boundaries}</div>
      </Card>

      {!hasMeasurements && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "#fff7e0", border: "1px solid #f0c060" }}>
          <AlertTriangle size={14} color="#B8722E" />
          <span style={{ fontSize: 12, color: "#B8722E" }}>
            No verified survey measurements on record. Diagram is estimated from area data.
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function PropertyDetailPage() {
  const { ulpin = "" } = useParams<{ ulpin: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [token, setToken] = useState<SlateToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    return slateApi.citizen
      .getPropertyDetail(ulpin)
      .then((t) => setToken(t))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load this property."))
      .finally(() => setLoading(false));
  }, [ulpin]);

  useEffect(() => { setError(""); load(); }, [load]);

  const handleConsent = (heirId: string) => {
    slateApi.citizen
      .giveHeirConsent(ulpin, heirId)
      .then(() => { toast.success("Consent recorded."); return load(); })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not record consent."));
  };

  if (loading && !token) return <div style={{ fontSize: 12.5, color: "#9aa1a9", padding: "20px 0" }}>Loading property…</div>;
  if (error && !token) return <Alert type="error" title="Could not load property" message={error} dismissible={false} />;
  if (!token) return <Empty variant="no-data" title="Property not found" description={`No token found for ${ulpin}.`} />;

  // ── Left panel tabs ──
  const leftTabs = [
    {
      id: "identity",
      label: "Identity & Location",
      icon: <MapPin size={13} />,
      content: (
        <Card>
          <DlGrid>
            <DlRow label="Survey No." value={token.identity.surveyNo} />
            <DlRow label="Sub-division" value={token.identity.subDivision} />
            <DlRow label="Parcel Type" value={token.identity.parcelType} />
            <DlRow label="District" value={token.location.district} />
            <DlRow label="Taluk" value={token.location.taluk} />
            <DlRow label="Village" value={token.location.village} />
            <DlRow label="Geometry Ref" value={token.location.geometryRef} />
            <DlRow label="GPS Centroid" full value={token.location.gpsCentroid || "-"} />
          </DlGrid>
        </Card>
      ),
    },
    {
      id: "ownership",
      label: "Ownership & Physical",
      icon: <Users size={13} />,
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <DlGrid>
              <DlRow label="Owner(s)" full value={token.ownership.owners.map((o) => `${o.name} (${o.share}%)`).join(", ")} />
              <DlRow label="Ownership Type" value={token.ownership.ownershipType} />
              <DlRow label="Acquired" value={token.ownership.acquisitionDate} />
              <DlRow label="Area" value={token.physical.area} />
              <DlRow label="Classification" value={token.physical.classification} />
              <DlRow label="FMB Ref" value={token.physical.fmbRef} />
              <DlRow label="Boundaries" full value={token.physical.boundaries} />
            </DlGrid>
          </Card>
          {token.succession && (
            <Card>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#B8923D", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
                Succession
              </div>
              <DlGrid>
                <DlRow label="Deceased" value={token.succession.deceased} />
                <DlRow label="Death Cert No." value={token.succession.deathCertNo} />
                <DlRow label="Death Date" value={token.succession.deathDate} />
                <DlRow label="Applicable Law" full value={token.succession.law} />
              </DlGrid>
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                {token.succession.heirs.map((h) => (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 7, border: "1px solid #eceef0", background: "#fafbfc" }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{h.name} ({h.relation})</div>
                      <div style={{ fontSize: 11, color: "#717881" }}>Share: {h.share}%</div>
                    </div>
                    {h.consent === "given" ? (
                      <span style={{ fontSize: 11.5, color: "#1C7A4E", fontWeight: 600 }}>Consent given</span>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleConsent(h.id)}>Give consent</Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ),
    },
    {
      id: "financial",
      label: "Encumbrance & Finance",
      icon: <Landmark size={13} />,
      content: (
        <Card>
          <DlGrid>
            <DlRow label="Encumbrance" value={token.encumbrance.flag ? `${token.encumbrance.lienType} (${token.encumbrance.lender})` : "None"} />
            <DlRow label="Charge Amount" value={inr(token.encumbrance.chargeAmount)} />
            <DlRow label="Dispute" value={token.dispute.flag ? token.dispute.status : "Clear"} />
            <DlRow label="Court" value={token.dispute.court ?? "-"} />
            <DlRow label="Guideline Value" value={inrShort(token.financial.guidanceValue)} />
            <DlRow label="Last Sale Value" value={inrShort(token.financial.lastSaleValue)} />
            <DlRow label="Tax Status" value={token.financial.taxStatus} />
            <DlRow label="Stamp Duty Ref" value={token.financial.stampDutyRef ?? "-"} />
          </DlGrid>
        </Card>
      ),
    },
    {
      id: "chain",
      label: "Chain of Title",
      icon: <Link2 size={13} />,
      content: <ChainOfTitleTab token={token} />,
    },
    {
      id: "audit",
      label: "Audit",
      icon: <ClipboardList size={13} />,
      badge: token.history.length,
      content: <AuditTab history={token.history} />,
    },
  ];

  // ── Right panel tabs ──
  const rightTabs = [
    {
      id: "map",
      label: "Map View",
      icon: <Map size={13} />,
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ParcelMap gps={token.location.gpsCentroid} height={420} />
        </div>
      ),
    },
    {
      id: "fmb",
      label: "FMB Diagram",
      icon: <FileText size={13} />,
      content: <FmbDiagramTab token={token} />,
    },
    {
      id: "diagram",
      label: "Diagram",
      icon: <PenLine size={13} />,
      content: <LandDiagramTab token={token} />,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Page header */}
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="Property Passport"
          title={<span style={{ fontFamily: "monospace" }}>{token.ulpin}</span>}
          sub={`${token.location.village}, ${token.location.taluk}, ${token.location.district}`}
          actions={
            <>
              <StateBadge state={token.state} />
              {token.state === "active" && (
                <Button onClick={() => navigate(ROUTES.PATHS.APP.SLATE.CITIZEN_INITIATE, { state: { ulpin: token.ulpin } })}>
                  <ArrowRightLeft size={14} /> Initiate Transaction
                </Button>
              )}
            </>
          }
        />
      </div>

      {/* Split body */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden", gap: 3, background: "#dce0e5" }}>
        {/* Left - info tabs */}
        <div style={{ flex: "0 0 calc(58% - 2px)", minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff" }}>
          <div style={{ padding: "6px 16px 0", borderBottom: "1.5px solid #eceef0", background: "#f8f9fb", flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#9aa1a9", textTransform: "uppercase", letterSpacing: ".08em" }}>
              Property Details
            </span>
          </div>
          <Tabs tabs={leftTabs} variant="underline" size="sm" scrollable className="flex-1" />
        </div>

        {/* Right - map/diagram tabs */}
        <div style={{ flex: "0 0 calc(42% - 2px)", minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff" }}>
          <div style={{ padding: "6px 16px 0", borderBottom: "1.5px solid #eceef0", background: "#f8f9fb", flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#9aa1a9", textTransform: "uppercase", letterSpacing: ".08em" }}>
              Maps &amp; Diagrams
            </span>
          </div>
          <Tabs tabs={rightTabs} variant="underline" size="sm" scrollable className="flex-1" />
        </div>
      </div>
    </div>
  );
}
