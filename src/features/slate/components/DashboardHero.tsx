import type { ReactNode } from "react";

interface DashboardHeroProps {
  eyebrow: string;
  title: string;
  sub: ReactNode;
  accent: string;
  icon: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}

export default function DashboardHero({ eyebrow, title, sub, accent, icon, meta, actions }: DashboardHeroProps) {
  return (
    <div
      className="flex items-start justify-between gap-5 flex-wrap"
      style={{
        background: `linear-gradient(120deg, ${accent} 0%, #0F2A4A 100%)`,
        borderRadius: 16,
        padding: "24px 26px",
        marginBottom: 22,
        position: "relative",
        overflow: "hidden",
        color: "#fff",
      }}
    >
      <div
        aria-hidden
        style={{ position: "absolute", right: -30, top: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.06)" }}
      />
      <div
        aria-hidden
        style={{ position: "absolute", right: 60, bottom: -50, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,.05)" }}
      />
      <div className="flex items-start gap-4" style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 13,
            background: "rgba(255,255,255,.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 10.8, textTransform: "uppercase", letterSpacing: ".08em", color: "rgba(255,255,255,.65)", fontWeight: 700, marginBottom: 4 }}>
            {eyebrow}
          </div>
          <div style={{ fontSize: 21, fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.8)", marginTop: 5, maxWidth: 480, lineHeight: 1.5 }}>{sub}</div>
          {meta && <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 10 }}>{meta}</div>}
        </div>
      </div>
      {actions && (
        <div className="flex gap-2 flex-shrink-0" style={{ position: "relative", zIndex: 1 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
