import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Gavel } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { Button } from "@/ui/primitives/Button/Button";
import Badge from "@/ui/primitives/Badge/Badge";
import Empty from "@/ui/primitives/Empty/Empty";
import { Modal } from "@/ui/primitives/Modal/Modal";
import { Select } from "@/ui/primitives/Select/Select";
import { Alert } from "@/ui/primitives/Alert/Alert";
import { useToast } from "@/ui/feedback/toast/useToast";
import { slateApi } from "../../services/apiClient";
import PageHead from "../../components/PageHead";
import StateBadge from "../../components/StateBadge";
import { DlGrid, DlRow } from "../../components/DefinitionList";
import type { SlateDispute, SlateToken } from "../../types/slate.types";

const OUTCOME_OPTIONS = [
  { label: "Transfer to petitioner", value: "transfer" },
  { label: "Dismissed", value: "dismissed" },
  { label: "Partition", value: "partition" },
  { label: "Auction", value: "auction" },
];

const ORDER_TYPE_MAP = {
  transfer: "Transfer",
  dismissed: "Dismissed",
  partition: "Partition",
  auction: "Auction",
} as const;

export default function DisputeDetailPage() {
  const { disputeId = "" } = useParams<{ disputeId: string }>();
  const toast = useToast();
  const [dispute, setDispute] = useState<SlateDispute | null | undefined>(undefined);
  const [token, setToken] = useState<SlateToken | null>(null);
  const [showOrder, setShowOrder] = useState(false);
  const [outcome, setOutcome] = useState<"transfer" | "dismissed" | "partition" | "auction">("dismissed");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    return slateApi.court.getDisputes().then((all) => {
      const found = all.find((d) => d.id === disputeId) ?? null;
      setDispute(found);
      if (found) slateApi.citizen.getPropertyDetail(found.ulpin).then(setToken).catch(() => setToken(null));
    });
  }, [disputeId]);

  useEffect(() => {
    load();
  }, [load]);

  if (dispute === undefined) {
    return <div style={{ fontSize: 12.5, color: "#9aa1a9", padding: "20px 0" }}>Loading…</div>;
  }
  if (!dispute) {
    return <Empty variant="no-data" title="Dispute not found" description={`No dispute found for ${disputeId}.`} />;
  }

  const handleEnterOrder = () => {
    setSubmitting(true);
    setError("");
    slateApi.court
      .enterCourtOrder(dispute.id, {
        orderType: ORDER_TYPE_MAP[outcome],
        newOwners: outcome === "transfer" ? [{ id: "petitioner_" + Date.now(), name: dispute.filedBy, share: 100 }] : undefined,
      })
      .then(() => {
        toast.success(`Order entered for ${dispute.id}.`);
        setShowOrder(false);
        load();
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not enter this order."))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="Court / Admin Portal"
          title={dispute.id}
          sub={`${dispute.type} · ${dispute.ulpin}`}
          actions={
            <>
              <Badge variant={dispute.status === "frozen" ? "danger" : "success"}>{dispute.status.replace("_", " ")}</Badge>
              {dispute.status === "frozen" && (
                <Button onClick={() => setShowOrder(true)}>
                  <Gavel size={14} /> Enter Court Order
                </Button>
              )}
            </>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "#0F2A4A" }}>Case</div>
          <DlGrid>
            <DlRow label="Filed By" value={dispute.filedBy} />
            <DlRow label="Filed Against" value={dispute.filedAgainst} />
            <DlRow label="Filed" value={dispute.filed} />
            <DlRow label="Court" value={dispute.court} />
            {dispute.orderType && <DlRow label="Order Type" value={dispute.orderType} />}
            {dispute.orderDate && <DlRow label="Order Date" value={dispute.orderDate} />}
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
              <DlRow label="Owner(s)" full value={token.ownership.owners.map((o) => o.name).join(", ")} />
            </DlGrid>
          </Card>
        )}
      </div>
      </div>

      <Modal isOpen={showOrder} onClose={() => setShowOrder(false)} size="sm" title="Enter Court Order">
        <div className="flex flex-col gap-3" style={{ padding: 20 }}>
          <Select
            label="Outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as typeof outcome)}
            options={OUTCOME_OPTIONS}
          />
          {error && <Alert type="error" message={error} dismissible={false} />}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowOrder(false)}>Cancel</Button>
            <Button onClick={handleEnterOrder} disabled={submitting}>{submitting ? "Submitting…" : "Enter Order"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
