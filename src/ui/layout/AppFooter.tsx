import React from "react";
import { useTheme } from "@/ui/theme/ThemeContext";
import { LogoMark, type Breadcrumb } from "./TopHeader";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/navigation/routes";

// ─── AppFooter ────────────────────────────────────────────────────────────────

interface FooterProps {
  breadcrumbs?: Breadcrumb[];
  companyName?: string;
  logoSrc?: string;
  logoFallbackInitial?: string;
  userName?: string;
  userAvatarSrc?: string;
  userStatus?: "online" | "offline" | "busy" | "away";
  onProfileClick?: () => void;
}

const YEAR = new Date().getFullYear();

const links = [
  {
    heading: "Product",
    items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Masters", href: "/masters" },
      { label: "Reports", href: "/reports" },
      { label: "Settings", href: "/settings" },
    ],
  },
  {
    heading: "Support",
    items: [
      { label: "Documentation", href: "#" },
      { label: "Release Notes", href: "#" },
      { label: "Help Center", href: "#" },
      { label: "Contact Us", href: "#" },
    ],
  },
  {
    heading: "Legal",
    items: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
      { label: "Data Processing", href: "#" },
    ],
  },
];

const statusItems = [
  { label: "API", ok: true },
  { label: "Database", ok: true },
  { label: "Storage", ok: false },
];
const DARK_THEMES = ["dark", "midnight"] as const;
export const AppFooter: React.FC<FooterProps> = ({
  logoSrc,
  companyName = "SLATE",
  logoFallbackInitial,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const navigate = useNavigate();
  const isDark = (DARK_THEMES as readonly string[]).includes(theme.name);
  // ── Footer uses surface/background - NOT accent ────────────────────────────
  // Accent background makes all text invisible; use a deep surface instead.
  const footerBg = c.primaryBorder;
  const borderCol = c.primaryBorder;
  const headingCol = c.text;
  const bodyCol = c.textMuted;
  const accentCol = c.accent ?? "#6366f1";

  return (
    <footer
      style={{
        background: footerBg,
        borderTop: `1px solid ${borderCol}`,
        marginTop: "auto",
        transition: "background 0.25s, border-color 0.25s",
      }}
    >
      {/* ── Main grid ── */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 32px 32px",
          display: "grid",
          // Responsive: brand col wider, 3 link cols equal
          gridTemplateColumns: "minmax(220px, 1.6fr) repeat(3, 1fr)",
          gap: 40,
        }}
        // Inline responsive override via a style tag is not possible here,
        // so we rely on minmax - on very narrow screens this wraps naturally.
      >
        {/* ── Brand column ────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Logo + company name - fixed size, aligned */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 120,
                height: 40,
                flexShrink: 0,
                borderRadius: 10,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `${accentCol}18`,
                border: `1px solid ${accentCol}30`,
              }}
            >
              <LogoMark
                src={logoSrc}
                initial={logoFallbackInitial ?? companyName?.[0]}
                accent={accentCol}
                size={80}
                onClick={() => navigate(ROUTES.PATHS.APP.COMPONENT_LIBRARY)}
              />
            </div>
            {/* <span style={{
                            fontSize:      15,
                            fontWeight:    700,
                            color:         headingCol,
                            letterSpacing: "-0.2px",
                        }}>
                            {companyName}
                        </span> */}
          </div>

          {/* Tagline */}
          <p
            style={{
              fontSize: 12.5,
              color: isDark ? "#f0f0f0" : "#111111",
              lineHeight: 1.7,
              margin: 0,
              maxWidth: 260,
            }}
          >
            Enterprise-grade platform for cold storage management, logistics,
            and supply chain visibility.
          </p>

          {/* System status card */}
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              gap: 6,
              background: c.primaryLight ?? c.background,
              border: `1px solid ${borderCol}`,
              borderRadius: 10,
              padding: "10px 14px",
              alignSelf: "flex-start", // don't stretch full width
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: bodyCol,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                margin: "0 0 4px",
              }}
            >
              System Status
            </p>
            {statusItems.map((s) => (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  minWidth: 160,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: s.ok ? c.success : c.danger,
                    boxShadow: s.ok
                      ? `0 0 5px ${c.success}88`
                      : `0 0 5px ${c.danger}88`,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 11.5,
                    color: isDark ? "#f0f0f0" : "#111111",
                    flex: 1,
                  }}
                >
                  {s.label}
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: s.ok ? c.success : c.danger,
                  }}
                >
                  {s.ok ? "Operational" : "Degraded"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Link columns ────────────────────────────────────────────── */}
        {links.map((group) => (
          <div key={group.heading}>
            <p
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: headingCol,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                margin: "0 0 14px",
              }}
            >
              {group.heading}
            </p>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 9,
              }}
            >
              {group.items.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    style={{
                      fontSize: 13,
                      color: isDark ? "#f0f0f0" : "#111111",
                      textDecoration: "none",
                      transition: "color 0.15s",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = accentCol)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = bodyCol)
                    }
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: `1px solid ${borderCol}`,
          padding: "14px 32px",
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <p style={{ fontSize: 11.5, color: bodyCol, margin: 0 }}>
          © {YEAR} SLATE. All rights reserved.
        </p>

        {/* Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "v1.0.0", mono: true, accent: false },
            { label: `${theme.name} theme`, mono: true, accent: true },
            { label: "React 18 · TypeScript", mono: false, accent: false },
          ].map((b) => (
            <span
              key={b.label}
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 999,
                fontFamily: b.mono ? "inherit" : "inherit",
                textTransform: b.label.includes("theme")
                  ? "capitalize"
                  : "none",
                border: b.accent
                  ? `1px solid ${accentCol}44`
                  : `1px solid ${borderCol}`,
                background: b.accent ? `${accentCol}12` : "transparent",
                color: isDark ? "#f0f0f0" : "#111111",
              }}
            >
              {b.label}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
};
