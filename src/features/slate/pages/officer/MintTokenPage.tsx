import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2, Stamp, FileStack, MapPin, ShieldCheck, ShieldAlert,
  Loader2, Plus, Trash2, History, GitMerge, Scissors, User, ArrowRight, Ruler,
} from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { Button } from "@/ui/primitives/Button/Button";
import { Input } from "@/ui/primitives/Input/Input";
import { Select } from "@/ui/primitives/Select/Select";
import { Tabs } from "@/ui/primitives/Tabs/Tabs";
import Empty from "@/ui/primitives/Empty/Empty";
import { Alert } from "@/ui/primitives/Alert/Alert";
import { useToast } from "@/ui/feedback/toast/useToast";
import { useSlateStore } from "../../state/SlateProvider";
import { slateApi } from "../../services/apiClient";
import PageHead from "../../components/PageHead";
import ParcelMap from "../../components/ParcelMap";
import { DlGrid, DlRow } from "../../components/DefinitionList";
import { inr } from "../../utils/format";
import type { SlateToken } from "../../types/slate.types";

// ─── Polygon vertex type ────────────────────────────────────────────────────
type Vertex = { lat: string; lng: string; latDir: "N" | "S"; lngDir: "E" | "W" };

function resolvedLat(v: Vertex): number {
  const n = Math.abs(Number(v.lat));
  return v.latDir === "S" ? -n : n;
}
function resolvedLng(v: Vertex): number {
  const n = Math.abs(Number(v.lng));
  return v.lngDir === "W" ? -n : n;
}

function centroidFromVertices(vs: Vertex[]): { lat: number; lng: number } | null {
  const valid = vs.filter((v) => v.lat.trim() && v.lng.trim() && !isNaN(Number(v.lat)) && !isNaN(Number(v.lng)));
  if (valid.length < 3) return null;
  const lat = valid.reduce((s, v) => s + resolvedLat(v), 0) / valid.length;
  const lng = valid.reduce((s, v) => s + resolvedLng(v), 0) / valid.length;
  return { lat, lng };
}

function polygonAsLeaflet(vs: Vertex[]): [number, number][] | undefined {
  const valid = vs.filter((v) => v.lat.trim() && v.lng.trim() && !isNaN(Number(v.lat)) && !isNaN(Number(v.lng)));
  if (valid.length < 3) return undefined;
  return valid.map((v) => [resolvedLat(v), resolvedLng(v)]);
}

function centroidGpsString(vs: Vertex[]): string {
  const c = centroidFromVertices(vs);
  if (!c) return "";
  return `${Math.abs(c.lat).toFixed(6)}° ${c.lat >= 0 ? "N" : "S"}, ${Math.abs(c.lng).toFixed(6)}° ${c.lng >= 0 ? "E" : "W"}`;
}

// ─── Empty mint form ────────────────────────────────────────────────────────
function emptyVertex(): Vertex {
  return { lat: "", lng: "", latDir: "N", lngDir: "E" };
}

function emptyForm() {
  return {
    ulpin: "",
    owner: "",
    ownerAadhaar: "",
    // Section 1A - Property Classification
    propertyType: "",
    natureOfTitle: "",
    // Section 1B - Jurisdiction & Location
    registrationDistrict: "",
    sroId: "",
    taluk: "",
    village: "",
    landType: "",
    wardNo: "",
    street: "",
    // Section 1C - Parcel Details
    survey: "",
    subDivision: "",
    area: "",
    areaUnit: "",
    guidelineValue: "",
    // Boundary polygon
    vertices: [emptyVertex(), emptyVertex(), emptyVertex(), emptyVertex()] as Vertex[],
    boundaryNorth: "",
    boundarySouth: "",
    boundaryEast: "",
    boundaryWest: "",
    fmbRef: "",
  };
}

// ─── Operation colour coding ─────────────────────────────────────────────────
const OP_COLOR: Record<string, string> = {
  MINT: "#1C7A4E", TRANSFER: "#4361ee", LOCK: "#f77f00", UNLOCK: "#06d6a0",
  FLAG: "#e63946", RETIRE: "#6c757d", SPLIT: "#8338ec", MERGE: "#0077b6",
};

type AadhaarStatus = "idle" | "checking" | "verified" | "not_found";

// ─── Split form type ─────────────────────────────────────────────────────────
function emptySplit(parentUlpin: string) {
  return {
    childA: { ulpin: `${parentUlpin}-A`, owner: "", ownerAadhaar: "", area: "", sharePercent: "50" },
    childB: { ulpin: `${parentUlpin}-B`, owner: "", ownerAadhaar: "", area: "", sharePercent: "50" },
  };
}

// ─── Legacy ownership / chain of title record ─────────────────────────────────
type LegacyOwnerRecord = {
  ownerName: string;
  ownerAadhaar: string;
  fromDate: string;
  toDate: string;
  acquisitionType: string;
  transactionDate: string;
  natureOfTransaction: string;
  executorSeller: string;
  claimantPurchaser: string;
  documentType: string;
  registrationRefNo: string;
  stampDuty: string;
  surveyNo: string;
  dateOfDeath: string;
  legalHeirs: string;
};

function emptyLegacyRecord(first = false): LegacyOwnerRecord {
  return {
    ownerName: "", ownerAadhaar: "", fromDate: "", toDate: "",
    acquisitionType: first ? "Original Pattadar" : "Purchased",
    transactionDate: "", natureOfTransaction: "",
    executorSeller: "", claimantPurchaser: "",
    documentType: "Original", registrationRefNo: "",
    stampDuty: "", surveyNo: "", dateOfDeath: "", legalHeirs: "",
  };
}

// ─── Master data types ────────────────────────────────────────────────────────
type MasterOption = { label: string; value: string };
type Jurisdiction = { id: string; jurisdictionId: string; level: string; name: string; parentId: string | null };

// ─── Section styling helpers ──────────────────────────────────────────────────
const SEC = { padding: "12px 14px", borderRadius: 9, border: "1px solid #eceef0", background: "#fafbfc" } as const;
const SEC_TITLE = { fontSize: 12, fontWeight: 700, color: "#0F2A4A", marginBottom: 10 } as const;

// ─── Measurement direction options ────────────────────────────────────────────
const DIRECTION_OPTS = [
  { label: "Select…", value: "" },
  { label: "North", value: "North" },
  { label: "South", value: "South" },
  { label: "East", value: "East" },
  { label: "West", value: "West" },
  { label: "Northeast", value: "Northeast" },
  { label: "Northwest", value: "Northwest" },
  { label: "Southeast", value: "Southeast" },
  { label: "Southwest", value: "Southwest" },
];

// ─── Boundary description options ─────────────────────────────────────────────
const BOUNDARY_OPTS = [
  { label: "Select boundary type…", value: "" },
  { label: "Road", value: "Road" },
  { label: "Government Land", value: "Government Land" },
  { label: "Adjacent Property", value: "Adjacent Property" },
  { label: "River / Canal", value: "River / Canal" },
  { label: "Residential Building", value: "Residential Building" },
  { label: "Agricultural Land", value: "Agricultural Land" },
  { label: "Common Wall", value: "Common Wall" },
  { label: "Others", value: "Others" },
];

// ─── Inline direction select ──────────────────────────────────────────────────
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

// ─── Token history types ────────────────────────────────────────────────────
type HistoryEvent = {
  txnId: string; ulpin: string; timestamp: string; operation: string;
  actorRole: string; preState: string | null; postState: string; detail: string;
};
type TokenHistoryResult = {
  token: SlateToken & { splitParent?: string; splitChildren?: string[] };
  events: HistoryEvent[];
};

export default function MintTokenPage() {
  const { can, session } = useSlateStore();
  const toast = useToast();
  const isSurveyor = session?.liveIdentity?.roleCode === "SURVEYOR";

  // ── Master data ─────────────────────────────────────────────────────────────
  const [propertyTypes, setPropertyTypes] = useState<MasterOption[]>([]);
  const [natureOfTitleOpts, setNatureOfTitleOpts] = useState<MasterOption[]>([]);
  const [landTypes, setLandTypes] = useState<MasterOption[]>([]);
  const [classificationTypes, setClassificationTypes] = useState<MasterOption[]>([]);
  const [chainOfTitleNatures, setChainOfTitleNatures] = useState<MasterOption[]>([]);
  const [sroList, setSroList] = useState<MasterOption[]>([]);
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [derivedDistrictId, setDerivedDistrictId] = useState<string>("");

  useEffect(() => {
    Promise.all([
      slateApi.masters.getPropertyTypes(),
      slateApi.masters.getNatureOfTitle(),
      slateApi.masters.getLandTypes(),
      slateApi.masters.getClassificationTypes(),
      slateApi.masters.getChainOfTitleNatures(),
      slateApi.masters.getSROList(),
      slateApi.masters.getJurisdictions(),
    ]).then(([pt, not, lt, ct, cot, sro, jurs]) => {
      const toOpt = (d: { code: string; label: string }) => ({ label: d.label, value: d.code });
      setPropertyTypes(pt.map(toOpt));
      setNatureOfTitleOpts(not.map(toOpt));
      setLandTypes(lt.map(toOpt));
      setClassificationTypes(ct.map(toOpt));
      setChainOfTitleNatures(cot.map(toOpt));
      setSroList(sro.map((j: { id?: string | number; jurisdictionId?: string; code?: string; name?: string; label?: string }) => ({
        label: j.name || j.label || j.code || "",
        value: j.jurisdictionId || String(j.id ?? "") || "",
      })));
      setJurisdictions(jurs);
    }).catch(() => {});
  }, []);

  // ── Mint form state ──────────────────────────────────────────────────────
  const [form, setForm] = useState(emptyForm);
  const [mintedUlpin, setMintedUlpin] = useState<string | null>(null);
  const [mintStep, setMintStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [mintError, setMintError] = useState("");
  const [aadhaarStatus, setAadhaarStatus] = useState<AadhaarStatus>("idle");
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);
  const [activateError, setActivateError] = useState("");

  // ── History tab state ────────────────────────────────────────────────────
  const [histUlpin, setHistUlpin] = useState("");
  const [histLoading, setHistLoading] = useState(false);
  const [histResult, setHistResult] = useState<TokenHistoryResult | null>(null);
  const [histError, setHistError] = useState("");

  // ── Measurement rows ────────────────────────────────────────────────────
  type MeasurementRow = { from: string; to: string; val: string };
  const emptyMeasRow = (): MeasurementRow => ({ from: "", to: "", val: "" });
  const [measurements, setMeasurements] = useState<MeasurementRow[]>([{ from: "East", to: "West", val: "" }]);
  const addMeasurement = () => setMeasurements((m) => [...m, emptyMeasRow()]);
  const removeMeasurement = (i: number) => setMeasurements((m) => m.length > 1 ? m.filter((_, idx) => idx !== i) : m);
  const setMeasurementField = (i: number, field: keyof MeasurementRow, val: string) =>
    setMeasurements((m) => m.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  // ── Legacy ownership history (in Mint tab) ──────────────────────────────
  const [legacyHistory, setLegacyHistory] = useState<LegacyOwnerRecord[]>([emptyLegacyRecord(true)]);

  const legacyContainerRef = useRef<HTMLDivElement>(null);
  const addLegacyRecord = () => {
    setLegacyHistory((h) => [...h, emptyLegacyRecord(false)]);
    setTimeout(() => {
      legacyContainerRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };
  const removeLegacyRecord = (idx: number) => setLegacyHistory((h) => h.length > 1 ? h.filter((_, i) => i !== idx) : h);
  const setLegacyField = (idx: number, field: keyof LegacyOwnerRecord, val: string) =>
    setLegacyHistory((h) => h.map((r, i) => i === idx ? { ...r, [field]: val } : r));

  // ── FMB diagram preview (right panel) ──────────────────────────────────────
  const [fmbPreviewImage, setFmbPreviewImage] = useState<string | null>(null);
  const [fmbPreviewLoading, setFmbPreviewLoading] = useState(false);
  const fmbLookupRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Split state ─────────────────────────────────────────────────────────────
  const [showSplit, setShowSplit] = useState(false);
  const [splitForm, setSplitForm] = useState(() => emptySplit(""));
  const [splitBusy, setSplitBusy] = useState(false);
  const [splitError, setSplitError] = useState("");

  // ── SRO → district/taluk/village derivation ──────────────────────────────
  useEffect(() => {
    if (!form.sroId || jurisdictions.length === 0) {
      setDerivedDistrictId("");
      return;
    }
    const sro = jurisdictions.find((j) => j.id === form.sroId || j.jurisdictionId === form.sroId);
    if (!sro) return;
    const parent = jurisdictions.find((j) => j.jurisdictionId === sro.parentId);
    if (!parent) return;
    if (parent.level === "taluk") {
      const district = jurisdictions.find((j) => j.jurisdictionId === parent.parentId);
      setForm((f) => ({ ...f, registrationDistrict: district?.name ?? "", taluk: "", village: "" }));
      setDerivedDistrictId(district?.jurisdictionId ?? "");
    } else if (parent.level === "district") {
      setForm((f) => ({ ...f, registrationDistrict: parent.name, taluk: "", village: "" }));
      setDerivedDistrictId(parent.jurisdictionId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.sroId, jurisdictions]);

  if (!can("tokens.mint")) {
    return <Empty variant="no-permission" title="No access to mint tokens" description="Your role doesn't carry the Mint Token permission." />;
  }

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const gpsString = centroidGpsString(form.vertices);
  const leafletPolygon = polygonAsLeaflet(form.vertices);

  // Aadhaar auto-lookup
  const lookupRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (form.ownerAadhaar.length !== 12) { setAadhaarStatus("idle"); return; }
    if (lookupRef.current) clearTimeout(lookupRef.current);
    setAadhaarStatus("checking");
    lookupRef.current = setTimeout(() => {
      slateApi.officer.lookupAadhaar(form.ownerAadhaar)
        .then((match) => { setForm((f) => ({ ...f, owner: match.name })); setAadhaarStatus("verified"); })
        .catch(() => setAadhaarStatus("not_found"));
    }, 600);
    return () => { if (lookupRef.current) clearTimeout(lookupRef.current); };
  }, [form.ownerAadhaar]);

  // FMB preview fetch (debounced)
  useEffect(() => {
    if (!form.fmbRef.trim()) { setFmbPreviewImage(null); setFmbPreviewLoading(false); return; }
    if (fmbLookupRef.current) clearTimeout(fmbLookupRef.current);
    setFmbPreviewLoading(true);
    fmbLookupRef.current = setTimeout(() => {
      slateApi.fmb.getImage(form.fmbRef.trim())
        .then((res) => setFmbPreviewImage(res.imageData))
        .catch(() => setFmbPreviewImage(null))
        .finally(() => setFmbPreviewLoading(false));
    }, 700);
    return () => { if (fmbLookupRef.current) clearTimeout(fmbLookupRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.fmbRef]);

  // Vertex helpers
  const setVertex = (idx: number, field: keyof Vertex, val: string) =>
    setForm((f) => { const verts = [...f.vertices]; verts[idx] = { ...verts[idx], [field]: val }; return { ...f, vertices: verts }; });
  const addVertex = () => setForm((f) => ({ ...f, vertices: [...f.vertices, emptyVertex()] }));
  const removeVertex = (idx: number) =>
    setForm((f) => ({ ...f, vertices: f.vertices.length > 3 ? f.vertices.filter((_, i) => i !== idx) : f.vertices }));

  // Mint
  const handleMint = async () => {
    setSubmitting(true);
    setMintError("");
    const polygonVertices = (leafletPolygon ?? []).map(([lat, lng]) => ({ lat, lng }));
    try {
      const filledLegacy = legacyHistory.filter((r) => r.ownerName.trim());
      const token = await slateApi.officer.mintToken({
        ulpin: form.ulpin || undefined,
        owner: form.owner,
        ownerAadhaar: form.ownerAadhaar || undefined,
        propertyType: form.propertyType || undefined,
        natureOfTitle: form.natureOfTitle || undefined,
        area: form.area || undefined,
        areaUnit: form.areaUnit || undefined,
        registrationDistrict: form.registrationDistrict || undefined,
        sroId: form.sroId || undefined,
        taluk: form.taluk || undefined,
        village: form.village || undefined,
        landType: form.landType || undefined,
        wardNo: form.wardNo || undefined,
        street: form.street || undefined,
        survey: form.survey || undefined,
        subDivision: form.subDivision || undefined,
        gps: gpsString || undefined,
        polygonVertices: polygonVertices.length >= 3 ? polygonVertices : undefined,
        guidelineValue: Number(form.guidelineValue) || undefined,
        fmbRef: form.fmbRef || undefined,
        legacyOwnershipHistory: filledLegacy.length > 0 ? filledLegacy.map((r) => ({
          ownerName: r.ownerName,
          ownerAadhaar: r.ownerAadhaar || undefined,
          fromDate: r.fromDate || undefined,
          toDate: r.toDate || undefined,
          acquisitionType: r.acquisitionType,
          transactionDate: r.transactionDate || undefined,
          natureOfTransaction: r.natureOfTransaction || undefined,
          executorSeller: r.executorSeller || undefined,
          claimantPurchaser: r.claimantPurchaser || undefined,
          documentType: r.documentType || undefined,
          registrationRefNo: r.registrationRefNo || undefined,
          stampDuty: r.stampDuty || undefined,
          surveyNo: r.surveyNo || undefined,
          dateOfDeath: r.dateOfDeath || undefined,
          legalHeirs: r.legalHeirs || undefined,
        })) : undefined,
      });
      setMintedUlpin(token.ulpin);
      // Auto-activate immediately - no manual step needed
      slateApi.officer.verifyAndActivate(token.ulpin).catch(() => undefined);
      toast.success(`Token ${token.ulpin} minted and activated.`);
    } catch (err) {
      setMintError(err instanceof Error ? err.message : "Could not mint this token.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(emptyForm());
    setMintedUlpin(null);
    setAadhaarStatus("idle");
    setMintStep(0);
    setActivated(false);
    setActivateError("");
    setLegacyHistory([emptyLegacyRecord(true)]);
    setMeasurements([{ from: "East", to: "West", val: "" }]);
    setFmbPreviewImage(null);
    setFmbPreviewLoading(false);
  };

  const handleActivate = async () => {
    if (!mintedUlpin) return;
    setActivating(true);
    setActivateError("");
    try {
      await slateApi.officer.verifyAndActivate(mintedUlpin);
      setActivated(true);
      toast.success(`Token ${mintedUlpin} field-verified and Active.`);
    } catch (err) {
      setActivateError(err instanceof Error ? err.message : "Could not activate.");
    } finally {
      setActivating(false);
    }
  };

  // History lookup
  const handleHistLookup = async () => {
    if (!histUlpin.trim()) return;
    setHistLoading(true);
    setHistError("");
    setHistResult(null);
    setShowSplit(false);
    try {
      const result = await slateApi.officer.getTokenHistory(histUlpin.trim());
      setHistResult(result as TokenHistoryResult);
      setSplitForm(emptySplit(histUlpin.trim()));
    } catch (err) {
      setHistError(err instanceof Error ? err.message : "Token not found.");
    } finally {
      setHistLoading(false);
    }
  };

  // Split token
  const handleSplit = async () => {
    if (!histResult) return;
    setSplitBusy(true);
    setSplitError("");
    try {
      await slateApi.officer.splitToken(histResult.token.ulpin, splitForm.childA, splitForm.childB);
      toast.success(`Token ${histResult.token.ulpin} split into ${splitForm.childA.ulpin} and ${splitForm.childB.ulpin}.`);
      setShowSplit(false);
      handleHistLookup();
    } catch (err) {
      setSplitError(err instanceof Error ? err.message : "Split failed.");
    } finally {
      setSplitBusy(false);
    }
  };

  const setSplitChild = (child: "childA" | "childB", field: string, val: string) =>
    setSplitForm((f) => ({ ...f, [child]: { ...f[child], [field]: val } }));

  // ── Jurisdiction-derived location options ─────────────────────────────────
  const talukOptions: MasterOption[] = derivedDistrictId
    ? jurisdictions.filter((j) => j.level === "taluk" && j.parentId === derivedDistrictId).map((j) => ({ label: j.name, value: j.name }))
    : [];
  const selectedTalukJurId = form.taluk
    ? (jurisdictions.find((j) => j.level === "taluk" && j.name === form.taluk)?.jurisdictionId ?? "")
    : "";
  const villageOptions: MasterOption[] = selectedTalukJurId
    ? jurisdictions.filter((j) => j.level === "village" && j.parentId === selectedTalukJurId).map((j) => ({ label: j.name, value: j.name }))
    : [];

  // ── Master data select options with empty placeholder ─────────────────────
  const withEmpty = (opts: MasterOption[], placeholder = "Select…") =>
    [{ label: placeholder, value: "" }, ...opts];

  // ── Stepper config ────────────────────────────────────────────────────────
  const mintSteps = [
    { id: "owner", label: "Owner & Identity" },
    { id: "classification", label: "Classification" },
    { id: "location", label: "Location" },
    { id: "survey", label: "Measurements" },
    { id: "history", label: "Chain of Title" },
    { id: "review", label: "Review & Mint" },
  ];
  const totalMintSteps = mintSteps.length;
  const currentStepId = mintSteps[mintStep]?.id ?? "owner";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="Registration Officer Portal"
          title="Mint Token"
          sub="Create a new land parcel token or view the full ownership history for an existing token."
        />
      </div>

      <div className="grid gap-4 flex-1" style={{ gridTemplateColumns: "1fr 380px", gridAutoRows: "1fr", minHeight: 0 }}>
        {/* Left panel - Tabs */}
        <Card style={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          {mintedUlpin ? (
            <div className="flex flex-col gap-3 items-center text-center" style={{ padding: "10px 0" }}>
              <CheckCircle2 size={36} style={{ color: "#1C7A4E" }} />
              <div style={{ fontSize: 15, fontWeight: 700 }}>Token minted</div>
              <div style={{ fontSize: 13, fontFamily: "monospace", color: "#0F2A4A" }}>{mintedUlpin}</div>
              {activateError && <Alert type="error" message={activateError} dismissible={false} />}
              <div style={{ fontSize: 12.5, color: "#1C7A4E", fontWeight: 600 }}>Status: Active, ready for transactions.</div>
              <Button variant="outline" onClick={handleReset}>Mint another token</Button>
            </div>
          ) : (
            <Tabs
              className="flex-1 min-h-0"
              variant="underline"
              tabs={[
                {
                  id: "mint",
                  label: "Mint Token",
                  icon: <Stamp size={14} />,
                  content: (
                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                      {/* ── Stepper header (sticky) ── */}
                      <div style={{ flexShrink: 0, paddingBottom: 10, borderBottom: "1px solid #eceef0", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", padding: "0 0 2px" }}>
                        {mintSteps.map((step, idx) => (
                          <div key={step.id} style={{ display: "flex", alignItems: "center", flex: idx < mintSteps.length - 1 ? 1 : 0 }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                              <div style={{
                                width: 26, height: 26, borderRadius: "50%",
                                background: idx < mintStep ? "#1C7A4E" : idx === mintStep ? "#0F2A4A" : "#eceef0",
                                color: idx <= mintStep ? "#fff" : "#9aa1a9",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 10.5, fontWeight: 700, flexShrink: 0,
                                cursor: idx < mintStep ? "pointer" : "default",
                              }} onClick={() => { if (idx < mintStep) setMintStep(idx); }}>
                                {idx < mintStep ? "✓" : idx + 1}
                              </div>
                              <div style={{ fontSize: 9.5, fontWeight: 600, marginTop: 3, textAlign: "center", whiteSpace: "nowrap", color: idx === mintStep ? "#0F2A4A" : idx < mintStep ? "#1C7A4E" : "#9aa1a9" }}>
                                {step.label}
                              </div>
                            </div>
                            {idx < mintSteps.length - 1 && (
                              <div style={{ flex: 1, height: 2, background: idx < mintStep ? "#1C7A4E" : "#eceef0", margin: "0 5px", marginBottom: 16 }} />
                            )}
                          </div>
                        ))}
                      </div>
                      </div>{/* end stepper header */}

                      {/* ── Scrollable step content ── */}
                      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>

                      {/* Step 1 - Owner & Parcel Identity */}
                      {currentStepId === "owner" && (
                      <div style={SEC}>
                        <div style={SEC_TITLE}>Owner & Parcel Identity</div>
                        <div className="flex flex-col gap-3">
                          <Input label="ULPIN (leave blank to auto-generate)" value={form.ulpin} onChange={(e) => set({ ulpin: e.target.value })} placeholder="e.g. TN-CGL-045-002-A" />
                          <Input
                            label="Owner Aadhaar"
                            value={form.ownerAadhaar}
                            onChange={(e) => { set({ ownerAadhaar: e.target.value.replace(/\D/g, "").slice(0, 12) }); if (aadhaarStatus === "verified") set({ owner: "" }); }}
                            placeholder="12-digit Aadhaar (auto-fetches name)"
                            maxLength={12}
                            endAdornment={
                              aadhaarStatus === "checking" ? <Loader2 size={14} className="animate-spin" style={{ color: "#9aa1a9" }} /> :
                              aadhaarStatus === "verified" ? <ShieldCheck size={14} style={{ color: "#1C7A4E" }} /> :
                              aadhaarStatus === "not_found" ? <ShieldAlert size={14} style={{ color: "#B8722E" }} /> : undefined
                            }
                          />
                          <Input
                            label="Owner name"
                            value={form.owner}
                            onChange={(e) => set({ owner: e.target.value })}
                            readOnly={aadhaarStatus === "verified"}
                            placeholder="Name (fetched from Aadhaar if matched)"
                          />
                          <div style={{ padding: "10px 12px", borderRadius: 7, border: "1px solid #dde1e6", background: "#fff" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#717881", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Survey & Valuation</div>
                            <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                              <Input label="Survey No." value={form.survey} onChange={(e) => set({ survey: e.target.value })} placeholder="e.g. 123/4A" />
                              <Input label="Sub-Division" value={form.subDivision} onChange={(e) => set({ subDivision: e.target.value })} placeholder="e.g. B" />
                              <Input label="Guideline Value (Rs.)" type="number" value={form.guidelineValue} onChange={(e) => set({ guidelineValue: e.target.value })} helperText="Set by IGRS / District Registrar" />
                            </div>
                          </div>
                        </div>
                      </div>
                      )}

                      {/* Step 2 - Property Classification */}
                      {currentStepId === "classification" && (
                      <div style={SEC}>
                        <div style={SEC_TITLE}>Property Classification</div>
                        <div className="flex flex-col gap-3">
                          <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                            <Select label="Property Type" value={form.propertyType} onChange={(e) => set({ propertyType: e.target.value })} options={withEmpty(propertyTypes, "Select property type")} />
                            <Select label="Nature of Title" value={form.natureOfTitle} onChange={(e) => set({ natureOfTitle: e.target.value })} options={withEmpty(natureOfTitleOpts, "Select nature of title")} />
                          </div>
                          <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                            <Input label="Extent" value={form.area} onChange={(e) => set({ area: e.target.value })} placeholder="e.g. 1.00" />
                            <Select
                              label="Area Unit"
                              value={form.areaUnit}
                              onChange={(e) => set({ areaUnit: e.target.value })}
                              options={[
                                { label: "Select unit…", value: "" },
                                { label: "Sq.ft", value: "Sq.ft" },
                                { label: "Sq.mt", value: "Sq.mt" },
                                { label: "Acres", value: "Acres" },
                                { label: "Cents", value: "Cents" },
                                { label: "Grounds", value: "Grounds" },
                                { label: "Kanis", value: "Kanis" },
                                { label: "Hectares", value: "Hectares" },
                                { label: "Sq.yards", value: "Sq.yards" },
                              ]}
                            />
                          </div>
                        </div>
                      </div>
                      )}

                      {/* Step 3 - Jurisdiction & Location */}
                      {currentStepId === "location" && (
                      <div style={SEC}>
                        <div style={SEC_TITLE}>Jurisdiction & Location</div>
                        <div className="flex flex-col gap-3">
                          <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                            <Select label="Sub-Registrar Office (SRO)" value={form.sroId} onChange={(e) => set({ sroId: e.target.value })} options={withEmpty(sroList, "Select SRO")} />
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: "#717881", marginBottom: 4 }}>Registration District</div>
                              <div style={{ padding: "8px 10px", borderRadius: 7, border: "1px solid #eceef0", background: "#f5f7fa", fontSize: 12.5, color: form.registrationDistrict ? "#0F2A4A" : "#9aa1a9", minHeight: 36, display: "flex", alignItems: "center" }}>
                                {form.registrationDistrict || "Auto-populated from SRO"}
                              </div>
                            </div>
                          </div>
                          <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                            <Select label="Taluk" value={form.taluk} onChange={(e) => set({ taluk: e.target.value, village: "" })} options={[{ label: derivedDistrictId ? "Select taluk…" : "Select SRO first", value: "" }, ...talukOptions]} />
                            <Select label="Village / Panchayat" value={form.village} onChange={(e) => set({ village: e.target.value })} options={[{ label: form.taluk ? "Select village…" : "Select taluk first", value: "" }, ...villageOptions]} />
                          </div>
                          <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                            <Select label="Land Type" value={form.landType} onChange={(e) => set({ landType: e.target.value })} options={withEmpty(landTypes, "Select land type")} />
                            <Input label="Ward No." value={form.wardNo} onChange={(e) => set({ wardNo: e.target.value })} placeholder="e.g. 12" />
                          </div>
                          <Input label="Street" value={form.street} onChange={(e) => set({ street: e.target.value })} placeholder="Street name or house number" />
                        </div>
                      </div>
                      )}

                      {/* Measurements & Boundaries */}
                      {currentStepId === "survey" && (
                        <>
                          {/* Boundary Description */}
                          <div style={SEC}>
                            <div style={SEC_TITLE}>Boundary Description</div>
                            <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                              {(["North", "South", "East", "West"] as const).map((dir) => {
                                const fieldKey = `boundary${dir}` as "boundaryNorth" | "boundarySouth" | "boundaryEast" | "boundaryWest";
                                return (
                                  <Input
                                    key={dir}
                                    label={`${dir} boundary`}
                                    value={form[fieldKey]}
                                    onChange={(e) => set({ [fieldKey]: e.target.value })}
                                    placeholder={`e.g. Road, Government Land…`}
                                  />
                                );
                              })}
                            </div>
                          </div>

                          {/* FMB Reference */}
                          <div style={SEC}>
                            <div style={SEC_TITLE}>FMB Reference</div>
                            <Input
                              label="FMB Ref No."
                              value={form.fmbRef}
                              onChange={(e) => set({ fmbRef: e.target.value })}
                              placeholder="e.g. FMB-TVM-45-1998"
                              endAdornment={fmbPreviewLoading ? <Loader2 size={14} className="animate-spin" style={{ color: "#9aa1a9" }} /> : undefined}
                            />
                          </div>

                          {/* Measurement Details */}
                          <div style={SEC}>
                            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                              <div style={SEC_TITLE}>Measurement Details</div>
                              <button
                                onClick={addMeasurement}
                                style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#0F2A4A", background: "#f0f4f8", border: "1px solid #dde1e6", borderRadius: 5, padding: "3px 8px", cursor: "pointer" }}
                              >
                                <Plus size={11} /> Add
                              </button>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 22px 1fr 90px 28px", gap: "0 6px", marginBottom: 4 }}>
                              {["From", "", "To", "Value", ""].map((h, i) => (
                                <span key={i} style={{ fontSize: 10, fontWeight: 600, color: "#717881" }}>{h}</span>
                              ))}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {measurements.map((row, i) => (
                                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 22px 1fr 90px 28px", gap: "0 6px", alignItems: "flex-end" }}>
                                  <select
                                    value={row.from}
                                    onChange={(e) => setMeasurementField(i, "from", e.target.value)}
                                    style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #dde1e6", fontSize: 12, background: "#fff" }}
                                  >
                                    {DIRECTION_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                  </select>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 6, fontSize: 11, color: "#9aa1a9" }}>→</div>
                                  <select
                                    value={row.to}
                                    onChange={(e) => setMeasurementField(i, "to", e.target.value)}
                                    style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #dde1e6", fontSize: 12, background: "#fff" }}
                                  >
                                    {DIRECTION_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                  </select>
                                  <input
                                    type="text"
                                    value={row.val}
                                    onChange={(e) => setMeasurementField(i, "val", e.target.value)}
                                    placeholder="e.g. 45.5 ft"
                                    style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #dde1e6", fontSize: 12, width: "100%", boxSizing: "border-box" }}
                                  />
                                  <button
                                    onClick={() => removeMeasurement(i)}
                                    disabled={measurements.length <= 1}
                                    style={{ background: "none", border: "none", cursor: measurements.length <= 1 ? "not-allowed" : "pointer", color: measurements.length <= 1 ? "#dee2e6" : "#e63946", padding: 3, display: "flex", alignItems: "center", paddingBottom: 8 }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Step 4 - Chain of Title */}
                      {currentStepId === "history" && (
                      <div style={SEC}>
                        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                          <div>
                            <div style={SEC_TITLE}>Chain of Title</div>
                            <div style={{ fontSize: 11, color: "#9aa1a9", marginTop: -6 }}>
                              Record prior ownership history. Start with the earliest known owner.
                            </div>
                          </div>
                          <button
                            onClick={addLegacyRecord}
                            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#4361ee", background: "#eef0ff", border: "1px solid #c5caff", borderRadius: 5, padding: "3px 8px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, marginLeft: 10 }}
                          >
                            <Plus size={11} /> Add Record
                          </button>
                        </div>

                        <div className="flex flex-col gap-2" ref={legacyContainerRef}>
                          {legacyHistory.map((rec, idx) => (
                            <div key={idx} style={{ padding: "10px 12px", borderRadius: 7, border: "1px solid #dde1e6", background: "#fff" }}>
                              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#717881", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                  {idx === 0 ? "Earliest known owner" : `Record ${idx + 1}`}
                                </div>
                                {legacyHistory.length > 1 && (
                                  <button
                                    onClick={() => removeLegacyRecord(idx)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#e63946", padding: 2, display: "flex", alignItems: "center" }}
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>

                              {/* Row 1: Owner identity */}
                              <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 8 }}>
                                <Input
                                  label="Executor / Seller"
                                  value={rec.executorSeller}
                                  onChange={(e) => setLegacyField(idx, "executorSeller", e.target.value)}
                                  placeholder="Name of seller / executor"
                                />
                                <Input
                                  label="Claimant / Purchaser"
                                  value={rec.claimantPurchaser}
                                  onChange={(e) => setLegacyField(idx, "claimantPurchaser", e.target.value)}
                                  placeholder="Name of buyer / claimant"
                                />
                              </div>

                              {/* Row 2: Transaction details */}
                              <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 8 }}>
                                <Input
                                  label="Transaction Date"
                                  type="date"
                                  value={rec.transactionDate}
                                  onChange={(e) => setLegacyField(idx, "transactionDate", e.target.value)}
                                />
                                <Select
                                  label="Nature of Transaction"
                                  value={rec.natureOfTransaction}
                                  onChange={(e) => setLegacyField(idx, "natureOfTransaction", e.target.value)}
                                  options={withEmpty(chainOfTitleNatures.length > 0 ? chainOfTitleNatures : [
                                    { label: "Sale Deed", value: "Sale Deed" },
                                    { label: "Gift Deed", value: "Gift Deed" },
                                    { label: "Partition Deed", value: "Partition Deed" },
                                    { label: "Death Certificate", value: "Death Certificate" },
                                    { label: "Legal Heirship Certificate", value: "Legal Heirship Certificate" },
                                  ], "Select nature")}
                                />
                              </div>

                              {/* Row 3: Document info */}
                              <div className="grid gap-2" style={{ gridTemplateColumns: "1fr", marginBottom: 8 }}>
                                {/* Type of Document - hidden */}
                                {/* <Select label="Type of Document" ... /> */}
                                <Input
                                  label="Registration / Reference No."
                                  value={rec.registrationRefNo}
                                  onChange={(e) => setLegacyField(idx, "registrationRefNo", e.target.value)}
                                  placeholder="e.g. 1234/2024"
                                />
                              </div>

                              {/* Row 4: Survey */}
                              <div className="grid gap-2" style={{ gridTemplateColumns: "1fr", marginBottom: 8 }}>
                                {/* Stamp Duty - hidden */}
                                {/* <Input label="Stamp Duty (Rs.)" ... /> */}
                                <Input
                                  label="Survey No."
                                  value={rec.surveyNo}
                                  onChange={(e) => setLegacyField(idx, "surveyNo", e.target.value)}
                                  placeholder="e.g. 45/2B"
                                />
                              </div>

                              {/* Succession / Heirship fields */}
                              {(rec.natureOfTransaction === "Death Certificate" || rec.natureOfTransaction === "Legal Heirship Certificate") && (
                                <div className="flex flex-col gap-2" style={{ marginBottom: 8 }}>
                                  <Input
                                    label="Date of Death"
                                    type="date"
                                    value={rec.dateOfDeath}
                                    onChange={(e) => setLegacyField(idx, "dateOfDeath", e.target.value)}
                                  />
                                  <Input
                                    label="Legal Heirs"
                                    value={rec.legalHeirs}
                                    onChange={(e) => setLegacyField(idx, "legalHeirs", e.target.value)}
                                    placeholder="Names of legal heirs (comma-separated)"
                                  />
                                </div>
                              )}

                              {/* Legacy owner name + period (optional back-fill) */}
                              <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr 1fr", marginTop: 8 }}>
                                <Input
                                  label="Owner name (if different)"
                                  value={rec.ownerName}
                                  onChange={(e) => setLegacyField(idx, "ownerName", e.target.value)}
                                  placeholder="Full name"
                                />
                                <Input
                                  label="Owned from"
                                  type="date"
                                  value={rec.fromDate}
                                  onChange={(e) => setLegacyField(idx, "fromDate", e.target.value)}
                                />
                                <Input
                                  label="Owned until"
                                  type="date"
                                  value={rec.toDate}
                                  onChange={(e) => setLegacyField(idx, "toDate", e.target.value)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      )}

                      {/* Step N - Review & Mint */}
                      {currentStepId === "review" && (
                      <div style={SEC}>
                        <div style={SEC_TITLE}>Review & Confirm</div>
                        <DlGrid>
                          <DlRow label="ULPIN" full value={form.ulpin || "(auto-generate)"} />
                          <DlRow label="Owner" value={form.owner || "-"} />
                          <DlRow label="Aadhaar" value={form.ownerAadhaar || "-"} />
                          <DlRow label="Survey No." value={form.survey || "-"} />
                          <DlRow label="Area" value={form.area ? `${form.area}${form.areaUnit ? " " + form.areaUnit : ""}` : "-"} />
                          <DlRow label="SRO" value={sroList.find((s) => s.value === form.sroId)?.label || "-"} />
                          <DlRow label="District" value={form.registrationDistrict || "-"} />
                          <DlRow label="Taluk" value={form.taluk || "-"} />
                          <DlRow label="Village" value={form.village || "-"} />
                          <DlRow label="Property Type" value={propertyTypes.find((p) => p.value === form.propertyType)?.label || "-"} />
                          <DlRow label="Nature of Title" value={natureOfTitleOpts.find((p) => p.value === form.natureOfTitle)?.label || "-"} />
                          <DlRow label="Land Type" value={landTypes.find((p) => p.value === form.landType)?.label || "-"} />
                          <DlRow label="Chain of Title" full value={`${legacyHistory.length} record(s)`} />
                        </DlGrid>
                        {mintError && <Alert type="error" title="Could not mint token" message={mintError} dismissible={false} style={{ marginTop: 10 }} />}
                      </div>
                      )}

                      </div>{/* end scrollable step content */}

                      {/* ── Navigation footer (sticky) ── */}
                      <div className="flex items-center justify-between" style={{ flexShrink: 0, paddingTop: 12, borderTop: "1px solid #eceef0", marginTop: 10 }}>
                        <Button
                          variant="outline"
                          onClick={() => setMintStep((s) => Math.max(0, s - 1))}
                          disabled={mintStep === 0}
                        >
                          Back
                        </Button>
                        {mintStep < totalMintSteps - 1 ? (
                          <Button onClick={() => setMintStep((s) => s + 1)}>
                            Next →
                          </Button>
                        ) : (
                          <Button
                            disabled={!form.owner || form.ownerAadhaar.length !== 12 || aadhaarStatus === "checking" || submitting}
                            onClick={handleMint}
                          >
                            <Stamp size={14} /> {submitting ? "Minting…" : "Mint Token"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  id: "history",
                  label: "Token History",
                  icon: <History size={14} />,
                  content: (
                    <div className="flex flex-col gap-3">
                      <div style={{ padding: "10px 12px", borderRadius: 8, background: "#f0f7ff", border: "1px solid #cfe2ff", fontSize: 11.5, color: "#0045a5" }}>
                        Look up any land token's full ownership history, transaction chain, and split lineage.
                      </div>
                      <div className="flex gap-2">
                        <div style={{ flex: 1 }}>
                          <Input
                            label="ULPIN"
                            value={histUlpin}
                            onChange={(e) => setHistUlpin(e.target.value.toUpperCase())}
                            placeholder="e.g. TN-CGL-045-002-A"
                          />
                        </div>
                        <div style={{ alignSelf: "flex-end" }}>
                          <Button onClick={handleHistLookup} disabled={!histUlpin.trim() || histLoading}>
                            {histLoading ? <Loader2 size={14} className="animate-spin" /> : "Look up"}
                          </Button>
                        </div>
                      </div>

                      {histError && <Alert type="error" message={histError} dismissible={false} />}

                      {histResult && (
                        <>
                          {/* Token summary */}
                          <div style={SEC}>
                            <div className="flex items-center justify-between gap-2" style={{ marginBottom: 8 }}>
                              <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#0F2A4A" }}>{histResult.token.ulpin}</span>
                              <span style={{
                                fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                                background: histResult.token.state === "active" ? "#f0f8f2" : histResult.token.state === "split" ? "#f3ecff" : "#f5f7fa",
                                color: histResult.token.state === "active" ? "#1C7A4E" : histResult.token.state === "split" ? "#8338ec" : "#6c757d",
                              }}>
                                {histResult.token.state.toUpperCase()}
                              </span>
                            </div>
                            <DlGrid>
                              <DlRow label="Owner(s)" full value={histResult.token.ownership?.owners?.map((o: { name: string; share: number }) => `${o.name} (${o.share}%)`).join(", ") ?? "-"} />
                              <DlRow label="Location" full value={`${histResult.token.location?.village}, ${histResult.token.location?.taluk}, ${histResult.token.location?.district}`} />
                              <DlRow label="Area" value={histResult.token.physical?.area ?? "-"} />
                              <DlRow label="Guideline Value" value={inr(histResult.token.financial?.guidanceValue ?? 0)} />
                            </DlGrid>

                            {histResult.token.splitParent && (
                              <div className="flex items-center gap-2" style={{ marginTop: 8, padding: "6px 10px", borderRadius: 7, background: "#f3ecff", fontSize: 11.5, color: "#8338ec" }}>
                                <GitMerge size={13} />
                                Split from: <strong style={{ fontFamily: "monospace" }}>{histResult.token.splitParent}</strong>
                              </div>
                            )}
                            {histResult.token.splitChildren && histResult.token.splitChildren.length > 0 && (
                              <div className="flex items-center gap-2" style={{ marginTop: 8, padding: "6px 10px", borderRadius: 7, background: "#f3ecff", fontSize: 11.5, color: "#8338ec" }}>
                                <Scissors size={13} />
                                Split into: {histResult.token.splitChildren.map((c: string) => <strong key={c} style={{ fontFamily: "monospace", marginLeft: 4 }}>{c}</strong>)}
                              </div>
                            )}
                          </div>

                          {/* Split action */}
                          {histResult.token.state === "active" && can("tokens.mint") && (
                            <div>
                              <button
                                onClick={() => setShowSplit((v) => !v)}
                                style={{ fontSize: 12, fontWeight: 600, color: "#8338ec", background: "none", border: "1px solid #8338ec30", borderRadius: 6, padding: "5px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                              >
                                <Scissors size={12} /> {showSplit ? "Cancel Split" : "Initiate Partial Split"}
                              </button>
                              {showSplit && (
                                <div style={{ marginTop: 10, padding: "14px", borderRadius: 9, border: "1px solid #8338ec30", background: "#f9f5ff" }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: "#8338ec", marginBottom: 4 }}>Partial Split: Token will become inactive</div>
                                  <div style={{ fontSize: 11.5, color: "#9aa1a9", marginBottom: 12 }}>
                                    The parent token <strong>{histResult.token.ulpin}</strong> will be marked <em>Split</em>. Two new child tokens will be minted as Active.
                                  </div>
                                  {["childA", "childB"].map((child) => {
                                    const c = child as "childA" | "childB";
                                    return (
                                      <div key={c} style={{ padding: "10px 12px", borderRadius: 7, border: "1px solid #dde1e6", background: "#fff", marginBottom: 8 }}>
                                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0F2A4A", marginBottom: 8 }}>
                                          {c === "childA" ? "Sub-parcel A" : "Sub-parcel B"}
                                        </div>
                                        <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                                          <Input label="New ULPIN" value={splitForm[c].ulpin} onChange={(e) => setSplitChild(c, "ulpin", e.target.value)} />
                                          <Input label="Area" value={splitForm[c].area} onChange={(e) => setSplitChild(c, "area", e.target.value)} placeholder="e.g. 0.50 acre" />
                                          <Input label="Owner name" value={splitForm[c].owner} onChange={(e) => setSplitChild(c, "owner", e.target.value)} />
                                          <Input label="Share %" type="number" value={splitForm[c].sharePercent} onChange={(e) => setSplitChild(c, "sharePercent", e.target.value)} min={1} max={99} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {splitError && <Alert type="error" message={splitError} dismissible={false} />}
                                  <div style={{ fontSize: 11, color: "#9aa1a9", marginBottom: 10 }}>
                                    Combined share must equal 100%. Both sub-parcels inherit the parent's location and registry data.
                                  </div>
                                  <Button onClick={handleSplit} disabled={splitBusy || !splitForm.childA.owner || !splitForm.childB.owner}>
                                    <Scissors size={13} /> {splitBusy ? "Splitting…" : "Execute Split"}
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Transaction timeline */}
                          <div style={SEC}>
                            <div style={{ ...SEC_TITLE, marginBottom: 12 }}>Transaction Timeline</div>
                            {histResult.events.length === 0 ? (
                              <div style={{ fontSize: 11.5, color: "#9aa1a9" }}>No recorded chain events yet.</div>
                            ) : (
                              <div className="flex flex-col" style={{ gap: 0 }}>
                                {histResult.events.map((ev, idx) => {
                                  const col = OP_COLOR[ev.operation] ?? "#6c757d";
                                  return (
                                    <div key={idx} style={{ display: "flex", gap: 10, paddingBottom: 12, position: "relative" }}>
                                      {idx < histResult.events.length - 1 && (
                                        <div style={{ position: "absolute", left: 11, top: 26, bottom: 0, width: 2, background: "#eceef0", zIndex: 0 }} />
                                      )}
                                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: col + "18", border: `2px solid ${col}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                                        {ev.operation === "SPLIT" ? <Scissors size={10} style={{ color: col }} /> :
                                          ev.operation === "TRANSFER" ? <ArrowRight size={10} style={{ color: col }} /> :
                                          ev.operation === "MINT" ? <Stamp size={10} style={{ color: col }} /> :
                                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: col }} />}
                                      </div>
                                      <div style={{ flex: 1, paddingTop: 2 }}>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#0F2A4A" }}>{ev.operation}</span>
                                          <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 8, background: col + "18", color: col }}>{ev.postState}</span>
                                          <span style={{ fontSize: 10.5, color: "#9aa1a9", marginLeft: "auto" }}>
                                            {new Date(ev.timestamp).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                          </span>
                                        </div>
                                        <div style={{ fontSize: 11, color: "#717881", marginTop: 2 }}>
                                          <User size={10} style={{ display: "inline", marginRight: 3 }} />{ev.actorRole}
                                        </div>
                                        <div style={{ fontSize: 11.5, color: "#161b22", marginTop: 3 }}>{ev.detail}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          )}
        </Card>

        {/* Right panel - map / FMB preview */}
        <Card style={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", padding: 0 }}>
          <div style={{ flexShrink: 0, padding: "10px 14px", borderBottom: "1px solid #eceef0", display: "flex", alignItems: "center", gap: 8 }}>
            <MapPin size={14} style={{ color: "#0F2A4A" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0F2A4A" }}>
              {currentStepId === "survey" ? "FMB Diagram Preview" : "Parcel Map Preview"}
            </span>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f4f8fb" }}>
            {currentStepId === "survey" ? (
              fmbPreviewLoading ? (
                <div style={{ textAlign: "center", color: "#9aa1a9" }}>
                  <Loader2 size={22} className="animate-spin" style={{ color: "#0F2A4A", marginBottom: 6 }} />
                  <div style={{ fontSize: 12 }}>Loading FMB diagram…</div>
                </div>
              ) : fmbPreviewImage ? (
                <img
                  src={fmbPreviewImage}
                  alt={`FMB - ${form.fmbRef}`}
                  style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />
              ) : (
                <div style={{ textAlign: "center", padding: 24 }}>
                  <Ruler size={28} color="#b0b8c4" />
                  <div style={{ fontSize: 12, color: "#9aa1a9", marginTop: 8 }}>Enter an FMB Ref No. above</div>
                  <div style={{ fontSize: 11, color: "#b0b8c4", marginTop: 4 }}>to preview the field measurement diagram</div>
                </div>
              )
            ) : leafletPolygon ? (
              <div style={{ width: "100%", flex: 1 }}>
                <ParcelMap gps={gpsString || ""} polygon={leafletPolygon} height={400} />
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 24 }}>
                <MapPin size={28} color="#b0b8c4" />
                <div style={{ fontSize: 12, color: "#9aa1a9", marginTop: 8 }}>Add boundary vertices in the Location step</div>
                <div style={{ fontSize: 11, color: "#b0b8c4", marginTop: 4 }}>to preview the parcel footprint here</div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
