import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Unlock } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { Button } from "@/ui/primitives/Button/Button";
import Badge from "@/ui/primitives/Badge/Badge";
import Empty from "@/ui/primitives/Empty/Empty";
import { ConfirmationModal } from "@/ui/primitives/ConformationModal/ConfirmationModal";
import { useToast } from "@/ui/feedback/toast/useToast";
import { slateApi } from "../../services/apiClient";
import PageHead from "../../components/PageHead";
import StateBadge from "../../components/StateBadge";
import { DlGrid, DlRow } from "../../components/DefinitionList";
import { inr } from "../../utils/format";
import type { SlateMortgage, SlateToken } from "../../types/slate.types";

export default function MortgageDetailPage() {
  const { mortgageId = "" } = useParams<{ mortgageId: string }>();
  const toast = useToast();
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [mortgage, setMortgage] = useState<SlateMortgage | null | undefined>(undefined);
  const [token, setToken] = useState<SlateToken | null>(null);

  const load = useCallback(() => {
    return slateApi.bank.getMortgages().then((all) => {
      const found = all.find((m) => m.id === mortgageId) ?? null;
      setMortgage(found);
      if (found) slateApi.citizen.getPropertyDetail(found.ulpin).then(setToken).catch(() => setToken(null));
    });
  }, [mortgageId]);

  useEffect(() => {
    load();
  }, [load]);

  if (mortgage === undefined) {
    return <div style={{ fontSize: 12.5, color: "#9aa1a9", padding: "20px 0" }}>Loading…</div>;
  }
  if (!mortgage) {
    return <Empty variant="no-data" title="Mortgage not found" description={`No mortgage found for ${mortgageId}.`} />;
  }

  const handleRelease = () => {
    slateApi.bank
      .releaseMortgage(mortgage.id)
      .then(() => {
        toast.success(`${mortgage.id} released. Token is Active again.`);
        setConfirmRelease(false);
        load();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not release mortgage."));
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="Bank Portal"
          title={mortgage.id}
          sub={`${mortgage.borrower} · ${mortgage.ulpin}`}
          actions={
            <>
              <Badge variant={mortgage.status === "active" ? "warning" : "success"}>{mortgage.status}</Badge>
              {mortgage.status === "active" && (
                <Button variant="outline" onClick={() => setConfirmRelease(true)}>
                  <Unlock size={14} /> Release Mortgage
                </Button>
              )}
            </>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "#0F2A4A" }}>Mortgage</div>
          <DlGrid>
            <DlRow label="Borrower" value={mortgage.borrower} />
            <DlRow label="Bank" value={mortgage.bank} />
            <DlRow label="Amount" value={inr(mortgage.amount)} />
            <DlRow label="Type" value={mortgage.type} />
            <DlRow label="Created" value={mortgage.created} />
            {mortgage.released && <DlRow label="Released" value={mortgage.released} />}
          </DlGrid>
        </Card>

        {token && (
          <Card>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F2A4A" }}>Token</div>
              <StateBadge state={token.state} size="sm" />
            </div>
            <DlGrid>
              <DlRow label="ULPIN" full value={token.ulpin} />
              <DlRow label="Location" value={`${token.location.village}, ${token.location.taluk}`} />
              <DlRow label="Area" value={token.physical.area} />
              <DlRow label="Owner(s)" full value={token.ownership.owners.map((o) => o.name).join(", ")} />
            </DlGrid>
          </Card>
        )}
      </div>
      </div>

      <ConfirmationModal
        isOpen={confirmRelease}
        onClose={() => setConfirmRelease(false)}
        onConfirm={handleRelease}
        variant="info"
        title="Release mortgage"
        message="This removes the transfer restriction on the parcel immediately. Use this only once the loan has been fully repaid."
        confirmText="Release"
      />
    </div>
  );
}
