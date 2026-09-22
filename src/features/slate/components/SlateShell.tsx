import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Home,
  ArrowRightLeft,
  UploadCloud,
  Radar,
  ListChecks,
  ClipboardList,
  AlertTriangle,
  Stamp,
  ScrollText,
  Search,
  Landmark,
  Gavel,
  Database,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronRight,
  LogOut,
  User as UserIcon,
  Bell,
  HelpCircle,
  Layers,
  MapPin,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  CalendarCheck,
  Building2,
} from "lucide-react";
import Avatar from "@/ui/primitives/Avatar/Avatar";
import { Popover } from "@/ui/primitives/Popover/Popover";
import { Input } from "@/ui/primitives/Input/Input";
import { ConfirmationModal } from "@/ui/primitives/ConformationModal/ConfirmationModal";
import { ROUTES } from "@/navigation/routes";
import { useSlateStore } from "../state/SlateProvider";
import { slateApi } from "../services/apiClient";
import { mapNotification, relativeBucket, HELP_TOPICS, type SlateNotification } from "../utils/notifications";
import { jurisdictionLabel } from "../utils/jurisdiction";
import { isPathPermitted } from "../utils/routeAccess";
import Empty from "@/ui/primitives/Empty/Empty";
import StateBadge from "./StateBadge";
import SlateProfileModal from "./SlateProfileModal";
import type { SlatePortal, SlateToken } from "../types/slate.types";

const SLATE_PATHS = ROUTES.PATHS.APP.SLATE;

const KIND_DOT: Record<string, string> = { ok: "#1C7A4E", warn: "#B8722E", danger: "#B0392F", info: "#B8923D" };

interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
  menuCode?: string;
}

const PORTAL_META: Record<SlatePortal, { label: string; icon: ReactNode; accent: string }> = {
  citizen: { label: "Citizen Portal", icon: <UserIcon size={15} />, accent: "#1d4670" },
  officer: { label: "Registration Officer Portal", icon: <Stamp size={15} />, accent: "#1d4670" },
  bank: { label: "Bank Portal", icon: <Landmark size={15} />, accent: "#1d4670" },
  court: { label: "Admin Portal", icon: <Gavel size={15} />, accent: "#1d4670" },
  surveyor: { label: "Surveyor Portal", icon: <Compass size={15} />, accent: "#1d4670" },
  revenue: { label: "Revenue Department Portal", icon: <Layers size={15} />, accent: "#1d4670" },
  vao: { label: "VAO Officer Portal", icon: <ShieldCheck size={15} />, accent: "#1d4670" },
  tahsildar: { label: "Thasildar Portal", icon: <ShieldCheck size={15} />, accent: "#1d4670" },
};

const PORTAL_NAV: Record<SlatePortal, NavItem[]> = {
  citizen: [
    { label: "Dashboard", icon: <LayoutDashboard size={17} />, path: SLATE_PATHS.DASHBOARD, menuCode: "citizen.dashboard" },
    { label: "My Properties", icon: <Home size={17} />, path: SLATE_PATHS.CITIZEN_PROPERTIES, menuCode: "citizen.properties" },
    { label: "Initiate Transaction", icon: <ArrowRightLeft size={17} />, path: SLATE_PATHS.CITIZEN_INITIATE, menuCode: "citizen.initiate" },
    { label: "Documents", icon: <UploadCloud size={17} />, path: SLATE_PATHS.CITIZEN_DOCUMENTS, menuCode: "citizen.documents" },
    { label: "Track Status", icon: <Radar size={17} />, path: SLATE_PATHS.CITIZEN_STATUS, menuCode: "citizen.status" },
    { label: "Incoming Transfers", icon: <ArrowRightLeft size={17} />, path: SLATE_PATHS.CITIZEN_INCOMING, menuCode: "citizen.incoming" },
  ],
  officer: [
    { label: "Dashboard", icon: <LayoutDashboard size={17} />, path: SLATE_PATHS.DASHBOARD, menuCode: "officer.dashboard" },
    { label: "Pending Queue", icon: <ListChecks size={17} />, path: SLATE_PATHS.OFFICER_QUEUE, menuCode: "officer.queue" },
    { label: "Initiate Transaction", icon: <ArrowRightLeft size={17} />, path: SLATE_PATHS.CITIZEN_INITIATE, menuCode: "officer.initiate" },
    { label: "Property List", icon: <Building2 size={17} />, path: SLATE_PATHS.OFFICER_PROPERTIES, menuCode: "officer.properties" },
    { label: "Exceptions", icon: <AlertTriangle size={17} />, path: SLATE_PATHS.OFFICER_EXCEPTIONS, menuCode: "officer.exceptions" },
    { label: "Mint Token", icon: <Stamp size={17} />, path: SLATE_PATHS.OFFICER_MINT, menuCode: "officer.mint" },
    { label: "Audit Trail", icon: <ScrollText size={17} />, path: SLATE_PATHS.OFFICER_AUDIT, menuCode: "officer.audit" },
  ],
  bank: [
    { label: "Dashboard", icon: <LayoutDashboard size={17} />, path: SLATE_PATHS.DASHBOARD, menuCode: "bank.dashboard" },
    { label: "Encumbrance Search", icon: <Search size={17} />, path: SLATE_PATHS.BANK_SEARCH, menuCode: "bank.search" },
    { label: "Manage Mortgages", icon: <Landmark size={17} />, path: SLATE_PATHS.BANK_MORTGAGES, menuCode: "bank.mortgages" },
  ],
  court: [
    { label: "Dashboard", icon: <LayoutDashboard size={17} />, path: SLATE_PATHS.DASHBOARD, menuCode: "court.dashboard" },
    { label: "Disputes & Court Orders", icon: <Gavel size={17} />, path: SLATE_PATHS.COURT_DISPUTES, menuCode: "court.disputes" },
    { label: "Audit Trail", icon: <ScrollText size={17} />, path: SLATE_PATHS.COURT_AUDIT, menuCode: "court.audit" },
    { label: "Master Data / Demo Seeding", icon: <Database size={17} />, path: SLATE_PATHS.COURT_ADMIN, menuCode: "court.admin" },
  ],
  surveyor: [
    { label: "Dashboard", icon: <LayoutDashboard size={17} />, path: SLATE_PATHS.DASHBOARD, menuCode: "surveyor.dashboard" },
    { label: "Site Visit Plan", icon: <CalendarCheck size={17} />, path: SLATE_PATHS.SURVEYOR_SITE_VISITS, menuCode: "surveyor.visits" },
    { label: "Visit Data Entry", icon: <ClipboardList size={17} />, path: SLATE_PATHS.SURVEYOR_QUEUE, menuCode: "surveyor.queue" },
  ],
  revenue: [
    { label: "Dashboard", icon: <LayoutDashboard size={17} />, path: SLATE_PATHS.DASHBOARD, menuCode: "revenue.dashboard" },
    { label: "Revenue Approval Queue", icon: <ListChecks size={17} />, path: SLATE_PATHS.REVENUE_QUEUE, menuCode: "revenue.queue" },
    { label: "Audit Trail", icon: <ScrollText size={17} />, path: SLATE_PATHS.OFFICER_AUDIT, menuCode: "revenue.audit" },
  ],
  vao: [
    { label: "Dashboard", icon: <LayoutDashboard size={17} />, path: SLATE_PATHS.DASHBOARD, menuCode: "vao.dashboard" },
    { label: "Site Visit Queue", icon: <CalendarCheck size={17} />, path: SLATE_PATHS.VAO_QUEUE, menuCode: "vao.queue" },
    { label: "Verification Queue", icon: <ShieldCheck size={17} />, path: SLATE_PATHS.VAO_VERIFICATION_QUEUE, menuCode: "vao.verification_queue" },
    { label: "Property List", icon: <Building2 size={17} />, path: SLATE_PATHS.VAO_PROPERTIES, menuCode: "vao.properties" },
  ],
  tahsildar: [
    { label: "Dashboard", icon: <LayoutDashboard size={17} />, path: SLATE_PATHS.DASHBOARD, menuCode: "tahsildar.dashboard" },
    { label: "Verification Queue", icon: <ShieldCheck size={17} />, path: SLATE_PATHS.TAHSILDAR_VERIFICATION_QUEUE, menuCode: "tahsildar.queue" },
    { label: "Property List", icon: <Building2 size={17} />, path: SLATE_PATHS.TAHSILDAR_PROPERTIES, menuCode: "tahsildar.queue" },
    { label: "Audit Trail", icon: <ScrollText size={17} />, path: SLATE_PATHS.TAHSILDAR_AUDIT, menuCode: "tahsildar.audit" },
  ],
};

export default function SlateShell() {
  const { session, currentUser, logout, toggleSidebar } = useSlateStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const portal = session.currentPortal ?? "citizen";
  const meta = PORTAL_META[portal] ?? PORTAL_META["citizen"];
  // Live identity (resolved server-side from the real IAM tables) drives nav
  // visibility, so a Role/Menu Mapping edit takes effect on next login
  // without a redeploy. While /me hasn't resolved yet, show everything
  // rather than flash an empty nav.
  const liveMenuCodes = session.liveIdentity ? new Set(session.liveIdentity.menus.map((m) => m.code)) : null;
  const navBase = PORTAL_NAV[portal] ?? PORTAL_NAV["citizen"];
  const navItems = navBase.filter((item) => {
    if (!item.menuCode) return true;
    if (!liveMenuCodes) return true;
    return liveMenuCodes.has(item.menuCode);
  });
  const collapsed = session.sidebarCollapsed;
  const jurisdiction = jurisdictionLabel(currentUser);

  const breadcrumbs = useMemo(() => {
    const crumbs: { label: string; path?: string }[] = [{ label: meta.label, path: SLATE_PATHS.DASHBOARD }];
    const matched = [...navItems]
      .filter((item) => location.pathname === item.path || location.pathname.startsWith(item.path + "/"))
      .sort((a, b) => b.path.length - a.path.length)[0];
    if (matched && matched.path !== SLATE_PATHS.DASHBOARD) {
      crumbs.push({ label: matched.label, path: matched.path });
    }
    if (matched) {
      const rest = location.pathname.slice(matched.path.length).replace(/^\//, "");
      if (rest) crumbs.push({ label: rest });
    }
    return crumbs;
  }, [meta.label, navItems, location.pathname]);

  // Role-scoped token search:
  //   citizen   → only their own tokens (citizen.getProperties)
  //   officer / tahsildar / surveyor → jurisdiction tokens (officer.searchTokens)
  //   bank / court / admin → all tokens (officer.searchTokens, unrestricted server-side)
  const [searchResults, setSearchResults] = useState<SlateToken[]>([]);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    const q = searchQuery.trim();
    if (q.length < 2) { setSearchResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      try {
        let tokens: SlateToken[];
        if (portal === "citizen") {
          const all = await slateApi.citizen.getProperties();
          tokens = all.filter((t) => t.ulpin.toUpperCase().includes(q.toUpperCase())).slice(0, 6);
        } else {
          tokens = (await slateApi.officer.searchTokens(q)).slice(0, 6);
        }
        setSearchResults(tokens);
      } catch { setSearchResults([]); }
    }, 350);
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
  }, [searchQuery, portal, session.loggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const [notifications, setNotifications] = useState<SlateNotification[]>([]);
  const seenIdsRef = useRef<Set<string> | null>(null);
  const loadNotifications = () => {
    if (!session.loggedIn) return;
    slateApi.notifications.getMine().then((rows) => {
      const mapped = rows.map(mapNotification);
      setNotifications(mapped);

      // Desktop push for anything unread we haven't already surfaced - skips
      // the very first load (seenIdsRef starts null) so signing in doesn't
      // dump a backlog of toasts for old unread items.
      if (seenIdsRef.current) {
        const fresh = mapped.filter((n) => !n.isRead && !seenIdsRef.current!.has(n.id));
        if (fresh.length > 0 && "Notification" in window && Notification.permission === "granted") {
          fresh.forEach((n) => {
            const desktopNotif = new Notification(n.title, { body: n.detail, tag: n.id });
            desktopNotif.onclick = () => {
              window.focus();
              navigate(n.path);
              desktopNotif.close();
            };
          });
        }
      }
      seenIdsRef.current = new Set(mapped.map((n) => n.id));
    }).catch(() => undefined);
  };

  useEffect(() => {
    if (!session.loggedIn || !session.liveToken) {
      seenIdsRef.current = null;
      return;
    }
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => undefined);
    }
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 25000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.loggedIn, session.liveToken]);

  const [notifOpen, setNotifOpen] = useState(false);
  const hasUnread = notifications.some((n) => !n.isRead);
  const notifGroups = useMemo(() => {
    const groups = new Map<string, typeof notifications>();
    notifications.forEach((n) => {
      const key = relativeBucket(n.ts);
      groups.set(key, [...(groups.get(key) ?? []), n]);
    });
    return Array.from(groups.entries());
  }, [notifications]);

  const handleOpenNotification = (n: SlateNotification) => {
    setNotifOpen(false);
    if (!n.isRead) {
      slateApi.notifications.markRead(n.id).catch(() => undefined);
      setNotifications((prev) => prev.map((p) => (p.id === n.id ? { ...p, isRead: true } : p)));
    }
    navigate(n.path);
  };

  const handleLogout = () => {
    logout();
    navigate(SLATE_PATHS.LOGIN);
  };

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: "#eef1f4" }}>
      <aside
        style={{
          width: collapsed ? 64 : 240,
          transition: "width 160ms ease",
          background: "#0F2A4A",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-2.5"
          style={{ padding: collapsed ? "18px 0" : "18px 20px", justifyContent: collapsed ? "center" : "flex-start", background: "none", border: "none", cursor: "pointer" }}
        >
          <img src="/slate-logo.jpeg" alt="SLATE" style={{ width: 30, height: 30, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} />
          {!collapsed && (
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: ".02em" }}>SLATE</div>
              <div style={{ fontSize: 10.3, color: "#9fb3cc" }}>Secured Land Asset Token Exchange</div>
            </div>
          )}
        </button>

        {!collapsed && (
          <div
            className="flex items-center gap-2"
            style={{ margin: "2px 16px 10px", padding: "7px 10px", borderRadius: 7, background: "rgba(255,255,255,.08)", color: "#fff", fontSize: 11.5, fontWeight: 600 }}
          >
            {meta.icon}
            <span>{meta.label}</span>
          </div>
        )}

        {!collapsed && jurisdiction && (portal === "officer" || portal === "surveyor") && (
          <div
            className="flex items-center gap-1.5"
            style={{ margin: "-4px 16px 10px", padding: "5px 10px", borderRadius: 7, background: "rgba(184,146,61,.16)", color: "#ecd6a4", fontSize: 10.8, fontWeight: 600 }}
          >
            <MapPin size={12} />
            <span>{jurisdiction}</span>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto" style={{ padding: "4px 10px" }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className="flex items-center gap-2.5"
                style={{
                  padding: collapsed ? "10px 0" : "9px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  marginBottom: 2,
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 500,
                  color: active ? "#0F2A4A" : "#dbe4ee",
                  background: active ? "#B8923D" : "transparent",
                  textDecoration: "none",
                }}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

        </nav>

        <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,.12)" }}>
          <button
            onClick={() => setConfirmLogoutOpen(true)}
            className="flex items-center gap-2.5"
            style={{ padding: "8px 0", justifyContent: collapsed ? "center" : "flex-start", fontSize: 12.5, color: "#9fb3cc", background: "none", border: "none", cursor: "pointer", width: "100%" }}
            title={collapsed ? "Sign out / Switch portal" : undefined}
          >
            <LogOut size={16} />
            {!collapsed && <span>Sign out / Switch portal</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className="flex items-center justify-between"
          style={{ height: 56, padding: "0 20px", background: "#fff", borderBottom: "1px solid #dee2e6", flexShrink: 0, position: "relative", zIndex: 10 }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              style={{ color: "#717881", display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer" }}
              aria-label="Toggle sidebar"
            >
              {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            </button>
            <nav className="flex items-center gap-1.5" aria-label="Breadcrumb">
              {breadcrumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight size={13} style={{ color: "#c3cad1" }} />}
                  {c.path && i < breadcrumbs.length - 1 ? (
                    <Link to={c.path} style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 500, color: i === 0 ? "#0F2A4A" : "#717881", textDecoration: "none" }}>
                      {c.label}
                    </Link>
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 500, color: i === breadcrumbs.length - 1 ? "#0F2A4A" : "#717881", fontFamily: i === breadcrumbs.length - 1 && i > 0 ? "monospace" : undefined }}>
                      {c.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div style={{ position: "relative", width: 220 }}>
              <Input
                size="sm"
                placeholder="Search by ULPIN…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                startAdornment={<Search size={14} />}
              />
              {searchFocused && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    right: 0,
                    minWidth: 280,
                    background: "#fff",
                    border: "1px solid #dee2e6",
                    borderRadius: 8,
                    boxShadow: "0 8px 24px rgba(15,42,74,.12)",
                    zIndex: 20,
                    overflow: "hidden",
                  }}
                >
                  {searchQuery.trim().length < 2 ? (
                    <div style={{ padding: "12px 14px", fontSize: 12, color: "#9aa1a9" }}>Type at least 2 characters of a ULPIN to search.</div>
                  ) : searchResults.length === 0 ? (
                    <div style={{ padding: "12px 14px", fontSize: 12, color: "#9aa1a9" }}>No parcel found for "{searchQuery}".</div>
                  ) : (
                    searchResults.map((t) => (
                      <button
                        key={t.ulpin}
                        onClick={() => {
                          setSearchQuery("");
                          navigate(SLATE_PATHS.CITIZEN_PROPERTY_DETAIL.replace(":ulpin", t.ulpin));
                        }}
                        className="flex items-center gap-2.5 w-full text-left"
                        style={{ padding: "10px 14px", border: "none", background: "none", cursor: "pointer", borderBottom: "1px solid #f1f3f5" }}
                      >
                        <Layers size={14} style={{ color: "#717881" }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace" }}>{t.ulpin}</div>
                          <div style={{ fontSize: 10.5, color: "#9aa1a9" }}>{t.physical.area} · {t.location.village}</div>
                        </div>
                        <StateBadge state={t.state} size="sm" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <Popover
              placement="bottom"
              triggerType="manual"
              open={notifOpen}
              onOpenChange={setNotifOpen}
              trigger={
                <button
                  onClick={() => {
                    const next = !notifOpen;
                    setNotifOpen(next);
                    if (next) loadNotifications();
                  }}
                  style={{ position: "relative", color: "#717881", background: "none", border: "none", cursor: "pointer", display: "flex", padding: 6 }}
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {hasUnread && (
                    <span style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: "50%", background: "#B0392F", boxShadow: "0 0 0 2px #fff" }} />
                  )}
                </button>
              }
              content={
                <div className="flex flex-col" style={{ width: 352, maxHeight: 440 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 10, flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Notifications</div>
                    {notifications.length > 0 && <span style={{ fontSize: 11, color: "#9aa1a9" }}>{notifications.length} relevant to you</span>}
                  </div>
                  <div className="flex-1" style={{ minHeight: 0, overflowY: "auto", overflowX: "hidden", paddingRight: 4 }}>
                    {notifications.length === 0 ? (
                      <div style={{ fontSize: 12, color: "#9aa1a9", textAlign: "center", padding: "14px 0" }}>Nothing needs your attention right now.</div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {notifGroups.map(([bucket, items]) => (
                          <div key={bucket}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#9aa1a9", marginBottom: 6 }}>{bucket}</div>
                            <div className="flex flex-col gap-2">
                              {items.map((n) => (
                                <div
                                  key={n.id}
                                  onClick={() => handleOpenNotification(n)}
                                  className="group flex items-start gap-2.5 w-full text-left"
                                  style={{ position: "relative", padding: "9px 10px", border: "1px solid #eceef0", background: n.isRead ? "#fafbfc" : "#fbf3e2", cursor: "pointer", borderRadius: 8 }}
                                >
                                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: KIND_DOT[n.kind], marginTop: 5, flexShrink: 0 }} />
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#161b22" }}>{n.title}</div>
                                    <div style={{ fontSize: 11, color: "#717881", marginTop: 1 }}>{n.detail}</div>
                                    <div style={{ fontSize: 10, color: "#9aa1a9", fontFamily: "monospace", marginTop: 3 }}>{n.ts}</div>
                                  </div>
                                  <span
                                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ position: "absolute", right: 8, bottom: 8, fontSize: 10.5, fontWeight: 700, color: "#fff", background: "#B8923D", borderRadius: 6, padding: "3px 8px" }}
                                  >
                                    View <ArrowUpRight size={11} />
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ borderTop: "1px solid #eceef0", margin: "10px -16px 0", padding: "8px 16px 0", flexShrink: 0 }}>
                    <button
                      onClick={() => { setNotifOpen(false); navigate(SLATE_PATHS.NOTIFICATIONS); }}
                      className="w-full"
                      style={{ fontSize: 12, fontWeight: 700, color: "#B8923D", background: "none", border: "none", cursor: "pointer", textAlign: "center", padding: "6px 0" }}
                    >
                      View all notifications →
                    </button>
                  </div>
                </div>
              }
            />

            <Popover
              placement="bottom"
              trigger={
                <button style={{ color: "#717881", background: "none", border: "none", cursor: "pointer", display: "flex", padding: 6 }} aria-label="Help">
                  <HelpCircle size={18} />
                </button>
              }
              content={
                <div className="flex flex-col" style={{ width: 410, maxHeight: 420 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 10, flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Help</div>
                    <span style={{ fontSize: 11, color: "#9aa1a9" }}>{Math.min(HELP_TOPICS.length, 10)} of {HELP_TOPICS.length}</span>
                  </div>
                  <div className="flex-1" style={{ minHeight: 0, overflowY: "auto", overflowX: "hidden", paddingRight: 4 }}>
                    <div className="flex flex-col gap-2">
                      {HELP_TOPICS.slice(0, 10).map((h, i) => (
                        <div key={i} style={{ padding: "10px 12px", border: "1px solid #eceef0", background: "#fafbfc", borderRadius: 8 }}>
                          <div className="flex items-start gap-2" style={{ fontSize: 12, fontWeight: 700, color: "#161b22" }}>
                            <HelpCircle size={13} style={{ marginTop: 1, flexShrink: 0, color: "#8f6a26" }} />
                            <span>{h.q}</span>
                          </div>
                          <div style={{ fontSize: 11.5, color: "#717881", marginTop: 4, lineHeight: 1.5, paddingLeft: 21 }}>{h.a}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid #eceef0", margin: "10px -16px 0", padding: "8px 16px 0", flexShrink: 0 }}>
                    <button
                      onClick={() => navigate(SLATE_PATHS.HELP)}
                      className="w-full"
                      style={{ fontSize: 12, fontWeight: 700, color: "#B8923D", background: "none", border: "none", cursor: "pointer", textAlign: "center", padding: "6px 0" }}
                    >
                      View all queries →
                    </button>
                  </div>
                </div>
              }
            />

            <Popover
              placement="bottom"
              triggerType="manual"
              open={profileMenuOpen}
              onOpenChange={setProfileMenuOpen}
              trigger={
                <button
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  className="flex items-center gap-2"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <Avatar src={currentUser?.photo ?? undefined} name={currentUser?.name} bgColor={meta.accent} textColor="#fff" size={32} />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#161b22" }}>{currentUser?.name}</div>
                  </div>
                  <ChevronDown size={14} style={{ color: "#9aa1a9" }} />
                </button>
              }
              content={
                <div style={{ minWidth: 200 }}>
                  <div className="flex items-center gap-2.5" style={{ marginBottom: 10 }}>
                    <Avatar src={currentUser?.photo ?? undefined} name={currentUser?.name} bgColor={meta.accent} textColor="#fff" size={38} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#161b22" }}>{currentUser?.name}</div>
                      <div style={{ fontSize: 11, color: "#717881" }}>{meta.label}</div>
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid #eceef0", margin: "0 -16px", padding: "8px 16px 0" }}>
                    <button
                      onClick={() => { setProfileMenuOpen(false); setProfileModalOpen(true); }}
                      className="flex items-center gap-2.5 w-full"
                      style={{ padding: "8px 4px", fontSize: 12.5, fontWeight: 500, color: "#161b22", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                    >
                      <UserIcon size={15} /> My Profile
                    </button>
                    <div style={{ borderTop: "1px solid #eceef0", margin: "4px 0" }} />
                    <button
                      onClick={() => { setProfileMenuOpen(false); setConfirmLogoutOpen(true); }}
                      className="flex items-center gap-2.5 w-full"
                      style={{ padding: "8px 4px", fontSize: 12.5, fontWeight: 500, color: "#B0392F", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                </div>
              }
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto" style={{ padding: 24 }}>
          {isPathPermitted(location.pathname, liveMenuCodes) ? (
            <Outlet />
          ) : (
            <Empty
              variant="no-permission"
              title="You don't have access to this page"
              description="Your role doesn't carry the permission this page requires. If you believe this is wrong, contact your administrator."
            />
          )}
        </main>
      </div>

      <SlateProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onSignOut={() => { setProfileModalOpen(false); setConfirmLogoutOpen(true); }}
        accent={meta.accent}
      />

      <ConfirmationModal
        isOpen={confirmLogoutOpen}
        onClose={() => setConfirmLogoutOpen(false)}
        onConfirm={() => { setConfirmLogoutOpen(false); handleLogout(); }}
        variant="warning"
        title="Sign out of SLATE?"
        message="You'll be returned to the login screen and will need to sign in again to continue."
        confirmText="Sign out"
      />
    </div>
  );
}
