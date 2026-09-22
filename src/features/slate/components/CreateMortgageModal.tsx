import { useEffect, useState } from "react";
import { Modal } from "@/ui/primitives/Modal/Modal";
import { Button } from "@/ui/primitives/Button/Button";
import { Input } from "@/ui/primitives/Input/Input";
import { Select } from "@/ui/primitives/Select/Select";
import { Alert } from "@/ui/primitives/Alert/Alert";
import { useToast } from "@/ui/feedback/toast/useToast";
import { slateApi } from "../services/apiClient";
import type { SlateToken } from "../types/slate.types";

interface CreateMortgageModalProps {
  isOpen: boolean;
  onClose: () => void;
  ulpin?: string;
  token?: SlateToken | null;
  onCreated?: () => void;
}

export default function CreateMortgageModal({ isOpen, onClose, ulpin, token, onCreated }: CreateMortgageModalProps) {
  const toast = useToast();
  const [properties, setProperties] = useState<SlateToken[]>([]);
  const [selectedUlpin, setSelectedUlpin] = useState(ulpin ?? "");
  const [selectedToken, setSelectedToken] = useState<SlateToken | null>(token ?? null);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Equitable Mortgage");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedUlpin(ulpin ?? "");
    setSelectedToken(token ?? null);
    setAmount("");
    setType("Equitable Mortgage");
    if (!ulpin) {
      slateApi.citizen.getProperties().then(setProperties).catch(() => undefined);
    }
  }, [isOpen, ulpin, token]);

  useEffect(() => {
    if (ulpin || !selectedUlpin) return;
    slateApi.citizen.getPropertyDetail(selectedUlpin).then(setSelectedToken).catch(() => setSelectedToken(null));
  }, [selectedUlpin, ulpin]);

  const activeToken = ulpin ? token : selectedToken;
  const blocked = activeToken && (activeToken.encumbrance.flag || activeToken.dispute.flag || activeToken.state !== "active");

  const handleCreate = () => {
    if (!selectedUlpin || !activeToken) return;
    setSubmitting(true);
    slateApi.bank
      .createMortgage({ ulpin: selectedUlpin, amount: Number(amount) || 0, type, borrower: activeToken.ownership.owners.map((o) => o.name).join(", ") })
      .then(() => {
        toast.success(`Mortgage registered against ${selectedUlpin}. Token now Transfer Blocked.`);
        onCreated?.();
        onClose();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not create mortgage."))
      .finally(() => setSubmitting(false));
  };

  return (
    <Modal isOpen={isOpen} onClose={() => onClose()} size="sm" title="Create Mortgage">
      <div className="flex flex-col gap-3" style={{ padding: 20 }}>
        {ulpin ? (
          <div style={{ fontSize: 12.5, color: "#717881" }}>Parcel: <strong style={{ fontFamily: "monospace", color: "#0F2A4A" }}>{ulpin}</strong></div>
        ) : (
          <Select
            label="Parcel (ULPIN)"
            value={selectedUlpin}
            onChange={(e) => setSelectedUlpin(e.target.value)}
            options={properties.map((t) => ({ label: `${t.ulpin} · ${t.location.village}`, value: t.ulpin }))}
            placeholder="Select a parcel"
          />
        )}
        {activeToken && blocked && (
          <Alert
            type="warning"
            dismissible={false}
            message={
              activeToken.encumbrance.flag
                ? "This parcel already has an active mortgage."
                : activeToken.dispute.flag
                  ? "This parcel is under dispute and cannot be mortgaged."
                  : `Token is currently ${activeToken.state}. Not eligible for a new mortgage.`
            }
          />
        )}
        <Input label="Loan amount (₹)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Select
          label="Charge type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={[
            { label: "Equitable Mortgage", value: "Equitable Mortgage" },
            { label: "Registered Mortgage", value: "Registered Mortgage" },
            { label: "Lease", value: "Lease" },
          ]}
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onClose()}>Cancel</Button>
          <Button disabled={!selectedUlpin || !amount || !!blocked || submitting} onClick={handleCreate}>
            {submitting ? "Creating…" : "Create Mortgage"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
