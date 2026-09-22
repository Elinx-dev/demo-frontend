import Badge from "@/ui/primitives/Badge/Badge";
import { STATE_DEFS } from "../data/slateData";
import type { SlateTokenState } from "../types/slate.types";

const VARIANT_MAP: Record<SlateTokenState, { variant: "draft" | "info" | "active" | "warning" | "danger" | "custom"; bg?: string; text?: string }> = {
  draft: { variant: "draft" },
  verified: { variant: "info" },
  active: { variant: "active" },
  blocked: { variant: "warning" },
  locked: { variant: "custom", bg: "#f4e9f7", text: "#8a3b9e" },
  disputed: { variant: "danger" },
  split: { variant: "custom", bg: "#e4f1f5", text: "#1d6f8c" },
  retired: { variant: "custom", bg: "#eceef0", text: "#555c64" },
};

export default function StateBadge({ state, size = "md" }: { state: SlateTokenState; size?: "sm" | "md" | "lg" }) {
  const def = STATE_DEFS[state] ?? { label: state };
  const cfg = VARIANT_MAP[state] ?? { variant: "draft" as const };
  return (
    <Badge variant={cfg.variant} bgColor={cfg.bg} textColor={cfg.text} dot size={size}>
      {def.label}
    </Badge>
  );
}
