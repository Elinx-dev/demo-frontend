import { useState } from "react";
import { Search, CheckCircle2, XCircle, Landmark, MapPin } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { Button } from "@/ui/primitives/Button/Button";
import { Input } from "@/ui/primitives/Input/Input";
import { Alert } from "@/ui/primitives/Alert/Alert";
import { slateApi } from "../../services/apiClient";
import PageHead from "../../components/PageHead";
import StateBadge from "../../components/StateBadge";
import ParcelMap from "../../components/ParcelMap";
import { DlGrid, DlRow } from "../../components/DefinitionList";
import CreateMortgageModal from "../../components/CreateMortgageModal";
import { inr, inrShort } from "../../utils/format";
import type { SlateToken } from "../../types/slate.types";

export default function EncumbranceSearchPage() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState("");
  const [token, setToken] = useState<SlateToken | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const clean = token && !token.encumbrance.flag && !token.dispute.flag && token.state === "active";

  const handleSearch = () => {
    const ulpin = query.trim();
    if (!ulpin) return;
    setSearched(ulpin);
    setSearching(true);
    setNotFound(false);
    slateApi.bank
      .searchEncumbrance(ulpin)
      .then((r) => setToken(r.token))
      .catch(() => {
        setToken(null);
        setNotFound(true);
      })
      .finally(() => setSearching(false));
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead eyebrow="Bank Portal" title="Encumbrance Search" sub="Search a ULPIN to check mortgages, liens, and disputes before approving a loan." />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
      <Card style={{ marginBottom: 16 }}>
        <div className="flex gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter ULPIN, e.g. TN-CGL-045-002-A" startAdornment={<Search size={15} />} />
          <Button onClick={handleSearch} disabled={searching}>{searching ? "Searching…" : "Search"}</Button>
        </div>
      </Card>

      {searched && notFound && <Alert type="error" message={`No token found for "${searched}".`} dismissible={false} />}

      {token && (
        <div className="grid gap-4" style={{ gridTemplateColumns: "1.3fr 1fr" }}>
          <Card>
            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "#0F2A4A" }}>{token.ulpin}</div>
              <StateBadge state={token.state} />
            </div>

            <div className="flex items-center gap-2.5" style={{ padding: "10px 12px", borderRadius: 8, marginBottom: 14, background: clean ? "#f0f8f2" : "#fdf6f4" }}>
              {clean ? <CheckCircle2 size={18} style={{ color: "#1C7A4E" }} /> : <XCircle size={18} style={{ color: "#B0392F" }} />}
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                {clean ? "Clean: eligible for a new mortgage" : "Not eligible: existing encumbrance, dispute, or inactive state"}
              </div>
            </div>

            <DlGrid>
              <DlRow label="Owner(s)" full value={token.ownership.owners.map((o) => o.name).join(", ")} />
              <DlRow label="Location" value={`${token.location.village}, ${token.location.taluk}`} />
              <DlRow label="Area" value={token.physical.area} />
              <DlRow label="Classification" value={token.physical.classification} />
              <DlRow label="Ownership Type" value={token.ownership.ownershipType} />
              <DlRow label="Tax Status" value={token.financial.taxStatus} />
              <DlRow label="Encumbrance" value={token.encumbrance.flag ? `${token.encumbrance.lienType}, ${token.encumbrance.lender} (${inr(token.encumbrance.chargeAmount)})` : "None"} full />
              <DlRow label="Dispute" value={token.dispute.flag ? token.dispute.status : "Clear"} full />
            </DlGrid>

            <Button style={{ marginTop: 14 }} disabled={!clean} onClick={() => setShowCreate(true)}>
              <Landmark size={14} /> Create Mortgage on this Parcel
            </Button>
          </Card>

          <Card>
            <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
              <MapPin size={15} style={{ color: "#8f6a26" }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F2A4A" }}>Lending summary</div>
            </div>
            <ParcelMap gps={token.location.gpsCentroid} height={180} />
            <div style={{ marginTop: 12 }}>
              <DlGrid>
                <DlRow label="Guideline Value" full value={inrShort(token.financial.guidanceValue)} />
                <DlRow label="Last Sale Value" value={token.financial.lastSaleValue ? inrShort(token.financial.lastSaleValue) : "-"} />
                <DlRow label="Stamp Duty Ref" value={token.financial.stampDutyRef ?? "-"} />
              </DlGrid>
            </div>
            <div style={{ fontSize: 11, color: "#9aa1a9", marginTop: 12, paddingTop: 12, borderTop: "1px solid #eceef0", lineHeight: 1.6 }}>
              Guideline Value is the IGRS-assessed minimum value, used as a baseline for loan-to-value calculations. Encumbrance and dispute flags above are pulled live from the chain; if either is set, the parcel cannot be mortgaged until resolved.
            </div>
          </Card>
        </div>
      )}
      </div>

      <CreateMortgageModal isOpen={showCreate} onClose={() => setShowCreate(false)} ulpin={token?.ulpin} token={token} />
    </div>
  );
}
