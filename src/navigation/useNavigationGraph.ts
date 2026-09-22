import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUIPolicyContext } from "@/ui-policy/context/UIPolicyContext";
import { SecureStorage } from "@/services/storage";
import { ROUTES } from "@/navigation/routes";
import { NAVIGATION_PERMISSIONS } from "@/ui-policy/registry/permissionKeys";
import type { SidebarItem } from "@/ui/layout/Sidebar";

// ── TEMPORARY: static local menu ─────────────────────────────────────────────
// The backend's stored menu/module records (driving the dynamic bootstrap menu
// below) still list pages that no longer exist on the frontend (Admin
// Workbench, Masters, Profile Onboarding, Project Intake, etc.) from before
// the IP-Climb-feature cleanup. Until that backend menu data is cleaned up,
// the sidebar uses this fixed local list instead of the dynamic bootstrap menu.
// Once the backend entries are fixed, switch `dynamicRegistry` back to
// `bootstrapRegistry` below to restore dynamic, backend-driven menus.
const STATIC_SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "componentlibrary", label: "Component Library", icon: "LayoutGrid", path: ROUTES.PATHS.APP.COMPONENT_LIBRARY, policy: NAVIGATION_PERMISSIONS.COMPONENT_LIBRARY_VIEW },
  { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", path: ROUTES.PATHS.APP.DASHBOARD, policy: NAVIGATION_PERMISSIONS.DASHBOARD_VIEW },
  { id: "user-access-management", label: "User Access Management", icon: "ShieldCheck", path: ROUTES.PATHS.APP.USER_ACCESS_MANAGEMENT, policy: NAVIGATION_PERMISSIONS.USER_ACCESS_MANAGEMENT_VIEW },
  { id: "user-onboarding", label: "User Onboarding", icon: "UserPlus", path: ROUTES.PATHS.APP.USER_ONBOARDING, policy: NAVIGATION_PERMISSIONS.USER_ONBOARDING_VIEW },
  { id: "slate", label: "SLATE - Land Registry POC", icon: "MapPin", path: ROUTES.PATHS.APP.SLATE.ROOT, policy: NAVIGATION_PERMISSIONS.SLATE_VIEW },
];

type RawBootstrapMenuItem = {
  id: number | string;
  label: string;
  path?: string | null;
  route?: string | null;
  link?: string | null;
  icon?: string | null;
  parentId?: number | string | null;
  menuLevel?: number | null;
  sortOrder?: number | null;
  subMenu?: RawBootstrapMenuItem[];
  children?: RawBootstrapMenuItem[];
  policy?: string | null;
};

type StoredBootstrapShape = {
  menuContext?: {
    menuItems?: RawBootstrapMenuItem[];
  };
};

type SidebarTrailNode = SidebarItem & { trail: SidebarItem[] };

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function slugifyLabel(label: unknown): string | null {
  if (typeof label !== "string") return null;
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

function normalizeMenuPath(
  path: string | undefined,
  label?: string | null,
): string | undefined {
  if (!path) return undefined;
  const rawPath = String(path).trim();
  if (!rawPath.startsWith("/")) return rawPath;

  const segments = rawPath.split("/").filter(Boolean);
  if (segments.length === 0 || !label) return rawPath;

  const lastSegment = segments[segments.length - 1];
  if (lastSegment.includes("-")) return rawPath;

  const slug = slugifyLabel(label);
  if (!slug) return rawPath;

  const lastSegmentCompact = lastSegment
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  const labelCompact = slug.replace(/-/g, "");
  if (lastSegmentCompact !== labelCompact) return rawPath;

  const prefix = `/${segments.slice(0, -1).join("/")}`;
  return prefix ? `${prefix}/${slug}` : `/${slug}`;
}

function readBootstrapMenuItems(): RawBootstrapMenuItem[] {
  const bootstrap = safeParse<any>(
    sessionStorage.getItem("ipc_post_login_bootstrap"),
  );

  const items =
    bootstrap?.menuContext?.menuItems?.length
      ? bootstrap.menuContext.menuItems
      : bootstrap?.menuContext?.rawMenuPayload?.menu ?? [];

  return Array.isArray(items) ? items : [];
}
function sortMenuItems<T extends { label?: unknown; sortOrder?: number | null }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const sortA = a.sortOrder ?? 999999;
    const sortB = b.sortOrder ?? 999999;
    if (sortA !== sortB) return sortA - sortB;

    return String(a.label ?? "").localeCompare(String(b.label ?? ""));
  });
}

function mapStoredAuthMenuToSidebarItems(
  apiMenu: RawBootstrapMenuItem[],
): SidebarItem[] {
  return sortMenuItems(apiMenu).map((item) => {
    const rawPath = item.path ?? item.route ?? item.link ?? undefined;
    const childItems = Array.isArray(item.subMenu)
      ? item.subMenu
      : Array.isArray(item.children)
        ? item.children
        : [];

    return {
      id: String(item.id),
      label: String(item.label ?? "Untitled"),
      path: rawPath ? String(rawPath).trim() : undefined,
      icon: typeof item.icon === "string" ? item.icon : undefined,
      policy: typeof item.policy === "string" ? item.policy : undefined,
      children: childItems.length
        ? mapStoredAuthMenuToSidebarItems(childItems)
        : undefined,
    };
  });
}

function buildSidebarTree(rawItems: RawBootstrapMenuItem[]): SidebarItem[] {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return [];

  const sorted = [...rawItems].sort((a, b) => {
    const levelA = a.menuLevel ?? 999999;
    const levelB = b.menuLevel ?? 999999;
    if (levelA !== levelB) return levelA - levelB;

    const sortA = a.sortOrder ?? 999999;
    const sortB = b.sortOrder ?? 999999;
    if (sortA !== sortB) return sortA - sortB;

    return String(a.label ?? "").localeCompare(String(b.label ?? ""));
  });

  const nodeMap = new Map<
    string,
    SidebarItem & { _parentId?: string | null; _sortOrder?: number | null }
  >();

  for (const item of sorted) {
    const id = String(item.id);
    nodeMap.set(id, {
      id,
      label: String(item.label ?? "Untitled"),
      path: normalizeMenuPath(
        item.path ?? item.route ?? item.link ?? undefined,
        item.label,
      ),
      policy: typeof (item as any).policy === "string" ? (item as any).policy : undefined,
      icon: typeof item.icon === "string" ? item.icon : undefined,
      children: [],
      _parentId:
        item.parentId === null || item.parentId === undefined
          ? null
          : String(item.parentId),
      _sortOrder: item.sortOrder ?? null,
    });
  }

  const roots: Array<
    SidebarItem & { _parentId?: string | null; _sortOrder?: number | null }
  > = [];

  for (const node of nodeMap.values()) {
    if (node._parentId && nodeMap.has(node._parentId)) {
      const parent = nodeMap.get(node._parentId)!;
      parent.children = parent.children ?? [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (
    items: Array<
      SidebarItem & { _parentId?: string | null; _sortOrder?: number | null }
    >,
  ): Array<
    SidebarItem & { _parentId?: string | null; _sortOrder?: number | null }
  > => {
    return items
      .sort((a, b) => {
        const sortA = a._sortOrder ?? 999999;
        const sortB = b._sortOrder ?? 999999;
        if (sortA !== sortB) return sortA - sortB;
        return a.label.localeCompare(b.label);
      })
      .map((item) => ({
        ...item,
        children: item.children
          ? sortNodes(
              item.children as Array<
                SidebarItem & {
                  _parentId?: string | null;
                  _sortOrder?: number | null;
                }
              >,
            )
          : undefined,
      }));
  };

  const clean = (
    items: Array<
      SidebarItem & { _parentId?: string | null; _sortOrder?: number | null }
    >,
  ): SidebarItem[] => {
    return items.map(({ _parentId, _sortOrder, children, ...rest }) => ({
      ...rest,
      ...(children && children.length > 0
        ? {
            children: clean(
              children as Array<
                SidebarItem & {
                  _parentId?: string | null;
                  _sortOrder?: number | null;
                }
              >,
            ),
          }
        : {}),
    }));
  };

  return clean(sortNodes(roots));
}

function flattenSidebar(
  nodes: SidebarItem[],
  parentTrail: SidebarItem[] = [],
): SidebarTrailNode[] {
  return nodes.flatMap((node) => {
    const cleanNode: SidebarItem = {
      id: node.id,
      label: node.label,
      path: node.path,
      icon: node.icon,
      policy: node.policy,
      children: node.children,
    };
    const trail = [...parentTrail, cleanNode];

    if (node.children && node.children.length > 0) {
      return flattenSidebar(node.children, trail);
    }

    return [{ ...cleanNode, trail }];
  });
}

export const useNavigationGraph = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const policy = useUIPolicyContext();
  const [menuVersion, setMenuVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setMenuVersion((v) => v + 1);

    const handleBootstrapUpdate = () => refresh();
    const handleStorage = () => refresh();

    window.addEventListener("ipc:post-login-bootstrap", handleBootstrapUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        "ipc:post-login-bootstrap",
        handleBootstrapUpdate,
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const dynamicRegistry = useMemo(() => {
    // Backend-driven menu - computed for visibility/debugging only while the
    // static override above is active (see STATIC_SIDEBAR_ITEMS comment).
    const bootstrapMenu = readBootstrapMenuItems();
    const backendDrivenMenu = bootstrapMenu.length > 0
      ? (bootstrapMenu.some((item) => Array.isArray((item as any).subMenu) && (item as any).subMenu.length > 0)
          ? mapStoredAuthMenuToSidebarItems(bootstrapMenu as any[])
          : buildSidebarTree(bootstrapMenu))
      : (() => {
          const storedMenu = SecureStorage.get<any[]>("auth.menu");
          return Array.isArray(storedMenu) && storedMenu.length > 0 ? mapStoredAuthMenuToSidebarItems(storedMenu) : [];
        })();

    if (backendDrivenMenu.length > 0) {
      console.debug("[navigation] backend-driven menu available but unused - using STATIC_SIDEBAR_ITEMS until backend menu data is cleaned up:", backendDrivenMenu);
    }

    return STATIC_SIDEBAR_ITEMS;
  }, [menuVersion]);

  const flatNav = useMemo(
    () => flattenSidebar(dynamicRegistry),
    [dynamicRegistry],
  );

  const visibleNav = useMemo(
    () => flatNav.filter((n) => !n.policy || policy.can(n.policy)),
    [flatNav, policy],
  );

  const currentLeaf = visibleNav.find((n) => n.path === pathname);
  const breadcrumbs = currentLeaf?.trail ?? [];

  const commands = useMemo(
    () =>
      visibleNav
        .filter((n) => Boolean(n.path))
        .map((n) => ({
          id: n.id,
          label: n.label,
          action: () => navigate(n.path!),
        })),    
    [visibleNav, navigate],
  );

  const applyPolicyToSidebar = (nodes: SidebarItem[]): SidebarItem[] => {
    return nodes
      .map((node) => {
        const nextChildren = node.children
          ? applyPolicyToSidebar(node.children)
          : undefined;

        const selfVisible = !node.policy || policy.can(node.policy);
        const hasVisibleChildren = Boolean(
          nextChildren && nextChildren.length > 0,
        );

        if (!selfVisible && !hasVisibleChildren) return null;

        return {
          ...node,
          ...(hasVisibleChildren ? { children: nextChildren } : {}),
        };
      })
      .filter((node): node is SidebarItem => node !== null);
  };

  const sidebar = useMemo(
    () => applyPolicyToSidebar(dynamicRegistry),
    [dynamicRegistry, policy],
  );

  return {
    sidebar,
    breadcrumbs,
    commands,
  };
};
