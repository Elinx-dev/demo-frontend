import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import * as Icons from "lucide-react";
import { ChevronRight, LogOut, UserRound } from "lucide-react";
import { useTheme } from "@/ui/theme/ThemeContext";
import { useAuth } from "@/app/AuthContext";
import { useSRAnnounce } from "@/app/ScreenReaderProvider";
import { createPortal } from "react-dom";
import NoMenuContent from "./NoMenuContent";

// ─── Design tokens (from Figma + ipClimb.theme.ts) ───────────────────────────
// Sidebar background: navy-700 (#182343 = theme.colors.primary)
// Active item:  white text + navy-600 (#101A35) bg + 3px left accent border
// Hover item:   white text + navy-600 (#101A35) bg
// Default item: navy-300 (#8A9BC2) text
// Section label: navy-300 (#8A9BC2) uppercase 10px
// Bottom user card: sits on navy-800 (#0D1429)
// Logout button: danger red pill
// ─────────────────────────────────────────────────────────────────────────────

const SIDEBAR_BG = "#182343"; // navy-700  - main sidebar bg
const SIDEBAR_BG_DARK = "#0D1429"; // navy-800  - user card + logout area
const ITEM_ACTIVE_BG = "#101A35"; // navy-800 hover/active bg
const ITEM_DEFAULT_TEXT = "#8A9BC2"; // navy-300  - default nav item text
const ITEM_ACTIVE_TEXT = "#FFFFFF";
const ITEM_HOVER_BG = "#101A35";
const ACCENT_BORDER = "#4A7EC7"; // left active indicator (accent blue)
const LOGO_AREA_BORDER = "rgba(255,255,255,0.08)";
const SECTION_LABEL_CLR = "#5B7099"; // section headings
const DIVIDER = "rgba(255,255,255,0.07)";

// ─── Icon resolver ────────────────────────────────────────────────────────────
const DynamicIcon = ({
  name,
  fallback = "📁",
}: {
  name?: string;
  fallback?: string;
}) => {
  if (!name) return <span style={{ fontSize: 12 }}>{fallback}</span>;
  let Icon = (Icons as any)[name];
  if (!Icon) {
    const pascal = name
      .split(/[-_ ]+/)
      .map((w: string) => w[0].toUpperCase() + w.slice(1))
      .join("");
    Icon = (Icons as any)[pascal];
  }
  if (!Icon) {
    const norm = name
      .split(/[-_ ]+/)
      .map((w: string) => w[0].toUpperCase() + w.slice(1).toLowerCase())
      .join("");
    Icon = (Icons as any)[norm];
  }
  if (!Icon) return <span style={{ fontSize: 12 }}>{fallback}</span>;
  return <Icon size={16} />;
};

// ─── Bootstrap reader ─────────────────────────────────────────────────────────
type SidebarBootstrapState = {
  identity?: { appUserName?: string; authUserName?: string };
};
function safeParseSidebar(raw: string | null) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function readSidebarBootstrapState(): SidebarBootstrapState | null {
  return (
    safeParseSidebar(sessionStorage.getItem("ipc_post_login_bootstrap")) ??
    (safeParseSidebar(sessionStorage.getItem("ipc_login_identity"))
      ? {
        identity: safeParseSidebar(
          sessionStorage.getItem("ipc_login_identity"),
        ),
      }
      : null)
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SidebarItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  policy?: string;
  children?: SidebarItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Sidebar({ items }: { items: SidebarItem[] }) {
  const { theme } = useTheme(); // kept for logout modal which uses surface colors
  const c = theme.colors;
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const announce = useSRAnnounce();
  const modalRef = useRef<HTMLDivElement>(null);
  const logoutTriggerRef = useRef<HTMLButtonElement>(null);
  const [bootstrapState, setBootstrapState] =
    useState<SidebarBootstrapState | null>(() => readSidebarBootstrapState());

  const width = collapsed ? 64 : 240;

  const toggleGroup = (id: string) =>
    setExpandedGroup((prev) => (prev === id ? null : id));
  const toggleCollapse = () =>
    setCollapsed((p) => {
      if (!p) setExpandedGroup(null);
      return !p;
    });

  useEffect(() => {
    const sync = () => setBootstrapState(readSidebarBootstrapState());
    const onUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      ce.detail ? setBootstrapState(ce.detail) : sync();
    };
    window.addEventListener("ipc:post-login-bootstrap", onUpdate);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ipc:post-login-bootstrap", onUpdate);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Focus trap for logout modal
  useEffect(() => {
    if (!showLogoutModal) return;
    const first = modalRef.current?.querySelector<HTMLElement>(
      "button,[href],[tabindex]:not([tabindex='-1'])",
    );
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowLogoutModal(false);
        return;
      }
      if (e.key !== "Tab") return;
      const els = Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(
          "button,[href],[tabindex]:not([tabindex='-1'])",
        ) ?? [],
      );
      if (!els.length) return;
      if (e.shiftKey && document.activeElement === els[0]) {
        e.preventDefault();
        els[els.length - 1].focus();
      } else if (
        !e.shiftKey &&
        document.activeElement === els[els.length - 1]
      ) {
        e.preventDefault();
        els[0].focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      logoutTriggerRef.current?.focus();
    };
  }, [showLogoutModal]);

  const effectiveUserName =
    bootstrapState?.identity?.appUserName ||
    bootstrapState?.identity?.authUserName ||
    "User";
  const effectiveUserEmail = bootstrapState?.identity?.authUserName || "";
  const userInitials = effectiveUserName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // ── Nav item renderer ─────────────────────────────────────────────────────
  const renderNavItem = (item: SidebarItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedGroup === item.id;

    if (hasChildren) {
      return (
        <div key={item.id} style={{ marginBottom: 1 }}>
          <button
            onClick={() => toggleGroup(item.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: collapsed ? "9px 0" : "8px 12px",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              background: isExpanded ? ITEM_ACTIVE_BG : "transparent",
              color: isExpanded ? ITEM_ACTIVE_TEXT : ITEM_DEFAULT_TEXT,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                flex: 1,
              }}
            >
              <DynamicIcon name={item.icon} fallback="📁" />

              {!collapsed && (
                <span
                  style={{
                    fontSize: depth === 0 ? 10 : 13,
                    fontWeight: depth === 0 ? 700 : 500,
                    textTransform: depth === 0 ? "uppercase" : "none",
                  }}
                >
                  {item.label}
                </span>
              )}
            </div>

            {!collapsed && (
              <ChevronRight
                size={12}
                style={{
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                }}
              />
            )}
          </button>

          {isExpanded && (
            <div
              style={{
                marginLeft: 16,
                paddingLeft: 8,
                borderLeft: `1px solid ${DIVIDER}`,
              }}
            >
              {item.children?.map((child) => renderNavItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // ── Leaf nav item ─────────────────────────────────────────────────────
    return (
      <NavLink
        key={item.id}
        to={item.path || "#"}
        title={collapsed ? item.label : undefined}
        style={({ isActive }) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: 9,
          padding: collapsed ? "9px 0" : "8px 12px",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: isActive ? 600 : 400,
          fontFamily: "var(--ipc-font-sans)",
          textDecoration: "none",
          transition: `all ${theme.motion.duration.fast}`,
          background: isActive ? ITEM_ACTIVE_BG : "transparent",
          color: isActive ? ITEM_ACTIVE_TEXT : ITEM_DEFAULT_TEXT,
          // Left accent border - only in expanded mode
          borderLeft: collapsed
            ? "none"
            : isActive
              ? `3px solid ${ACCENT_BORDER}`
              : "3px solid transparent",
          paddingLeft: collapsed ? undefined : isActive ? 9 : 12,
          overflow: "hidden",
          whiteSpace: "nowrap",
        })}
        onMouseEnter={(e) => {
          if (!e.currentTarget.getAttribute("aria-current")) {
            e.currentTarget.style.background = ITEM_HOVER_BG;
            e.currentTarget.style.color = ITEM_ACTIVE_TEXT;
          }
        }}
        onMouseLeave={(e) => {
          // NavLink re-applies its inline style on next render,
          // but we reset for cases where isActive is false
          if (!e.currentTarget.getAttribute("aria-current")) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = ITEM_DEFAULT_TEXT;
          }
        }}
      >
        {collapsed ? (
          <span style={{ display: "flex", color: "currentColor" }}>
            <DynamicIcon name={item.icon} fallback="📄" />
          </span>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              width: "100%",
              minWidth: 0,
            }}
          >
            <span
              style={{ display: "flex", flexShrink: 0, color: "currentColor" }}
            >
              <DynamicIcon name={item.icon} fallback="📄" />
            </span>
            <span
              style={{ overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}
            >
              {item.label}
            </span>
          </div>
        )}
      </NavLink>
    );
  };

  // ── Logout modal (kept on theme surface - white modal on dark overlay) ─────
  const logoutModal = showLogoutModal
    ? createPortal(
      <div
        onClick={() => setShowLogoutModal(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
        }}
        aria-hidden="true"
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 340,
            borderRadius: 16,
            padding: "28px 24px 24px",
            background: c.surface,
            border: `1px solid ${c.primaryBorder}`,
            boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
            textAlign: "center",
            animation: "modalPop 0.18s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: `${c.dangerBg}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <LogOut size={24} color={c.danger} />
          </div>
          <h2
            id="logout-dialog-title"
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: c.text,
              fontFamily: "var(--ipc-font-sans)",
            }}
          >
            Logging out?
          </h2>
          <p
            style={{
              fontSize: 13,
              color: c.textMuted,
              marginTop: 8,
              marginBottom: 0,
              lineHeight: 1.6,
            }}
          >
            You'll need to sign in again to access your account.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <button
              onClick={() => setShowLogoutModal(false)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 8,
                border: `1.5px solid ${c.primaryBorder}`,
                background: "transparent",
                cursor: "pointer",
                color: c.text,
                fontSize: 13,
                fontWeight: 500,
                transition: `all ${theme.motion.duration.fast}`,
                fontFamily: "var(--ipc-font-sans)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = c.primaryLight;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              Stay
            </button>
            <button
              onClick={logout}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 8,
                border: "none",
                background: c.danger,
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: `all ${theme.motion.duration.fast}`,
                fontFamily: "var(--ipc-font-sans)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "";
              }}
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
        <style>{`@keyframes modalPop { from { opacity:0; transform:scale(0.93) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
      </div>,
      document.body,
    )
    : null;

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <aside
      style={{
        width,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: SIDEBAR_BG,
        transition: `width ${theme.motion.duration?.base} ${theme.motion.easing?.standard}`,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        fontFamily: "var(--ipc-font-sans)",
      }}
    >
      {/* ── Logo area ──────────────────────────────────────────────────────── */}
      <div
        onClick={toggleCollapse}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: collapsed ? "14px 0" : "14px 16px",
          borderBottom: `1px solid ${LOGO_AREA_BORDER}`,
          flexShrink: 0,
          minHeight: 60,
          cursor: "pointer",
          transition: `padding ${theme.motion.duration.base}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/slate-logo.jpeg"
            alt="SLATE"
            style={{
              width: collapsed ? 36 : 40,
              height: collapsed ? 36 : 40,
              borderRadius: 8,
              objectFit: "cover",
              flexShrink: 0,
              transition: `width ${theme.motion.duration.base}`,
            }}
          />
          {!collapsed && (
            <span style={{ fontWeight: 700, fontSize: 15, color: "#fff", letterSpacing: ".02em" }}>SLATE</span>
          )}
        </div>
        {/* {!collapsed && (
          <span style={{ display: "flex", color: SECTION_LABEL_CLR, flexShrink: 0 }}>
            <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} />
          </span>
        )} */}
      </div>

      {/* ── Nav items ──────────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          minHeight: 0,
        }}
      >
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            padding: collapsed ? "12px 8px" : "16px 10px",
          }}
        >
          {items.length > 0 ? (
            items.map((item) => renderNavItem(item, 0))
          ) : (
            <NoMenuContent collapsed={collapsed} />
          )}
        </nav>
      </div>

      {/* ── User card ──────────────────────────────────────────────────────── */}
      <div
        style={{
          background: SIDEBAR_BG_DARK,
          borderTop: `1px solid ${DIVIDER}`,
          padding: collapsed ? "10px 8px" : "12px 12px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "6px" : "8px 10px",
            borderRadius: 8,
            cursor: "pointer",
            transition: `background ${theme.motion.duration.fast}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          {/* Avatar circle */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              border: "1.5px solid rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {userInitials || <UserRound size={16} />}
          </div>

          {!collapsed && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                flex: 1,
              }}
            >
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#FFFFFF",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  lineHeight: 1.3,
                }}
              >
                {effectiveUserName}
              </span>
              {effectiveUserEmail && (
                <span
                  style={{
                    fontSize: 11,
                    color: ITEM_DEFAULT_TEXT,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    lineHeight: 1.3,
                    marginTop: 1,
                  }}
                >
                  {effectiveUserEmail}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Logout button ───────────────────────────────────────────────────── */}
      <div
        style={{
          background: SIDEBAR_BG_DARK,
          padding: collapsed ? "8px" : "8px 12px 12px",
        }}
      >
        <button
          ref={logoutTriggerRef}
          onClick={() => {
            setShowLogoutModal(true);
            announce("Logout confirmation dialog opened");
          }}
          aria-label="Logout"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 8,
            padding: collapsed ? "9px 0" : "9px 12px",
            borderRadius: 8,
            border: `1px solid rgba(226, 75, 74, 0.3)`,
            cursor: "pointer",
            background: "rgba(226, 75, 74, 0.10)",
            color: "#E2857A",
            transition: `all ${theme.motion.duration.fast}`,
            fontWeight: 500,
            fontSize: 13,
            fontFamily: "var(--ipc-font-sans)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#E24B4A";
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.borderColor = "#E24B4A";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(226, 75, 74, 0.10)";
            e.currentTarget.style.color = "#E2857A";
            e.currentTarget.style.borderColor = "rgba(226, 75, 74, 0.3)";
          }}
        >
          <LogOut size={15} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {logoutModal}

      <style>{`
        /* Sidebar scrollbar - thin, matches sidebar bg */
        aside::-webkit-scrollbar { width: 4px; }
        aside::-webkit-scrollbar-track { background: transparent; }
        aside::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
        aside::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.22); }

        /* Network status indicator - removed visual noise */
      `}</style>
    </aside>
  );
}
