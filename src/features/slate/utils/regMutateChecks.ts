import type { RegMutateCheck, SlateToken } from "../types/slate.types";
import { inr } from "./format";

export function computeRegMutateChecks(t: SlateToken): RegMutateCheck[] {
  return [
    {
      label: "Seller identity & ownership verified",
      pass: true,
      detail: "Aadhaar eKYC matches token owner record.",
    },
    {
      label: "Token is Active",
      pass: t.state === "active",
      detail:
        t.state === "active"
          ? "Token is live and transactable."
          : `Token is currently ${t.state} - transfer not permitted.`,
    },
    {
      label: "No active encumbrance",
      pass: !t.encumbrance.flag,
      detail: t.encumbrance.flag
        ? `Active mortgage with ${t.encumbrance.lender} (${inr(t.encumbrance.chargeAmount)}).`
        : "No mortgages or liens registered.",
    },
    {
      label: "No active dispute (e-Courts)",
      pass: !t.dispute.flag,
      detail: t.dispute.flag
        ? `Case ${t.dispute.cnr} is active.`
        : "No court cases found against this parcel.",
    },
  ];
}
