import type { ReactNode } from "react";

interface PageHeadProps {
  title: ReactNode;
  sub?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
}

// `eyebrow` is intentionally accepted but no longer rendered - the breadcrumb already
// conveys portal/section context, so repeating it here was redundant.
export default function PageHead({ title, sub, actions }: PageHeadProps) {
  return (
    <div className="flex justify-between items-start gap-5 flex-wrap" style={{ marginBottom: 22 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: "#0F2A4A" }}>{title}</h1>
        {sub && <div style={{ color: "#717881", fontSize: 13.3, marginTop: 4, maxWidth: 640 }}>{sub}</div>}
      </div>
      {actions && <div className="flex gap-2.5 flex-shrink-0">{actions}</div>}
    </div>
  );
}
