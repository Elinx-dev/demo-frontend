import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, ShieldCheck, ShieldAlert, BellRing, Users, Plus, Trash2, Loader2, AlertTriangle, Lock } from "lucide-react";
import OtpBoxInput from "../../components/OtpBoxInput";
import { Card } from "@/ui/primitives/Card/Card";
import { Button } from "@/ui/primitives/Button/Button";
import { Input } from "@/ui/primitives/Input/Input";
import { Select } from "@/ui/primitives/Select/Select";
import { Autocomplete } from "@/ui/primitives/Autocomplete/Autocomplete";
import type { AutocompleteOption } from "@/ui/primitives/Autocomplete/Autocomplete";
import { RadioGroup } from "@/ui/primitives/RadioGroup/RadioGroup";
import { Alert } from "@/ui/primitives/Alert/Alert";
import { ROUTES } from "@/navigation/routes";
import { useSlateStore } from "../../state/SlateProvider";
import { slateApi } from "../../services/apiClient";
import PageHead from "../../components/PageHead";
import StateBadge from "../../components/StateBadge";
import ParcelMap from "../../components/ParcelMap";
import { DlGrid, DlRow } from "../../components/DefinitionList";
import { inr, inrShort } from "../../utils/format";
import type { SlateToken, TxnType, EcEntry, OfficerQueueStatus } from "../../types/slate.types";


const TN_STAMP_DUTY_PCT = 7;
const TN_REG_FEE_PCT = 4;

function tnMarketValue(token: SlateToken | null, price: string): number {
  const declared = Number(price) || 0;
  const guidance = token?.financial?.guidanceValue || 0;
  return Math.max(declared, guidance);
}
function tnStampDuty(mv: number) { return Math.round(mv * TN_STAMP_DUTY_PCT / 100); }
function tnRegFee(mv: number) { return Math.round(mv * TN_REG_FEE_PCT / 100); }

const TXN_STEPS = [
  { id: "parcel",    label: "Parcel & Type" },
  { id: "details",  label: "Party Details" },
  { id: "witnesses",label: "Witnesses" },
  { id: "consent",  label: "Digital Consent" },
  { id: "checks",   label: "Rule Checks" },
  { id: "payment",  label: "Fees & Payment" },
  { id: "done",     label: "Confirmation" },
];

const SEC = { padding: "12px 14px", borderRadius: 9, border: "1px solid #eceef0", background: "#fafbfc" } as const;
const SEC_TITLE = { fontSize: 12, fontWeight: 700, color: "#0F2A4A", marginBottom: 10 } as const;

const AREA_UNIT_OPTS = [
  { label: "Sq.ft", value: "Sq.ft" },
  { label: "Sq.m", value: "Sq.m" },
  { label: "Acres", value: "Acres" },
  { label: "Cents", value: "Cents" },
  { label: "Guntas", value: "Guntas" },
];

function latinOnly(str: string): boolean {
  return !/[଀-෿ऀ-ॿ]/.test(str);
}
function cleanOpts<T extends { label: string; value: string }>(opts: T[]): T[] {
  return opts.filter((o) => latinOnly(o.label));
}

// ─── Sidebar tabs: Parcel Summary | Flow ────────────────────────────────────

function SidebarTabs({
  token, draft, marketValue, stampDuty, regFee, witnesses,
}: {
  token: SlateToken | null;
  draft: import("../../types/slate.types").TxnDraft;
  marketValue: number;
  stampDuty: number;
  regFee: number;
  witnesses: { name: string; address: string }[];
}) {
  return (
    <div style={{ width: 380, flexShrink: 0, overflowY: "auto" }}>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F2A4A", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #eceef0" }}>
          Parcel Summary
        </div>
        {token ? (
          <>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: "#0F2A4A" }}>{token.ulpin}</span>
              <StateBadge state={token.state} size="sm" />
            </div>
            <ParcelMap gps={token.location.gpsCentroid} height={160} />
            <div style={{ marginTop: 12 }}>
              <DlGrid>
                <DlRow label="Location" full value={`${token.location.village}, ${token.location.taluk}`} />
                <DlRow label="Area" value={token.physical.area} />
                <DlRow label="Guideline value" value={inrShort(token.financial.guidanceValue)} />
              </DlGrid>
            </div>
            {draft.step >= 2 && draft.buyerName && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #eceef0" }}>
                <DlGrid>
                  <DlRow label={draft.type === "sale" ? "Buyer" : "Co-owner"} value={draft.buyerName} />
                  {draft.type === "sale" && draft.price && <DlRow label="Sale price" value={inr(Number(draft.price) || 0)} />}
                  {draft.type === "sale" && marketValue > 0 && <DlRow label="Market value" value={inr(marketValue)} />}
                  {draft.type === "partition" && draft.sharePercent && <DlRow label="Share transferred" value={`${draft.sharePercent}%`} />}
                  {stampDuty > 0 && <DlRow label={`Stamp duty (${TN_STAMP_DUTY_PCT}%)`} value={inr(stampDuty)} />}
                  {regFee > 0 && <DlRow label={`Reg. fee (${TN_REG_FEE_PCT}%)`} value={inr(regFee)} />}
                </DlGrid>
              </div>
            )}
            {draft.step >= 3 && witnesses.some((w) => w.name.trim()) && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #eceef0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#717881", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Witnesses</div>
                {witnesses.filter((w) => w.name.trim()).map((w, i) => (
                  <div key={i} style={{ fontSize: 11.5, color: "#161b22", marginBottom: 3 }}>
                    <strong>{i + 1}.</strong> {w.name}, {w.address}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 12, color: "#9aa1a9" }}>Select a parcel to see its summary here.</div>
        )}
      </Card>
    </div>
  );
}

export default function InitiateTransactionPage() {
  const { session, currentUser, startTxnDraft, updateTxnDraft, goToInitiateStep, payForTransaction } = useSlateStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isOfficer = ["REG_OFFICER_MAKER", "REG_OFFICER_CHECKER", "SUB_REGISTRAR"].includes(
    session?.liveIdentity?.roleCode ?? ""
  );

  const [citizenProperties, setCitizenProperties] = useState<SlateToken[]>([]);
  const [activeQueueMap, setActiveQueueMap] = useState<Record<string, OfficerQueueStatus>>({});
  const [citizenAutocompleteValue, setCitizenAutocompleteValue] = useState<AutocompleteOption | null>(null);
  const [officerTokenSearch, setOfficerTokenSearch] = useState("");
  const [officerSearchResults, setOfficerSearchResults] = useState<SlateToken[]>([]);
  const [officerSearching, setOfficerSearching] = useState(false);
  const officerSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [officerAutocompleteValue, setOfficerAutocompleteValue] = useState<AutocompleteOption | null>(null);

  const [token, setToken] = useState<SlateToken | null>(null);
  const [relationships, setRelationships] = useState<{ code: string; label: string }[]>([]);
  const [checks, setChecks] = useState<{ label: string; pass: boolean; detail: string }[]>([]);
  const [consentStatus, setConsentStatus] = useState<{ recipientConsent: boolean; recipientConsentAt?: string } | null>(null);
  const [result, setResult] = useState<{ allClear: boolean; txnId: string } | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);
  const [consentOtp, setConsentOtp] = useState("");
  const [consentOtpError, setConsentOtpError] = useState("");
  const [consentOtpSent, setConsentOtpSent] = useState(false);
  const [sendingConsentOtp, setSendingConsentOtp] = useState(false);

  const [buyerPan, setBuyerPan] = useState("");
  const [sellerPan, setSellerPan] = useState("");
  const [modeOfConsideration, setModeOfConsideration] = useState("NEFT/RTGS");
  const [sroOffice, setSroOffice] = useState("");
  const [sroList, setSroList] = useState<{ label: string; value: string }[]>([]);
  const [buyerAadhaarStatus, setBuyerAadhaarStatus] = useState<"idle" | "checking" | "verified" | "not_found">("idle");
  const [partitionArea, setPartitionArea] = useState("");
  const [partitionAreaUnit, setPartitionAreaUnit] = useState("Sq.ft");
  const buyerLookupRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const presetUlpin = (location.state as { ulpin?: string } | null)?.ulpin;

  const draft = session.txnDraft;

  useEffect(() => {
    if (!isOfficer) {
      slateApi.citizen.getProperties().then(setCitizenProperties).catch(() => undefined);
      slateApi.citizen.getTrackStatus().then(({ myTxns }) => {
        const map: Record<string, OfficerQueueStatus> = {};
        myTxns.forEach((q) => { if (q.status !== "approved") map[q.ulpin] = q.status; });
        setActiveQueueMap(map);
      }).catch(() => undefined);
    }
    slateApi.masters.getRelationships().then(setRelationships).catch(() => undefined);
    slateApi.masters.getSROList().then((sros) =>
      setSroList(cleanOpts(sros.map((j: { id?: string; code?: string; name?: string; label?: string }) => ({
        label: j.name || j.label || j.code || "",
        value: j.id || j.code || "",
      })))),
    ).catch(() => undefined);
  }, [isOfficer]);

  useEffect(() => {
    if (!isOfficer) return;
    if (!officerTokenSearch.trim() || officerTokenSearch.length < 2) {
      setOfficerSearchResults([]);
      return;
    }
    if (officerSearchRef.current) clearTimeout(officerSearchRef.current);
    setOfficerSearching(true);
    officerSearchRef.current = setTimeout(() => {
      slateApi.officer.searchTokens(officerTokenSearch.trim())
        .then((results) => setOfficerSearchResults(results))
        .catch(() => setOfficerSearchResults([]))
        .finally(() => setOfficerSearching(false));
    }, 400);
    return () => { if (officerSearchRef.current) clearTimeout(officerSearchRef.current); };
  }, [officerTokenSearch, isOfficer]);

  // Auto-lookup buyer name when Aadhaar is complete
  useEffect(() => {
    if (!draft) return;
    if (draft.buyerAadhaar?.length !== 12) { setBuyerAadhaarStatus("idle"); return; }
    if (buyerLookupRef.current) clearTimeout(buyerLookupRef.current);
    setBuyerAadhaarStatus("checking");
    buyerLookupRef.current = setTimeout(() => {
      slateApi.officer.lookupAadhaar(draft.buyerAadhaar)
        .then((match) => { updateTxnDraft({ buyerName: match.name }); setBuyerAadhaarStatus("verified"); })
        .catch(() => setBuyerAadhaarStatus("not_found"));
    }, 600);
    return () => { if (buyerLookupRef.current) clearTimeout(buyerLookupRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.buyerAadhaar]);

  useEffect(() => {
    if (!session.txnDraft) startTxnDraft({ ulpin: presetUlpin });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (draft && !draft.ulpin && citizenProperties.length > 0) {
      const first = citizenProperties.find((t) => t.state !== "locked") ?? null;
      if (first) {
        updateTxnDraft({ ulpin: first.ulpin });
        setCitizenAutocompleteValue({ label: first.ulpin, value: first.ulpin, description: first.location?.village });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citizenProperties]);

  useEffect(() => {
    if (!draft?.ulpin) return;
    slateApi.citizen.getPropertyDetail(draft.ulpin).then(setToken).catch(() => setToken(null));
  }, [draft?.ulpin]);

  // Sync autocomplete selection when draft.ulpin is set externally (preset / back-nav)
  useEffect(() => {
    if (!isOfficer) return;
    if (draft?.ulpin && officerAutocompleteValue?.value !== draft.ulpin) {
      setOfficerAutocompleteValue({ label: draft.ulpin, value: draft.ulpin });
    } else if (!draft?.ulpin) {
      setOfficerAutocompleteValue(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.ulpin, isOfficer]);

  useEffect(() => {
    if (draft?.step === 5 && draft.ulpin) {
      slateApi.citizen.getRuleChecks(draft.ulpin).then(setChecks).catch(() => setChecks([]));
    }
  }, [draft?.step, draft?.ulpin]);

  useEffect(() => {
    if (draft?.consentRequestId) {
      slateApi.citizen.getConsentRequest(draft.consentRequestId).then((r) => setConsentStatus(r)).catch(() => undefined);
    }
  }, [draft?.consentRequestId, draft?.step]);

  // Poll for recipient consent every 4 s while on step 4 and consent is still pending
  useEffect(() => {
    if (draft?.step !== 4 || !draft?.consentRequestId || consentStatus?.recipientConsent) return;
    const id = setInterval(() => {
      slateApi.citizen.getConsentRequest(draft.consentRequestId!)
        .then((r) => setConsentStatus(r))
        .catch(() => undefined);
    }, 4000);
    return () => clearInterval(id);
  }, [draft?.step, draft?.consentRequestId, consentStatus?.recipientConsent]);

  if (!draft) return null;

  const marketValue = tnMarketValue(token, draft.price);
  const stampDuty = draft.type === "sale" ? tnStampDuty(marketValue) : tnStampDuty(token?.financial?.guidanceValue ?? 0);
  const regFee = draft.type === "sale" ? tnRegFee(marketValue) : tnRegFee(token?.financial?.guidanceValue ?? 0);
  const totalFees = stampDuty + regFee;
  const totalPayable = (Number(draft.price) || 0) + totalFees;
  const TDS_THRESHOLD = 5000000;
  const declaredPrice = Number(draft.price) || 0;
  const tdsApplies = draft.type === "sale" && declaredPrice >= TDS_THRESHOLD;
  const tdsAmount = tdsApplies ? Math.round(declaredPrice / 100) : 0;

  const allChecksPass = checks.length > 0 && checks.every((c) => c.pass);
  const recipientHasConsented = !!consentStatus?.recipientConsent;
  const canProceedPastConsent = !!draft.consentRequestId && recipientHasConsented;

  const witnesses = draft.witnesses ?? [{ name: "", address: "" }];
  const witnessesValid = witnesses.length >= 1 && witnesses.every((w) => w.name.trim() && w.address.trim());

  const updateWitness = (idx: number, field: "name" | "address", value: string) =>
    updateTxnDraft({ witnesses: witnesses.map((w, i) => i === idx ? { ...w, [field]: value } : w) });
  const addWitness = () => updateTxnDraft({ witnesses: [...witnesses, { name: "", address: "" }] });
  const removeWitness = (idx: number) => {
    if (witnesses.length <= 1) return;
    updateTxnDraft({ witnesses: witnesses.filter((_, i) => i !== idx) });
  };

  const handleRequestConsentOtp = async () => {
    if (!currentUser) return;
    setSendingConsentOtp(true);
    setConsentOtpError("");
    try {
      const identifier = currentUser.phone || currentUser.email;
      if (!identifier) throw new Error("Your account has no registered phone or email.");
      const result = await slateApi.requestOtp({ identifier, channel: currentUser.phone ? "mobile" : "email", purpose: "CONSENT" });
      setConsentOtpSent(true);
      if (result?.devOtp) setConsentOtp(result.devOtp);
    } catch (err) {
      setConsentOtpError(err instanceof Error ? err.message : "Could not send the OTP.");
    } finally {
      setSendingConsentOtp(false);
    }
  };

  const handleSendConsent = async () => {
    if (!currentUser) return;
    setBusy(true);
    setConsentOtpError("");
    try {
      const identifier = currentUser.phone || currentUser.email || "";
      await slateApi.verifyConsentOtp({ identifier, otp: consentOtp });
      const { id } = await slateApi.citizen.createConsentRequest({
        ulpin: draft.ulpin,
        type: draft.type,
        recipientName: draft.buyerName || "Recipient",
        price: draft.type === "sale" ? draft.price : undefined,
        sharePercent: draft.type === "partition" ? draft.sharePercent : undefined,
        giftRelation: draft.type === "gift" || draft.type === "partition" ? draft.giftRelation : undefined,
      });
      updateTxnDraft({ consentRequestId: id });
    } catch (err) {
      setConsentOtpError(err instanceof Error ? err.message : "Could not record consent.");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async () => {
    setBusy(true);
    setSubmitError("");
    try {
      const r = await slateApi.citizen.submitTransaction({
        ulpin: draft.ulpin,
        type: draft.type,
        buyerName: draft.buyerName,
        buyerAadhaar: draft.buyerAadhaar,
        price: draft.price,
        partitionArea: draft.type === "partition" ? draft.sharePercent : undefined,
        giftRelation: draft.giftRelation,
        stampDutyCode: draft.stampDutyCode,
        paymentRef: draft.paymentRef || null,
        witnesses: witnesses.filter((w) => w.name.trim()),
        needsSurveyor: draft.type === "partition" ? true : draft.needsSurveyor,
      });
      setResult(r);
      updateTxnDraft({ step: 7, submitted: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not submit the transaction.");
    } finally {
      setBusy(false);
    }
  };

  const stepIndex = Math.max(0, (draft.step || 1) - 1);
  const relationshipOpts = cleanOpts(relationships.map((r) => ({ label: r.label, value: r.label })));

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow={isOfficer ? "Registration Officer Portal" : "Citizen Portal"}
          title="Initiate Property Transaction"
        />
      </div>

      <div style={{ flex: 1, display: "flex", gap: 16, minHeight: 0, overflow: "hidden" }}>
          <div style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
          <Card>
            {/* ── Inline stepper header ── */}
            <div style={{ display: "flex", alignItems: "flex-start", paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid #eceef0" }}>
              {TXN_STEPS.map((step, idx) => {
                const isCompleted = stepIndex > idx;
                const isActive = stepIndex === idx;
                return (
                  <div key={step.id} style={{ display: "flex", alignItems: "center", flex: idx < TXN_STEPS.length - 1 ? 1 : 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div
                        style={{
                          width: 26, height: 26, borderRadius: "50%",
                          background: isCompleted ? "#1C7A4E" : isActive ? "#0F2A4A" : "#eceef0",
                          color: (isCompleted || isActive) ? "#fff" : "#9aa1a9",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10.5, fontWeight: 700, flexShrink: 0,
                          cursor: isCompleted ? "pointer" : "default",
                        }}
                        onClick={() => { if (isCompleted) goToInitiateStep(idx + 1); }}
                      >
                        {isCompleted ? "✓" : idx + 1}
                      </div>
                      <div style={{ fontSize: 9.5, fontWeight: 600, marginTop: 3, textAlign: "center", whiteSpace: "nowrap", color: isActive ? "#0F2A4A" : isCompleted ? "#1C7A4E" : "#9aa1a9" }}>
                        {step.label}
                      </div>
                    </div>
                    {idx < TXN_STEPS.length - 1 && (
                      <div style={{ flex: 1, height: 2, background: isCompleted ? "#1C7A4E" : "#eceef0", margin: "0 5px", marginBottom: 16 }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Step 1: Parcel & Type ── */}
            {draft.step === 1 && (
              <div className="flex flex-col gap-3">
                <div style={SEC}>
                  <div style={SEC_TITLE}>Select Parcel</div>
                  {isOfficer ? (
                    <Autocomplete
                      label="Search ULPIN or location"
                      placeholder="Type ULPIN or village name..."
                      options={officerSearchResults.map((t) => ({
                        label: t.ulpin,
                        value: t.ulpin,
                        description: `${t.location.village}, ${t.location.taluk}`,
                      }))}
                      value={officerAutocompleteValue}
                      onChange={(opt) => {
                        setOfficerAutocompleteValue(opt);
                        updateTxnDraft({ ulpin: opt?.value ?? "" });
                      }}
                      onInputChange={(q) => {
                        setOfficerTokenSearch(q);
                        if (!q && draft.ulpin) updateTxnDraft({ ulpin: "" });
                      }}
                      loading={officerSearching}
                      noOptionsText={officerTokenSearch.length < 2 ? "Type at least 2 characters to search…" : "No parcels found in your jurisdiction"}
                      allowClear
                      size="sm"
                    />
                  ) : (
                    <Autocomplete
                      label="Parcel (ULPIN)"
                      placeholder="Select or search your parcel…"
                      options={citizenProperties.map((t) => {
                        const isLocked = t.state === "locked";
                        const qStatus = activeQueueMap[t.ulpin];
                        const isInFlow = isLocked || !!qStatus;
                        const STAGE_LABEL: Partial<Record<OfficerQueueStatus, string>> = {
                          pending_maker:    "With Reg. Officer",
                          pending_checker:  "With Checker",
                          pending_surveyor: "With Surveyor",
                          pending_tahsildar:"With Tahsildar",
                          exception:        "Under Review",
                        };
                        const badge = isLocked
                          ? "In Progress"
                          : qStatus
                          ? (STAGE_LABEL[qStatus] ?? "In Progress")
                          : undefined;
                        return {
                          label: t.ulpin,
                          value: t.ulpin,
                          description: isInFlow
                            ? `${t.location?.village} · ${t.location?.taluk} - transaction in progress, cannot transfer`
                            : `${t.location?.village} · ${t.location?.taluk}`,
                          disabled: isInFlow,
                          badge,
                          badgeColor: isInFlow ? "#B0392F" : undefined,
                          icon: isInFlow ? <Lock size={11} /> : undefined,
                        };
                      })}
                      value={citizenAutocompleteValue}
                      onChange={(opt) => {
                        setCitizenAutocompleteValue(opt);
                        updateTxnDraft({ ulpin: opt?.value ?? "" });
                      }}
                      noOptionsText="No properties found on your account"
                      allowClear={false}
                      size="sm"
                    />
                  )}
                </div>

                <div style={SEC}>
                  <div style={SEC_TITLE}>Transaction Type</div>
                  <RadioGroup
                    label=""
                    layout="card"
                    value={draft.type}
                    onChange={(v) => {
                      const t = v as TxnType;
                      // Partition always forces surveyor; reset for sale/gift
                      updateTxnDraft({ type: t, needsSurveyor: t === "partition" ? true : undefined });
                    }}
                    options={[
                      { label: "Direct Sale", value: "sale", description: "Full ownership transfer for consideration (Direct patta transfer)" },
                      { label: "Partial Sale / Subdivision", value: "partition", description: "Divide and transfer a share - surveyor visit mandatory" },
                    ]}
                  />
                  {draft.type === "partition" && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 10, padding: "11px 13px", borderRadius: 8, background: "#fff7e0", border: "1px solid #f0c060" }}>
                      <AlertTriangle size={14} color="#B8722E" style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 12, color: "#7a4a10", lineHeight: 1.6 }}>
                        <strong>Surveyor visit is mandatory</strong> for Partial Sale / Subdivision. A licensed surveyor will physically verify and demarcate the boundary before the mutation proceeds to the VAO. You will be notified once a site visit is scheduled.
                      </span>
                    </div>
                  )}
                </div>

                {/* Surveyor verification question */}
                {draft.type === "sale" && (
                  <div style={SEC}>
                    <div style={SEC_TITLE}>Surveyor Verification</div>
                    <div style={{ fontSize: 12, color: "#545c66", marginBottom: 10, lineHeight: 1.55 }}>
                      Do you require a surveyor to verify the parcel boundary before mutation at the VAO?
                    </div>
                    <RadioGroup
                      label=""
                      value={draft.needsSurveyor === true ? "yes" : draft.needsSurveyor === false ? "no" : ""}
                      onChange={(v) => updateTxnDraft({ needsSurveyor: v === "yes" })}
                      options={[
                        { label: "Yes", value: "yes" },
                        { label: "No", value: "no" },
                      ]}
                      direction="horizontal"
                    />
                  </div>
                )}


                <Button
                  disabled={
                    !draft.ulpin ||
                    (draft.type === "sale" && draft.needsSurveyor === undefined) ||
                    (draft.type === "gift" && draft.needsSurveyor === undefined && false)
                  }
                  onClick={() => goToInitiateStep(2)}
                >
                  Continue
                </Button>
              </div>
            )}

            {/* ── Step 2: Party Details ── */}
            {draft.step === 2 && (
              <div className="flex flex-col gap-3">
                <div style={SEC}>
                  <div style={SEC_TITLE}>{draft.type === "sale" ? "Buyer Details" : draft.type === "partition" ? "Co-owner Details" : "Recipient Details"}</div>
                  <div className="flex flex-col gap-3">
                    <Input
                      label={draft.type === "sale" ? "Buyer Aadhaar" : draft.type === "partition" ? "Co-owner Aadhaar" : "Recipient Aadhaar"}
                      value={draft.buyerAadhaar}
                      onChange={(e) => { updateTxnDraft({ buyerAadhaar: e.target.value.replace(/\D/g, "").slice(0, 12) }); if (buyerAadhaarStatus === "verified") updateTxnDraft({ buyerName: "" }); }}
                      maxLength={12}
                      placeholder="12-digit Aadhaar"
                      endAdornment={
                        buyerAadhaarStatus === "checking" ? <Loader2 size={14} className="animate-spin" style={{ color: "#9aa1a9" }} /> :
                        buyerAadhaarStatus === "verified" ? <ShieldCheck size={14} style={{ color: "#1C7A4E" }} /> :
                        buyerAadhaarStatus === "not_found" ? <ShieldAlert size={14} style={{ color: "#B8722E" }} /> : undefined
                      }
                    />
                    <Input
                      label={draft.type === "sale" ? "Buyer full name" : draft.type === "partition" ? "Co-owner name" : "Recipient full name"}
                      value={draft.buyerName}
                      onChange={(e) => updateTxnDraft({ buyerName: e.target.value })}
                      readOnly={buyerAadhaarStatus === "verified"}
                      placeholder="Name (auto-fetched when Aadhaar is matched)"
                    />
                    {draft.type === "sale" && (
                      <Input
                        label="Declared sale consideration (Rs.)"
                        type="number"
                        value={draft.price}
                        onChange={(e) => updateTxnDraft({ price: e.target.value })}
                        helperText="Stamp duty is on the higher of this amount or the guideline value."
                      />
                    )}
                    {draft.type === "gift" && (
                      <Select
                        label="Relationship to recipient"
                        value={draft.giftRelation}
                        onChange={(e) => updateTxnDraft({ giftRelation: e.target.value })}
                        options={[{ label: "Select relationship", value: "" }, ...relationshipOpts]}
                      />
                    )}
                    {draft.type === "partition" && (
                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: "#545c66", marginBottom: 6 }}>Extended Area to Transfer</div>
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                          <div style={{ flex: 1 }}>
                            <Input
                              label=""
                              type="number"
                              min={1}
                              value={partitionArea}
                              onChange={(e) => {
                                setPartitionArea(e.target.value);
                                updateTxnDraft({ sharePercent: e.target.value ? `${e.target.value} ${partitionAreaUnit}` : "" });
                              }}
                              placeholder="e.g. 1200"
                            />
                          </div>
                          <div style={{ width: 110, paddingBottom: 0 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#717881", marginBottom: 4 }}>Unit</div>
                            <Select
                              value={partitionAreaUnit}
                              onChange={(e) => {
                                setPartitionAreaUnit(e.target.value);
                                if (partitionArea) updateTxnDraft({ sharePercent: `${partitionArea} ${e.target.value}` });
                              }}
                              options={AREA_UNIT_OPTS}
                            />
                          </div>
                        </div>
                        {token && <div style={{ fontSize: 11, color: "#717881", marginTop: 5 }}>Token record area: <strong>{token.physical.area}</strong></div>}
                      </div>
                    )}
                  </div>
                </div>

                <div style={SEC}>
                  <div style={SEC_TITLE}>TN Registration Compliance</div>
                  <div className="flex flex-col gap-3">
                    <Select
                      label="Sub-Registrar Office (SRO)"
                      value={sroOffice}
                      onChange={(e) => setSroOffice(e.target.value)}
                      options={[{ label: "Select SRO", value: "" }, ...sroList]}
                      helperText="Select the jurisdictional SRO for registration."
                    />
                    {draft.type === "sale" && (
                      <>
                        <Select
                          label="Mode of consideration"
                          value={modeOfConsideration}
                          onChange={(e) => setModeOfConsideration(e.target.value)}
                          options={[
                            { label: "NEFT / RTGS (Bank Transfer)", value: "NEFT/RTGS" },
                            { label: "Demand Draft (DD)", value: "DD" },
                            { label: "Cheque", value: "Cheque" },
                            { label: "Cash (below Rs.20,000 only)", value: "Cash" },
                          ]}
                          helperText="Under IT Act §269SS, consideration above Rs.20,000 cannot be paid in cash."
                        />
                        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                          <Input label="Buyer PAN" value={buyerPan} onChange={(e) => setBuyerPan(e.target.value.toUpperCase().slice(0, 10))} placeholder="ABCDE1234F" maxLength={10} helperText={declaredPrice >= TDS_THRESHOLD ? "Required: sale above Rs.50 lakh" : "Optional"} />
                          <Input label="Seller PAN" value={sellerPan} onChange={(e) => setSellerPan(e.target.value.toUpperCase().slice(0, 10))} placeholder="ABCDE1234F" maxLength={10} helperText={declaredPrice >= TDS_THRESHOLD ? "Required: sale above Rs.50 lakh" : "Optional"} />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => goToInitiateStep(1)}>Back</Button>
                  <Button
                    disabled={!draft.buyerName || draft.buyerAadhaar.length !== 12 || (draft.type === "partition" && (!partitionArea || Number(partitionArea) <= 0))}
                    onClick={() => goToInitiateStep(3)}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 3: Witnesses ── */}
            {draft.step === 3 && (
              <div className="flex flex-col gap-3">
                <div style={SEC}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                    <div className="flex items-center gap-2">
                      <span style={{ width: 32, height: 32, borderRadius: "50%", background: "#f0f8f2", color: "#1C7A4E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Users size={15} />
                      </span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F2A4A" }}>Witnesses</div>
                        <div style={{ fontSize: 11, color: "#717881" }}>Minimum 1 witness required (TN Registration Act §40)</div>
                      </div>
                    </div>
                    <button onClick={addWitness} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#1C7A4E", background: "#f0f8f2", border: "1px solid #c3e6cb", borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>
                      <Plus size={11} /> Add Witness
                    </button>
                  </div>

                  {witnesses.map((w, i) => (
                    <div key={i} style={{ padding: "12px 14px", borderRadius: 9, border: "1px solid #eceef0", background: "#fff", marginBottom: 8 }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0F2A4A" }}>Witness {i + 1}</div>
                        {witnesses.length > 1 && (
                          <button onClick={() => removeWitness(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e63946", padding: 2, display: "flex", alignItems: "center" }}>
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Input label="Full name" value={w.name} onChange={(e) => updateWitness(i, "name", e.target.value)} placeholder={`Witness ${i + 1} full name`} />
                        <Input label="Address" value={w.address} onChange={(e) => updateWitness(i, "address", e.target.value)} placeholder="Door No., Street, City, District, Pincode" />
                      </div>
                    </div>
                  ))}

                  <div style={{ fontSize: 11, color: "#9aa1a9", padding: "8px 10px", borderRadius: 6, background: "#f5f7fa" }}>
                    Witnesses must be adults (18+) and not party to this transaction.
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => goToInitiateStep(2)}>Back</Button>
                  <Button disabled={!witnessesValid} onClick={() => goToInitiateStep(4)}>Continue</Button>
                </div>
              </div>
            )}

            {/* ── Step 4: Digital Consent ── */}
            {draft.step === 4 && (
              <div className="flex flex-col gap-4">
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F2A4A", marginBottom: 2 }}>Digital Consent</div>
                <div style={{ fontSize: 12.5, color: "#717881", lineHeight: 1.6 }}>
                  {draft.type === "partition"
                    ? "Both the seller and the buyer must give their digital consent before this partition transaction can proceed for official verification."
                    : "Both parties must give their digital consent before this transaction proceeds for official verification."}
                </div>

                {/* ── Seller / Initiator consent (OTP) ── */}
                <div style={{ ...SEC, border: draft.consentRequestId ? "1px solid #b6dfc6" : "1px solid #eceef0" }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: draft.consentRequestId ? "#f0f8f2" : "#f5f7fa", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {draft.consentRequestId
                        ? <CheckCircle2 size={15} style={{ color: "#1C7A4E" }} />
                        : <ShieldCheck size={15} style={{ color: "#717881" }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: draft.consentRequestId ? "#1C7A4E" : "#0F2A4A" }}>
                        {draft.type === "partition" ? "Seller Consent (You)" : "Your Consent (Initiator)"}
                      </div>
                      <div style={{ fontSize: 11, color: "#9aa1a9" }}>Verified via OTP on your registered mobile / email</div>
                    </div>
                  </div>

                  {!draft.consentRequestId ? (
                    <>
                      {!consentOtpSent ? (
                        <>
                          <div style={{ fontSize: 12, color: "#545c66", marginBottom: 10, lineHeight: 1.55 }}>
                            I, <strong>{currentUser?.name}</strong>, confirm that I am voluntarily initiating this{" "}
                            <strong>{draft.type === "partition" ? "Partial Sale / Subdivision" : draft.type}</strong> of parcel{" "}
                            <strong style={{ fontFamily: "monospace" }}>{draft.ulpin}</strong> to{" "}
                            <strong>{draft.buyerName || "the recipient"}</strong>{draft.type === "sale" && draft.price ? ` for ${inr(Number(draft.price) || 0)}` : ""}.
                            {draft.type === "partition" && " The area being transferred is " + (draft.sharePercent || "as surveyed") + "."}
                          </div>
                          {consentOtpError && <Alert type="error" message={consentOtpError} dismissible={false} />}
                          <Button size="sm" onClick={handleRequestConsentOtp} disabled={sendingConsentOtp}>
                            <ShieldCheck size={13} />
                            {sendingConsentOtp ? "Sending OTP…" : "Send OTP to verify consent"}
                          </Button>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 12, color: "#545c66", marginBottom: 12 }}>Enter the OTP sent to your registered contact to confirm your consent.</div>
                          <OtpBoxInput value={consentOtp} onChange={(v) => { setConsentOtp(v); setConsentOtpError(""); }} error={consentOtpError} />
                          <div className="flex gap-2" style={{ marginTop: 10 }}>
                            <Button size="sm" disabled={consentOtp.length !== 6 || busy} onClick={handleSendConsent}>
                              <ShieldCheck size={13} />
                              {busy ? "Confirming…" : "Confirm consent"}
                            </Button>
                            <button onClick={() => { setConsentOtpSent(false); setConsentOtp(""); }} style={{ fontSize: 12, color: "#717881", background: "none", border: "none", cursor: "pointer" }}>
                              Resend OTP
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: 12, color: "#1C7A4E", padding: "8px 10px", background: "#f0f8f2", borderRadius: 6 }}>
                      Your consent has been recorded digitally. A consent request has been sent to {draft.buyerName || "the recipient"}.
                    </div>
                  )}
                </div>

                {/* ── Buyer / Recipient consent ── */}
                {draft.consentRequestId && (
                  <div style={{ ...SEC, border: recipientHasConsented ? "1px solid #b6dfc6" : "1px solid #ffe0a0" }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: recipientHasConsented ? "#f0f8f2" : "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {recipientHasConsented
                          ? <CheckCircle2 size={15} style={{ color: "#1C7A4E" }} />
                          : <BellRing size={15} style={{ color: "#a07830" }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: recipientHasConsented ? "#1C7A4E" : "#7a5210" }}>
                          {draft.type === "partition" ? "Buyer Consent" : "Recipient Consent"} - {draft.buyerName || "Recipient"}
                        </div>
                        <div style={{ fontSize: 11, color: "#9aa1a9" }}>
                          {recipientHasConsented
                            ? `Consent given on ${consentStatus?.recipientConsentAt ?? "-"}`
                            : "Waiting for the recipient to log in and accept the consent request"}
                        </div>
                      </div>
                    </div>
                    {!recipientHasConsented && (
                      <div style={{ fontSize: 12, color: "#7a5210", lineHeight: 1.6, padding: "8px 10px", background: "#fffbeb", borderRadius: 6 }}>
                        {draft.type === "partition"
                          ? `The buyer (${draft.buyerName || "recipient"}) must log in to their SLATE citizen account and accept the consent request before the partition can proceed.`
                          : `${draft.buyerName || "The recipient"} must log in to their SLATE citizen account and accept the consent request.`}
                        {" "}This page will update automatically once they respond.
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, fontSize: 11, color: "#a07830" }}>
                          <Loader2 size={11} className="animate-spin" /> Checking for response every 4 seconds…
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => goToInitiateStep(3)}>Back</Button>
                  <Button disabled={!canProceedPastConsent} onClick={() => goToInitiateStep(5)}>
                    {canProceedPastConsent ? "Continue to Rule Checks" : "Waiting for consent…"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 5: Rule Checks ── */}
            {draft.step === 5 && (() => {
              const ecData = token?.ecData;
              const ecEntries: EcEntry[] = ecData?.entries ?? [];
              const activeEntries = ecEntries.filter((e) => e.status === "active");
              const releasedEntries = ecEntries.filter((e) => e.status === "released");
              const ecFail = activeEntries.length > 0;
              const disputeFail = !!(token?.dispute?.flag);
              const allOk = allChecksPass && !ecFail && !disputeFail;

              return (
                <div className="flex flex-col gap-4">

                  {/* ── Overall status banner ── */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", borderRadius: 8,
                    background: allOk ? "#edf7f1" : "#fef3f2",
                    border: `1.5px solid ${allOk ? "#a8d5b9" : "#f5c2bb"}`,
                  }}>
                    {allOk
                      ? <ShieldCheck size={20} style={{ color: "#1C7A4E", flexShrink: 0 }} />
                      : <ShieldAlert size={20} style={{ color: "#B0392F", flexShrink: 0 }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: allOk ? "#1C7A4E" : "#B0392F" }}>
                        {allOk ? "All checks passed. Ready to proceed to payment." : "Verification failed. Transfer cannot proceed."}
                      </div>
                      <div style={{ fontSize: 12, color: allOk ? "#2d8c5e" : "#7a2a1e", marginTop: 2, lineHeight: 1.4 }}>
                        {allOk
                          ? `${draft.ulpin} has no encumbrances, disputes, or ownership issues.`
                          : ecFail
                            ? `Active mortgage on ${draft.ulpin}. Register a Release Deed at the SRO to clear it.`
                            : disputeFail
                              ? `Court freeze / dispute on ${draft.ulpin}. CNR: ${token?.dispute?.cnr ?? "N/A"}. Transfer is blocked until the court order is vacated.`
                              : "One or more checks failed. Transaction will go to exception queue for officer review."}
                      </div>
                    </div>
                    <div style={{
                      padding: "3px 10px", borderRadius: 5, fontWeight: 700, fontSize: 11, flexShrink: 0,
                      background: allOk ? "#1C7A4E" : "#B0392F", color: "#fff", letterSpacing: "0.04em",
                    }}>
                      {allOk ? "CLEARED" : (ecFail || disputeFail) ? "BLOCKED" : "EXCEPTION"}
                    </div>
                  </div>

                  {/* ── Side-by-side: 30% Rule Checks | 70% EC Report ── */}
                  <div style={{ display: "grid", gridTemplateColumns: "38% 1fr", gap: 12, alignItems: "start" }}>

                    {/* LEFT 30%: Automated Rule Checks */}
                    <div style={{ ...SEC, padding: "14px 14px" }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#9aa1a9", marginBottom: 10 }}>
                        Automated Rule Checks
                      </div>
                      <div className="flex flex-col gap-2">
                        {checks.length === 0 ? (
                          <div style={{ fontSize: 12.5, color: "#9aa1a9" }}>Running checks…</div>
                        ) : checks.map((c) => (
                          <div key={c.label} className="flex items-start gap-2" style={{
                            padding: "10px 11px", borderRadius: 7,
                            background: c.pass ? "#f0f8f2" : "#fef3f2",
                            borderLeft: `3px solid ${c.pass ? "#1C7A4E" : "#B0392F"}`,
                          }}>
                            {c.pass
                              ? <CheckCircle2 size={13} style={{ color: "#1C7A4E", flexShrink: 0, marginTop: 1 }} />
                              : <XCircle size={13} style={{ color: "#B0392F", flexShrink: 0, marginTop: 1 }} />}
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: c.pass ? "#1C7A4E" : "#B0392F", lineHeight: 1.3 }}>{c.label}</div>
                              <div style={{ fontSize: 11, color: "#717881", marginTop: 2, lineHeight: 1.4 }}>{c.detail}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* RIGHT 70%: EC Report */}
                    <div style={{ ...SEC, padding: "14px 16px" }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#9aa1a9" }}>
                          EC Report · Encumbrances &amp; Disputes
                        </div>
                        {ecData && (
                          <div style={{ fontSize: 11.5, color: "#717881", textAlign: "right" as const }}>
                            <span style={{ fontWeight: 600, color: "#0F2A4A" }}>{ecData.sro}</span>
                            {" · "}Period: {ecData.searchPeriod.from} – {ecData.searchPeriod.to}
                          </div>
                        )}
                      </div>

                      {ecEntries.length === 0 ? (
                        <div className="flex items-center gap-3" style={{ padding: "16px 18px", borderRadius: 8, background: disputeFail ? "#fef3f2" : "#f0f8f2", border: `1px solid ${disputeFail ? "#f5c2bb" : "#b6dfc6"}` }}>
                          {disputeFail
                            ? <XCircle size={20} style={{ color: "#B0392F", flexShrink: 0 }} />
                            : <CheckCircle2 size={20} style={{ color: "#1C7A4E", flexShrink: 0 }} />}
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: disputeFail ? "#7a2a1e" : "#1C7A4E" }}>
                              {disputeFail ? "No mortgage on record - but a court dispute exists (see below)" : "No encumbrances on record"}
                            </div>
                            <div style={{ fontSize: 12, color: disputeFail ? "#7a2a1e" : "#2d8c5e", marginTop: 2 }}>
                              {disputeFail
                                ? "EC shows no registered mortgage or charge. However, a court-ordered freeze blocks this transfer."
                                : "No mortgage, charge, lien, or court decree found on this parcel during the search period."}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {activeEntries.map((e) => (
                            <div key={e.srNo} style={{ borderRadius: 8, border: "1.5px solid #f5c2bb", overflow: "hidden" }}>
                              <div className="flex items-center justify-between" style={{ padding: "9px 14px", background: "#fde2de" }}>
                                <div className="flex items-center gap-2">
                                  <XCircle size={14} style={{ color: "#B0392F" }} />
                                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#7a2a1e" }}>Active Mortgage - Sr. No. {e.srNo}</span>
                                </div>
                                <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 9px", borderRadius: 4, background: "#B0392F", color: "#fff" }}>ACTIVE</span>
                              </div>
                              <div style={{ padding: "12px 14px", background: "#fffafa", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "9px 18px" }}>
                                <div><div style={{ fontSize: 10, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>Claimant (Bank)</div><div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F2A4A" }}>{e.claimant}</div></div>
                                <div><div style={{ fontSize: 10, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>Nature</div><div style={{ fontSize: 12.5, fontWeight: 600, color: "#0F2A4A" }}>{e.nature}</div></div>
                                <div><div style={{ fontSize: 10, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>Executant (Borrower)</div><div style={{ fontSize: 12.5, color: "#0F2A4A" }}>{e.executant}</div></div>
                                {e.marketValue && <div><div style={{ fontSize: 10, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>Loan / Market Value</div><div style={{ fontSize: 12.5, fontWeight: 700, color: "#B0392F" }}>₹{e.marketValue.toLocaleString("en-IN")}</div></div>}
                                <div><div style={{ fontSize: 10, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>Registration Date</div><div style={{ fontSize: 12.5, color: "#0F2A4A" }}>{e.registrationDate}</div></div>
                                <div><div style={{ fontSize: 10, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>Document No. / Year</div><div style={{ fontSize: 12.5, color: "#0F2A4A", fontFamily: "monospace" }}>{e.docNo} / {e.docYear}</div></div>
                                {e.bankBranch && <div style={{ gridColumn: "1 / -1" }}><div style={{ fontSize: 10, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>Bank Branch</div><div style={{ fontSize: 12.5, color: "#0F2A4A" }}>{e.bankBranch}</div></div>}
                              </div>
                            </div>
                          ))}
                          {releasedEntries.map((e) => (
                            <div key={e.srNo} style={{ borderRadius: 8, border: "1px solid #b6dfc6", overflow: "hidden" }}>
                              <div className="flex items-center justify-between" style={{ padding: "9px 14px", background: "#e8f5ec" }}>
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 size={14} style={{ color: "#1C7A4E" }} />
                                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1C7A4E" }}>Released Mortgage - Sr. No. {e.srNo}</span>
                                </div>
                                <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 9px", borderRadius: 4, background: "#1C7A4E", color: "#fff" }}>RELEASED</span>
                              </div>
                              <div style={{ padding: "12px 14px", background: "#f9fdfb", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "9px 18px" }}>
                                <div><div style={{ fontSize: 10, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>Claimant (Bank)</div><div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F2A4A" }}>{e.claimant}</div></div>
                                <div><div style={{ fontSize: 10, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>Nature</div><div style={{ fontSize: 12.5, color: "#0F2A4A" }}>{e.nature}</div></div>
                                <div><div style={{ fontSize: 10, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>Release Date</div><div style={{ fontSize: 12.5, fontWeight: 600, color: "#1C7A4E" }}>{e.releaseDate ?? "-"}</div></div>
                                <div><div style={{ fontSize: 10, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>Reg. Date</div><div style={{ fontSize: 12.5, color: "#717881" }}>{e.registrationDate}</div></div>
                                <div><div style={{ fontSize: 10, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>Document No. / Year</div><div style={{ fontSize: 12.5, color: "#717881", fontFamily: "monospace" }}>{e.docNo} / {e.docYear}</div></div>
                                {e.releaseDocNo && <div><div style={{ fontSize: 10, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>Release Doc No.</div><div style={{ fontSize: 12.5, color: "#0F2A4A", fontFamily: "monospace" }}>{e.releaseDocNo}</div></div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ── Dispute / Court Freeze card ── */}
                      {disputeFail && token?.dispute && (
                        <div style={{ borderRadius: 8, border: "1.5px solid #f5c2bb", overflow: "hidden", marginTop: ecEntries.length > 0 ? 12 : 0 }}>
                          <div className="flex items-center justify-between" style={{ padding: "9px 14px", background: "#fde2de" }}>
                            <div className="flex items-center gap-2">
                              <XCircle size={14} style={{ color: "#B0392F" }} />
                              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#7a2a1e" }}>Court Dispute / Land Freeze</span>
                            </div>
                            <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 9px", borderRadius: 4, background: "#B0392F", color: "#fff" }}>FROZEN</span>
                          </div>
                          <div style={{ padding: "12px 14px", background: "#fffafa", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "9px 18px" }}>
                            <div>
                              <div style={{ fontSize: 10, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>CNR No.</div>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F2A4A", fontFamily: "monospace" }}>{token.dispute.cnr ?? "N/A"}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>Dispute Type</div>
                              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0F2A4A" }}>{token.dispute.type ?? "Court Freeze"}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 }}>Status</div>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#B0392F" }}>Transfer Blocked</div>
                            </div>
                          </div>
                          <div style={{ padding: "10px 14px", background: "#fef3f2", borderTop: "1px solid #f5c2bb", fontSize: 12, color: "#7a2a1e", lineHeight: 1.6 }}>
                            <strong>Action required:</strong> This parcel is under a court-ordered freeze (CNR {token.dispute.cnr ?? "N/A"}). Transfer cannot proceed until the court order is vacated and the dispute flag is removed by the Court Admin.
                          </div>
                        </div>
                      )}

                      {ecFail && (
                        <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 8, background: "#fef3f2", border: "1px solid #f5c2bb", fontSize: 12.5, color: "#7a2a1e", lineHeight: 1.7 }}>
                          <strong>Action required:</strong> The above mortgage is still active. Visit the SRO to register a Release Deed (Document Type: Release of Mortgage). Once registered and the EC is updated, this transfer can proceed.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => goToInitiateStep(4)}>Back</Button>
                    <Button onClick={() => goToInitiateStep(6)} disabled={ecFail || disputeFail}>
                      {ecFail || disputeFail ? "Cannot Proceed" : "Continue to Payment"}
                    </Button>
                  </div>
                </div>
              );
            })()}

            {/* ── Step 6: Fees & Payment ── */}
            {draft.step === 6 && (
              <div className="flex flex-col gap-3">
                <div style={SEC}>
                  <div style={SEC_TITLE}>TN Registration Fees Breakdown</div>

                  {draft.type === "sale" && (
                    <div style={{ padding: "8px 10px", borderRadius: 7, background: "#f0f7ff", marginBottom: 8, fontSize: 11.5 }}>
                      <div className="flex justify-between">
                        <span style={{ color: "#0045a5" }}>Declared sale price</span>
                        <span style={{ fontWeight: 600 }}>{inr(Number(draft.price) || 0)}</span>
                      </div>
                      <div className="flex justify-between" style={{ marginTop: 3 }}>
                        <span style={{ color: "#0045a5" }}>Guideline value</span>
                        <span style={{ fontWeight: 600 }}>{inr(token?.financial?.guidanceValue ?? 0)}</span>
                      </div>
                      <div className="flex justify-between" style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid #cfe2ff" }}>
                        <span style={{ color: "#0045a5", fontWeight: 700 }}>Market value (higher of both)</span>
                        <span style={{ fontWeight: 700, color: "#0045a5" }}>{inr(marketValue)}</span>
                      </div>
                    </div>
                  )}

                  <DlGrid>
                    <DlRow label={`Stamp duty (${TN_STAMP_DUTY_PCT}% of market value)`} value={<strong style={{ color: "#0F2A4A" }}>{inr(stampDuty)}</strong>} />
                    <DlRow label={`Registration fee (${TN_REG_FEE_PCT}% of market value)`} value={<strong style={{ color: "#0F2A4A" }}>{inr(regFee)}</strong>} />
                    <DlRow label="Total government fees" full value={<strong style={{ color: "#0F2A4A", fontSize: 13 }}>{inr(totalFees)}</strong>} />
                    {draft.type === "sale" && draft.price && (
                      <DlRow label="Sale consideration + fees" full value={<strong style={{ color: "#0F2A4A", fontSize: 13 }}>{inr(totalPayable)}</strong>} />
                    )}
                  </DlGrid>
                  <div style={{ marginTop: 8, fontSize: 11, color: "#9aa1a9" }}>
                    Per Tamil Nadu Stamp Act: 7% stamp duty + 4% registration fee on the higher of declared consideration or government guideline value.
                  </div>

                  {tdsApplies && (
                    <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 7, background: "#fff8e1", border: "1px solid #ffe082" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#7a4800", marginBottom: 6 }}>TDS under Income Tax Act §194IA</div>
                      <div style={{ fontSize: 11.5, color: "#7a4800" }}>
                        Sale consideration is above Rs.50 lakh. Buyer must deduct TDS at 1% ({inr(tdsAmount)}) and remit via Form 26QB within 30 days.
                      </div>
                    </div>
                  )}
                </div>

                <div style={SEC}>
                  <div style={SEC_TITLE}>Payment Method</div>
                  <RadioGroup
                    label=""
                    value={draft.paymentMethod}
                    onChange={(v) => updateTxnDraft({ paymentMethod: v as "upi" | "card" })}
                    options={[{ label: "UPI", value: "upi" }, { label: "Card", value: "card" }]}
                    direction="horizontal"
                  />
                </div>

                {!draft.paymentDone ? (
                  <Button onClick={() => payForTransaction()}>Pay Fees: {inr(totalFees)}</Button>
                ) : (
                  <>
                    <Alert type="success" message={`Payment successful. Reference: ${draft.paymentRef}`} dismissible={false} />
                    {submitError && <Alert type="error" message={submitError} dismissible={false} />}
                    <Button onClick={handleSubmit} disabled={busy} fullWidth>
                      <CheckCircle2 size={14} /> {busy ? "Submitting..." : "Submit for Registration"}
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => goToInitiateStep(5)}>Back</Button>
              </div>
            )}

            {/* ── Step 7: Confirmation ── */}
            {draft.step === 7 && result && (
              <div className="flex flex-col gap-3 items-center text-center" style={{ padding: "10px 0" }}>
                {result.allClear ? (
                  <>
                    <CheckCircle2 size={36} style={{ color: "#1C7A4E" }} />
                    <div style={{ fontSize: 15, fontWeight: 700 }}>Transaction forwarded successfully</div>
                    <div style={{ fontSize: 12.5, color: "#717881" }}>
                      {isOfficer
                        ? draft.needsSurveyor || draft.type === "partition"
                          ? `${result.txnId} has been forwarded to the Surveyor and VAO queues in parallel for site verification.`
                          : `${result.txnId} has been forwarded directly to the VAO verification queue.`
                        : `${result.txnId} has been submitted for Registration Officer review.`}
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle size={36} style={{ color: "#B0392F" }} />
                    <div style={{ fontSize: 15, fontWeight: 700 }}>Routed to Exception Queue</div>
                    <div style={{ fontSize: 12.5, color: "#717881" }}>
                      Rule checks failed. An officer will review {result.txnId} before it can proceed.
                    </div>
                  </>
                )}
                <div className="flex gap-2">
                  {currentUser?.portal === "officer" ? (
                    <Button variant="outline" onClick={() => navigate(ROUTES.PATHS.APP.SLATE.OFFICER_QUEUE)}>Back to Queue</Button>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => navigate(ROUTES.PATHS.APP.SLATE.CITIZEN_STATUS)}>Track Status</Button>
                      <Button onClick={() => navigate(ROUTES.PATHS.APP.SLATE.CITIZEN_PROPERTIES)}>My Properties</Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </Card>
          </div>

          {/* Sidebar - tabbed: Parcel Summary | Flow */}
          <SidebarTabs
            token={token}
            draft={draft}
            marketValue={marketValue}
            stampDuty={stampDuty}
            regFee={regFee}
            witnesses={witnesses}
          />
      </div>
    </div>
  );
}
