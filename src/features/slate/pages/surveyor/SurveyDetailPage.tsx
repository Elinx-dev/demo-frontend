import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  CheckCircle2, ClipboardList, MapPin, ShieldCheck, AlertTriangle,
  Plus, Trash2, Ruler, Map, PenLine,
} from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { Button } from "@/ui/primitives/Button/Button";
import { Modal } from "@/ui/primitives/Modal/Modal";
import { Input } from "@/ui/primitives/Input/Input";
import { Select } from "@/ui/primitives/Select/Select";
import { Textarea } from "@/ui/primitives/Textarea/Textarea";
import Empty from "@/ui/primitives/Empty/Empty";
import { Alert } from "@/ui/primitives/Alert/Alert";
import { useToast } from "@/ui/feedback/toast/useToast";
import { ROUTES } from "@/navigation/routes";
import { slateApi } from "../../services/apiClient";
import PageHead from "../../components/PageHead";
import ParcelMap from "../../components/ParcelMap";
import StateBadge from "../../components/StateBadge";
import { PropertySplitView } from "../../components/PropertySplitView";
import { DlGrid, DlRow } from "../../components/DefinitionList";
import {
  buildSketchPolygon, buildGpsSketch, SketchSVG as SharedSketchSVG,
} from "../../components/PropertySplitView";
import type { SlateToken } from "../../types/slate.types";

// ─── constants ───────────────────────────────────────────────────────────────

const DIRECTION_OPTS = [
  { label: "North", value: "North" }, { label: "South", value: "South" },
  { label: "East", value: "East" },   { label: "West", value: "West" },
  { label: "Northeast", value: "Northeast" }, { label: "Northwest", value: "Northwest" },
  { label: "Southeast", value: "Southeast" }, { label: "Southwest", value: "Southwest" },
];
const AREA_UNITS = [
  { label: "Sq.ft", value: "Sq.ft" }, { label: "Sq.m", value: "Sq.m" },
  { label: "Acres", value: "Acres" }, { label: "Cents", value: "Cents" },
  { label: "Guntas", value: "Guntas" },
];
const MEAS_UNITS = [
  { label: "ft", value: "ft" }, { label: "m", value: "m" },
  { label: "chains", value: "chains" }, { label: "links", value: "links" },
];

type MeasRowState = { from: string; to: string; value: string; unit: string };
type Vertex = { lat: string; lng: string; latDir: "N" | "S"; lngDir: "E" | "W" };

const emptyMeasRow = (): MeasRowState => ({ from: "East", to: "West", value: "", unit: "ft" });
const emptyVertex = (): Vertex => ({ lat: "", lng: "", latDir: "N", lngDir: "E" });

function parseArea(text: string): number | null {
  const m = text.match(/[\d.]+/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  return Number.isNaN(n) ? null : n;
}

function resolvedLat(v: Vertex): number {
  const n = Math.abs(Number(v.lat));
  return v.latDir === "S" ? -n : n;
}
function resolvedLng(v: Vertex): number {
  const n = Math.abs(Number(v.lng));
  return v.lngDir === "W" ? -n : n;
}

function DirSelect({ value, opts, onChange }: { value: string; opts: string[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ padding: "4px 4px", borderRadius: 5, border: "1px solid #dde1e6", fontSize: 11, background: "#fff", cursor: "pointer", minWidth: 38 }}
    >
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

const SketchSVG = SharedSketchSVG;

// ─── Survey Form (full-modal, split) ─────────────────────────────────────────

function SurveyForm({ token, onSubmitted, hasPendingTxn }: { token: SlateToken; onSubmitted: () => void; hasPendingTxn: boolean }) {
  const toast = useToast();
  const navigate = useNavigate();

  // GPS
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  // Extended area
  const [extendedArea, setExtendedArea] = useState("");
  const [areaUnit, setAreaUnit] = useState("Sq.ft");
  // Measurements
  const [measurements, setMeasurements] = useState<MeasRowState[]>([emptyMeasRow()]);
  // Boundaries
  const [bNorth, setBNorth] = useState("");
  const [bSouth, setBSouth] = useState("");
  const [bEast, setBEast] = useState("");
  const [bWest, setBWest] = useState("");
  // Boundary polygon vertices
  const [vertices, setVertices] = useState<Vertex[]>([emptyVertex(), emptyVertex(), emptyVertex(), emptyVertex()]);
  // Notes
  const [notes, setNotes] = useState("");
  // UI
  const [formTab, setFormTab] = useState("gps");
  const [previewTab, setPreviewTab] = useState<"map" | "sketch">("map");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const surveyedArea = extendedArea ? `${extendedArea} ${areaUnit}` : "";
  const surveyAreaNum = parseArea(extendedArea);
  const tokenAreaNum = parseArea(token.physical.area);
  const conflictDetected = surveyAreaNum !== null && tokenAreaNum !== null &&
    Math.abs(surveyAreaNum - tokenAreaNum) / tokenAreaNum > 0.05;

  // Live GPS string for map
  const latNum = parseFloat(lat), lngNum = parseFloat(lng);
  const liveGps = lat && lng && !isNaN(latNum) && !isNaN(lngNum)
    ? `${latNum.toFixed(4)}° N, ${lngNum.toFixed(4)}° E`
    : token.location.gpsCentroid;

  // Vertex polygon for live map (from boundary polygon vertices)
  const vertexPolygon = useMemo((): [number, number][] | undefined => {
    const valid = vertices.filter((v) => v.lat.trim() && v.lng.trim() && !isNaN(Number(v.lat)) && !isNaN(Number(v.lng)));
    if (valid.length < 3) return undefined;
    return valid.map((v) => [resolvedLat(v), resolvedLng(v)]);
  }, [vertices]);

  // Live sketch from measurement rows
  const liveSketch = useMemo(() => {
    const rows = measurements.filter((m) => m.value.trim());
    if (rows.length < 3) return null;
    return buildSketchPolygon(rows.map((m) => ({ from: m.from, to: m.to, val: `${m.value} ${m.unit}` })), 300);
  }, [measurements]);

  // GPS polygon sketch - used when no measurement sketch exists
  const liveGpsSketch = useMemo(
    () => (vertexPolygon ? buildGpsSketch(vertexPolygon, 300) : null),
    [vertexPolygon],
  );

  // Measurement helpers
  const addMeas = () => setMeasurements((m) => [...m, emptyMeasRow()]);
  const removeMeas = (i: number) => setMeasurements((m) => m.length > 1 ? m.filter((_, idx) => idx !== i) : m);
  const setMeasField = (i: number, field: keyof MeasRowState, val: string) =>
    setMeasurements((m) => m.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  // Vertex helpers
  const setVertex = (idx: number, field: keyof Vertex, val: string) =>
    setVertices((vs) => { const next = [...vs]; next[idx] = { ...next[idx], [field]: val }; return next; });
  const addVertex = () => setVertices((vs) => [...vs, emptyVertex()]);
  const removeVertex = (idx: number) =>
    setVertices((vs) => vs.length > 3 ? vs.filter((_, i) => i !== idx) : vs);

  const handleSubmit = () => {
    if (!lat || !lng || isNaN(latNum) || isNaN(lngNum)) {
      setError("GPS coordinates are required."); return;
    }
    setSubmitting(true); setError("");
    const validRows = measurements
      .filter((r) => r.from && r.to && r.value.trim())
      .map((r) => ({ from: r.from, to: r.to, val: `${r.value} ${r.unit}` }));

    const boundaryParts = [
      bNorth && `N: ${bNorth}`, bSouth && `S: ${bSouth}`,
      bEast && `E: ${bEast}`, bWest && `W: ${bWest}`,
    ].filter(Boolean);

    const validVertices = vertices
      .filter((v) => v.lat.trim() && v.lng.trim() && !isNaN(Number(v.lat)) && !isNaN(Number(v.lng)))
      .map((v) => ({ lat: resolvedLat(v), lng: resolvedLng(v) }));

    slateApi.surveyor
      .submitVerification(token.ulpin, {
        lat: latNum, lng: lngNum,
        notes: [notes.trim(), ...boundaryParts].filter(Boolean).join(" | ") || undefined,
        measurements: validRows.length > 0 ? validRows : undefined,
        surveyedArea: surveyedArea.trim() || undefined,
        polygonVertices: validVertices.length >= 3 ? validVertices : undefined,
        conflict: conflictDetected,
        conflictDetails: conflictDetected
          ? `Surveyor recorded ${surveyedArea} vs token area ${token.physical.area}`
          : undefined,
      })
      .then(() => {
        conflictDetected
          ? toast.warning(`Conflict flagged for ${token.ulpin}. Routed to Citizen and Registration Officer.`)
          : toast.success(`Survey verified for ${token.ulpin} - forwarded to VAO Verification Queue.`);
        onSubmitted();
        navigate(ROUTES.PATHS.APP.SLATE.DASHBOARD);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not submit."))
      .finally(() => setSubmitting(false));
  };

  const TAB_BTN = (id: string): React.CSSProperties => ({
    padding: "7px 14px", fontSize: 12, fontWeight: formTab === id ? 700 : 500, cursor: "pointer",
    background: "none", border: "none", borderBottom: formTab === id ? "2px solid #0F2A4A" : "2px solid transparent",
    color: formTab === id ? "#0F2A4A" : "#9aa1a9", whiteSpace: "nowrap" as const, transition: "all 140ms",
  });

  const SEC: React.CSSProperties = { background: "#f5f7fa", borderRadius: 10, padding: "14px 16px" };

  return (
    <div style={{ display: "flex", height: "calc(90vh - 80px)", minHeight: 500, overflow: "hidden" }}>

      {/* ── LEFT: tabbed data entry ── */}
      <div style={{ flex: "0 0 46%", display: "flex", flexDirection: "column", borderRight: "1.5px solid #eceef0", overflow: "hidden" }}>
        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid #eceef0", flexShrink: 0, overflowX: "auto", padding: "0 4px" }}>
          {[
            { id: "gps", label: "GPS & Area" },
            { id: "measurements", label: "Measurements" },
            { id: "boundaries", label: "Boundaries" },
            { id: "poles", label: "Polygon" },
            { id: "notes", label: "Notes" },
          ].map((t) => (
            <button key={t.id} style={TAB_BTN(t.id)} onClick={() => setFormTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
          {error && <Alert type="error" message={error} dismissible={false} />}

          {/* GPS & Area */}
          {formTab === "gps" && (
            <>
              <div style={SEC}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0F2A4A", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <MapPin size={13} /> GPS Coordinates (On-Site)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Input label="Latitude" type="number" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="e.g. 12.9831" />
                  <Input label="Longitude" type="number" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="e.g. 80.2594" />
                </div>
                {lat && lng && !isNaN(latNum) && !isNaN(lngNum) && (
                  <div style={{ marginTop: 8, fontSize: 11, color: "#1C7A4E", display: "flex", alignItems: "center", gap: 5 }}>
                    <CheckCircle2 size={12} /> GPS valid - map preview updated
                  </div>
                )}
              </div>

              <div style={SEC}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0F2A4A", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <ClipboardList size={13} /> Extended Area
                </div>
                <div style={{ fontSize: 11, color: "#717881", marginBottom: 8 }}>Token record: <strong>{token.physical.area}</strong></div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="Measured extent"
                      type="number"
                      value={extendedArea}
                      onChange={(e) => setExtendedArea(e.target.value)}
                      placeholder="e.g. 2400"
                    />
                  </div>
                  <div style={{ width: 110, paddingBottom: 0 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: "#717881", marginBottom: 4 }}>Unit</div>
                    <Select value={areaUnit} onChange={(e) => setAreaUnit(e.target.value)} options={AREA_UNITS} />
                  </div>
                </div>
                {extendedArea && conflictDetected && (
                  <div style={{ marginTop: 8, display: "flex", gap: 8, padding: "9px 12px", borderRadius: 7, background: "#fdf0ee", border: "1px solid #f5c6cb" }}>
                    <AlertTriangle size={13} style={{ color: "#B0392F", flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 11.5, color: "#7c2d2d" }}>
                      <strong>Conflict:</strong> {surveyedArea} vs token record {token.physical.area} - more than 5% difference.
                    </div>
                  </div>
                )}
                {extendedArea && !conflictDetected && surveyAreaNum !== null && (
                  <div style={{ marginTop: 6, fontSize: 11, color: "#1C7A4E", display: "flex", alignItems: "center", gap: 5 }}>
                    <CheckCircle2 size={12} /> Area within 5% - will forward to Revenue Department.
                  </div>
                )}
              </div>
            </>
          )}

          {/* Measurements */}
          {formTab === "measurements" && (
            <div style={SEC}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0F2A4A", display: "flex", alignItems: "center", gap: 6 }}>
                  <Ruler size={13} /> Measurement Details
                </div>
                <button onClick={addMeas} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#0F2A4A", background: "#f0f4f8", border: "1px solid #dde1e6", borderRadius: 5, padding: "3px 8px", cursor: "pointer" }}>
                  <Plus size={11} /> Add
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 22px 1fr 90px 70px 22px", gap: "0 6px", marginBottom: 4 }}>
                {["From", "", "To", "Value", "Unit", ""].map((h, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 600, color: "#717881" }}>{h}</span>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {measurements.map((row, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 22px 1fr 90px 70px 22px", gap: "0 6px", alignItems: "flex-end" }}>
                    <Select value={row.from} onChange={(e) => setMeasField(i, "from", e.target.value)} options={DIRECTION_OPTS} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 8, fontSize: 11, color: "#9aa1a9" }}>→</div>
                    <Select value={row.to} onChange={(e) => setMeasField(i, "to", e.target.value)} options={DIRECTION_OPTS} />
                    <Input value={row.value} onChange={(e) => setMeasField(i, "value", e.target.value)} placeholder="45.5" />
                    <Select value={row.unit} onChange={(e) => setMeasField(i, "unit", e.target.value)} options={MEAS_UNITS} />
                    <button onClick={() => removeMeas(i)} disabled={measurements.length <= 1} style={{ background: "none", border: "none", cursor: measurements.length <= 1 ? "not-allowed" : "pointer", color: measurements.length <= 1 ? "#dee2e6" : "#e63946", padding: 3, display: "flex", alignItems: "center", paddingBottom: 10 }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
              {measurements.filter((m) => m.value.trim()).length >= 3 && (
                <div style={{ marginTop: 8, fontSize: 11, color: "#1C7A4E", display: "flex", alignItems: "center", gap: 5 }}>
                  <CheckCircle2 size={12} /> Sketch diagram updated in preview →
                </div>
              )}
            </div>
          )}

          {/* Boundaries */}
          {formTab === "boundaries" && (
            <div style={SEC}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0F2A4A", marginBottom: 10 }}>Boundary Description</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Input label="North boundary" value={bNorth} onChange={(e) => setBNorth(e.target.value)} placeholder="e.g. Road, Government Land…" />
                <Input label="South boundary" value={bSouth} onChange={(e) => setBSouth(e.target.value)} placeholder="e.g. Private land…" />
                <Input label="East boundary" value={bEast} onChange={(e) => setBEast(e.target.value)} placeholder="e.g. Canal, nallah…" />
                <Input label="West boundary" value={bWest} onChange={(e) => setBWest(e.target.value)} placeholder="e.g. Survey No. 44…" />
              </div>
            </div>
          )}

          {/* Pole Details */}
          {formTab === "poles" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Parcel Boundary Polygon */}
              <div style={SEC}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0F2A4A", display: "flex", alignItems: "center", gap: 6 }}>
                    <MapPin size={13} /> Parcel Boundary Polygon
                  </div>
                  <button onClick={addVertex} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#0F2A4A", background: "#f0f4f8", border: "1px solid #dde1e6", borderRadius: 5, padding: "3px 8px", cursor: "pointer" }}>
                    <Plus size={11} /> Add Point
                  </button>
                </div>
                <div style={{ fontSize: 11, color: "#717881", marginBottom: 8 }}>
                  Enter GPS coordinates for each boundary vertex in order (minimum 3). Map updates live.
                </div>
                {hasPendingTxn && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 7, padding: "8px 10px", borderRadius: 7, background: "#fff7e0", border: "1px solid #f0c060", marginBottom: 10 }}>
                    <AlertTriangle size={12} color="#B8722E" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 11, color: "#7a4a10", lineHeight: 1.5 }}>
                      <strong>Partition transaction:</strong> The polygon you define here represents the boundary of the <strong>portion being transferred to the buyer</strong>. This will become the new token's map boundary after Thasildar approval.
                    </span>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "22px 1fr 44px 1fr 44px 28px", gap: "5px 6px", alignItems: "center", marginBottom: 5 }}>
                  <span />
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: "#717881" }}>Latitude</span>
                  <span />
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: "#717881" }}>Longitude</span>
                  <span /><span />
                </div>
                {vertices.map((v, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "22px 1fr 44px 1fr 44px 28px", gap: "5px 6px", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 10.5, color: "#9aa1a9", textAlign: "right" as const, fontWeight: 600 }}>{i + 1}</span>
                    <input type="number" value={v.lat} onChange={(e) => setVertex(i, "lat", e.target.value)} placeholder="e.g. 12.983" step="0.0001" style={{ padding: "5px 7px", borderRadius: 5, border: "1px solid #dde1e6", fontSize: 11.5, fontFamily: "monospace", width: "100%", boxSizing: "border-box" as const }} />
                    <DirSelect value={v.latDir} opts={["N", "S"]} onChange={(val) => setVertex(i, "latDir", val)} />
                    <input type="number" value={v.lng} onChange={(e) => setVertex(i, "lng", e.target.value)} placeholder="e.g. 80.259" step="0.0001" style={{ padding: "5px 7px", borderRadius: 5, border: "1px solid #dde1e6", fontSize: 11.5, fontFamily: "monospace", width: "100%", boxSizing: "border-box" as const }} />
                    <DirSelect value={v.lngDir} opts={["E", "W"]} onChange={(val) => setVertex(i, "lngDir", val)} />
                    <button onClick={() => removeVertex(i)} disabled={vertices.length <= 3} style={{ background: "none", border: "none", cursor: vertices.length <= 3 ? "not-allowed" : "pointer", color: vertices.length <= 3 ? "#dee2e6" : "#e63946", padding: 3, display: "flex", alignItems: "center" }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {vertexPolygon && (
                  <div style={{ marginTop: 8, fontSize: 11, color: "#1C7A4E", background: "#f0f8f2", borderRadius: 5, padding: "5px 8px" }}>
                    <CheckCircle2 size={11} style={{ display: "inline", marginRight: 4 }} />
                    {vertexPolygon.length} vertices entered - polygon boundary shown on map
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Notes */}
          {formTab === "notes" && (
            <Textarea
              label="Site notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Encroachments, access notes, boundary marker condition, anomalies…"
              rows={6}
            />
          )}
        </div>

        {/* Submit footer */}
        <div style={{ flexShrink: 0, padding: "12px 18px", borderTop: "1px solid #eceef0", background: "#fafbfc" }}>
          <Button
            onClick={handleSubmit}
            disabled={!lat || !lng || submitting}
            fullWidth
            style={{ background: conflictDetected ? "#B0392F" : undefined }}
          >
            {conflictDetected
              ? <><AlertTriangle size={14} /> {submitting ? "Submitting…" : "Submit with Conflict Flag"}</>
              : <><CheckCircle2 size={14} /> {submitting ? "Submitting…" : "Submit Survey & Forward to VAO"}</>}
          </Button>
        </div>
      </div>

      {/* ── RIGHT: live map + diagram preview ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Preview tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid #eceef0", flexShrink: 0, padding: "0 16px" }}>
          {[{ id: "map" as const, label: "Map View", icon: <Map size={12} /> }, { id: "sketch" as const, label: "Sketch Diagram", icon: <PenLine size={12} /> }].map((t) => (
            <button key={t.id} onClick={() => setPreviewTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "9px 14px", fontSize: 12, fontWeight: previewTab === t.id ? 700 : 500, cursor: "pointer", background: "none", border: "none", borderBottom: previewTab === t.id ? "2px solid #0F2A4A" : "2px solid transparent", color: previewTab === t.id ? "#0F2A4A" : "#9aa1a9", transition: "all 140ms" }}>
              {t.icon} {t.label}
            </button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", paddingRight: 4 }}>
            <span style={{ fontSize: 10, color: "#b0b8c4", fontStyle: "italic" }}>Updates live as you type</span>
          </div>
        </div>

        {/* Preview content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
          {previewTab === "map" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <ParcelMap gps={liveGps} height={360} polygon={vertexPolygon} />
              {vertexPolygon && (
                <div style={{ fontSize: 11, color: "#1C7A4E" }}>
                  Boundary polygon: {vertexPolygon.length} vertices plotted
                </div>
              )}
            </div>
          )}

          {previewTab === "sketch" && (() => {
            const activeSketch = liveSketch ?? liveGpsSketch;
            const sketchLabel = liveSketch
              ? "Based on entered measurements"
              : liveGpsSketch
              ? `GPS polygon - ${vertexPolygon!.length} vertices`
              : "Enter 3+ measurements or polygon vertices";
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: "#fff", border: "1.5px solid #c8d0d8", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ borderBottom: "1px solid #e0e4e8", padding: "7px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "#545c66", textTransform: "uppercase" as const, letterSpacing: ".05em" }}>Parcel Sketch - {token.ulpin}</span>
                    <span style={{ fontSize: 10, color: activeSketch ? "#1C7A4E" : "#9aa1a9" }}>{sketchLabel}</span>
                  </div>
                  <div style={{ padding: 14, background: "#fefefe", display: "flex", justifyContent: "center" }}>
                    <SketchSVG sketch={activeSketch} svgSize={300} />
                  </div>
                </div>
                {!activeSketch && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "#fff7e0", border: "1px solid #f0c060" }}>
                    <AlertTriangle size={13} color="#B8722E" />
                    <span style={{ fontSize: 11.5, color: "#B8722E" }}>Add at least 3 measurements (Measurements tab) or 3 GPS vertices (Polygon tab) to generate a live sketch.</span>
                  </div>
                )}
                {liveGpsSketch && !liveSketch && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "#f0f9f4", border: "1px solid #a5d4bb" }}>
                    <ShieldCheck size={13} color="#1C7A4E" />
                    <span style={{ fontSize: 11.5, color: "#1C7A4E" }}>Showing GPS boundary polygon. Add measurements for an edge-length labelled sketch.</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ─── Main page (split layout via PropertySplitView) ───────────────────────────

export default function SurveyDetailPage() {
  const { ulpin } = useParams<{ ulpin: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // When navigated from Transaction Queue or Site Visit Plan (joint check-in), always allow data entry.
  const hasPendingTxn = !!(location.state as { hasPendingTxn?: boolean } | null)?.hasPendingTxn;

  const [token, setToken] = useState<SlateToken | null | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(hasPendingTxn);

  useEffect(() => {
    if (!ulpin) return;
    slateApi.citizen.getPropertyDetail(ulpin).then(setToken).catch(() => setToken(null));
  }, [ulpin]);

  if (token === undefined) return <div style={{ fontSize: 12.5, color: "#9aa1a9", padding: "20px 0" }}>Loading…</div>;
  if (!token) return <Empty variant="no-data" title="Parcel not found" description="This ULPIN doesn't exist in your jurisdiction." />;

  const alreadyVerified = !!token.survey && !token.surveyPending;
  // For transaction-driven visits, always allow data entry even if the property has prior survey data.
  const canSubmitSurvey = hasPendingTxn || !alreadyVerified;

  // Survey Result as extra tab for PropertySplitView
  const surveyResultTab = token.survey ? [{
    id: "survey_result",
    label: "Survey Result",
    icon: <ShieldCheck size={13} />,
    content: (
      <Card>
        {token.survey.conflict?.flag
          ? <Alert type="error" title="Survey area conflict" message={`Surveyor recorded ${token.survey.conflict.reportedArea}, token record shows ${token.survey.conflict.tokenArea}.`} dismissible={false} />
          : <Alert type="success" title="Site verified" message={`Verified by ${token.survey.verifiedBy} on ${token.survey.verifiedAt}.`} dismissible={false} />}
        <div style={{ marginTop: 14 }}>
          <DlGrid>
            <DlRow label="Verified by" value={token.survey.verifiedBy} />
            <DlRow label="Verified on" value={token.survey.verifiedAt} />
            <DlRow label="Latitude" value={token.survey.lat.toFixed(5)} />
            <DlRow label="Longitude" value={token.survey.lng.toFixed(5)} />
            {token.survey.surveyedArea && <DlRow label="Extended area" value={token.survey.surveyedArea} />}
            {token.survey.notes && <DlRow label="Site notes" full value={token.survey.notes} />}
          </DlGrid>
        </div>
      </Card>
    ),
  }] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Page header */}
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="Visit Data Entry"
          title={<span style={{ fontFamily: "monospace" }}>{token.ulpin}</span>}
          sub={`${token.location.village}, ${token.location.taluk}, ${token.location.district}`}
          actions={
            <div className="flex items-center gap-2">
              <StateBadge state={token.state} />
              {canSubmitSurvey && (
                <Button onClick={() => setFormOpen(true)}>
                  <ShieldCheck size={14} /> Submit Survey Entry
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate(-1)}>← Back</Button>
            </div>
          }
        />
      </div>

      {/* Status banners */}
      <div style={{ flexShrink: 0, padding: "0 0 12px" }}>
        {hasPendingTxn && alreadyVerified
          ? <Alert type="warning" title="Survey data entry required for this transaction" message={`This property was previously surveyed (by ${token.survey?.verifiedBy}). Submit new field measurements for the current transaction to forward it to the VAO Verification Queue.`} dismissible={false} />
          : alreadyVerified
          ? token.survey?.conflict?.flag
            ? <Alert type="error" title="Conflict recorded" message={`Surveyed: ${token.survey.conflict.reportedArea} · Token record: ${token.survey.conflict.tokenArea}. Routed for re-verification.`} dismissible={false} />
            : <Alert type="success" title="Survey already verified" message={`Verified by ${token.survey?.verifiedBy} on ${token.survey?.verifiedAt}.`} dismissible={false} />
          : token.surveyPending
          ? <Alert type="warning" title="Survey verification pending" message="Click 'Submit Survey Entry' to record GPS coordinates and boundary measurements." dismissible={false} />
          : null}
      </div>

      {/* Split body - uses PropertySplitView for consistent Chain of Title, Audit, FMB */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
        <PropertySplitView token={token} accentColor="#1d4670" extraLeftTabs={surveyResultTab} />
      </div>

      {/* Survey form modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        size="5xl"
        title="Survey Verification Form"
      >
        <SurveyForm token={token} onSubmitted={() => setFormOpen(false)} hasPendingTxn={hasPendingTxn} />
      </Modal>
    </div>
  );
}
