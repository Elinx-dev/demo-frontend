import { ROUTES } from "@/navigation/routes";
import type { SlateHistoryKind } from "../types/slate.types";

const PATH = ROUTES.PATHS.APP.SLATE;

export interface SlateNotification {
  id: string;
  ts: string;
  title: string;
  detail: string;
  kind: SlateHistoryKind;
  path: string;
  isRead: boolean;
}

/** Maps the real backend's NotificationInstance shape onto the display shape
 * the header bell and Notifications page render. */
export function mapNotification(n: {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  dataPayload?: { kind?: string; path?: string } | null;
}): SlateNotification {
  return {
    id: n.id,
    ts: n.createdAt,
    title: n.title,
    detail: n.body,
    kind: (n.dataPayload?.kind as SlateHistoryKind) ?? "info",
    path: n.dataPayload?.path ?? PATH.DASHBOARD,
    isRead: n.isRead,
  };
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Buckets a timestamp into a relative-time label (Today / Yesterday / This week / ...), falling back to "Month YYYY" for anything older than last month. */
export function relativeBucket(ts: string, now: Date = new Date()): string {
  const d = new Date(ts.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "Earlier";

  const today = startOfDay(now);
  const that = startOfDay(d);
  const diffDays = Math.round((today.getTime() - that.getTime()) / 86400000);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "This week";
  if (diffDays <= 14) return "Last week";
  if (that.getMonth() === today.getMonth() && that.getFullYear() === today.getFullYear()) return "This month";

  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  if (that.getMonth() === lastMonth.getMonth() && that.getFullYear() === lastMonth.getFullYear()) return "Last month";

  return that.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export const HELP_TOPICS: { q: string; a: string }[] = [
  { q: "How do I sell or gift a parcel?", a: "Open the parcel in My Properties, then choose Initiate Transaction. RegMutate runs pre-checks automatically before sending it to the Registration Officer." },
  { q: "Why are some actions disabled on a parcel?", a: "A parcel must be Active to transact. If it shows Transfer Blocked, Locked, or Disputed, an encumbrance, succession case, or court order is in progress." },
  { q: "What does the maker-checker toggle do?", a: "It simulates two separate Registration Officers. A Maker reviews and submits a transaction; a different officer acting as Checker must approve it before TRANSFER executes - no single officer can commit a transfer alone." },
  { q: "Why was my transaction routed to Exception Review?", a: "It failed an automatic rule check - usually an active mortgage or an open court case on the parcel. It is not rejected outright; an officer reviews it with full context." },
  { q: "Is my identity real?", a: "Your SLATE account is real and persisted, verified through OTP and your password. Aadhaar-based eKYC verification is simulated for this rollout - your Aadhaar number is stored masked and is not verified against UIDAI." },
];
