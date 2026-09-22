export function inr(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  if (n === 0) return "₹0";
  return "₹" + Number(n).toLocaleString("en-IN");
}

/** Formats an ISO/UTC timestamp string to a human-readable Indian locale date-time. */
export function fmtTs(ts: string | null | undefined): string {
  if (!ts) return "-";
  try {
    return new Date(ts).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  } catch {
    return ts;
  }
}

export function inrShort(n: number | null | undefined): string {
  if (!n) return "₹0";
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(2) + " Cr";
  if (n >= 100000) return "₹" + (n / 100000).toFixed(2) + " L";
  return inr(n);
}

export function nowStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    " " +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  );
}

export function randomTxnId(): string {
  return "TXN-100" + (200 + Math.floor(Math.random() * 99));
}

export function randomExceptionId(): string {
  return "EXC-" + (5500 + Math.floor(Math.random() * 400));
}

export function randomConsentId(): string {
  return "CR-" + (1100 + Math.floor(Math.random() * 900));
}

export function randomPaymentRef(): string {
  return (
    "PAY-" +
    nowStr().slice(0, 10).replace(/-/g, "") +
    "-" +
    Math.floor(100000 + Math.random() * 899999)
  );
}
