import type { SlateToken, TxnDraft } from "../types/slate.types";

export function stampDutyBaseAmount(token: SlateToken | undefined, draft: TxnDraft): number {
  if (!token) return 0;
  if (draft.type === "sale") return Number(draft.price) || 0;
  if (draft.type === "partition") return Math.round((token.financial.guidanceValue * (Number(draft.sharePercent) || 0)) / 100);
  return token.financial.guidanceValue;
}

export function computeStampDuty(token: SlateToken | undefined, draft: TxnDraft, ratePercent: number): number {
  return Math.round((stampDutyBaseAmount(token, draft) * ratePercent) / 100);
}

export function defaultStampDutyCode(type: TxnDraft["type"]): string {
  if (type === "sale") return "SALE_DEED";
  if (type === "partition") return "PARTITION_DEED";
  return "GIFT_DEED_FAMILY";
}
