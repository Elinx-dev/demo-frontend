import { ROUTES } from "./routes";
import {
  LayoutDashboard,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface RouteHeaderBreadcrumb {
  label: string;
  href?: string;
}

export interface RouteHeaderBackLink {
  label: string;
  to?: string;
}

export interface RouteHeaderBackAction extends RouteHeaderBackLink {
  ariaLabel: string;
  title: string;
}

export interface RouteHeaderConfig {
  title: string;
  description?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  back?: RouteHeaderBackLink | false | null;
}

export const ROUTE_HEADER: Record<string, RouteHeaderConfig> = {
  [ROUTES.PATHS.APP.DASHBOARD]: {
    title: "User Dashboard",
    description: "Overview of your IP portfolio and key metrics.",
    icon: LayoutDashboard,
    iconColor: "var(--ipc-primary)",
    iconBg: "var(--ipc-info-bg)",
    back: false,
  },

  [ROUTES.PATHS.APP.USER_PROFILE]: {
    title: "User Profile",
    description: "Manage account and preferences",
    icon: User,
    iconColor: "var(--ipc-warning)",
    iconBg: "var(--ipc-warning-bg)",
    back: {
      label: "Dashboard",
      to: ROUTES.PATHS.APP.DASHBOARD,
    },
  },

};
  


const normalizePath = (path: string) => {
  const trimmed = path.trim();
  if (!trimmed) return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

const routeBase = (routePath: string) => normalizePath(routePath).split("/:")[0];

export function getRouteHeader(pathname: string): RouteHeaderConfig | null {
  const normalizedPathname = normalizePath(pathname);

  const match = Object.entries(ROUTE_HEADER)
    .map(([path, header]) => ({ path: routeBase(path), header }))
    .sort((a, b) => b.path.length - a.path.length)
    .find(({ path }) => (
      normalizedPathname === path || normalizedPathname.startsWith(`${path}/`)
    ));

  return match?.header ?? null;
}

export function getRouteHeaderBack(
  pathname: string,
  breadcrumbs: RouteHeaderBreadcrumb[] = [],
  locationState?: { from?: string; fromPath?: string } | null,  // ← ADD
): RouteHeaderBackLink | null {
  const header = getRouteHeader(pathname);
  if (header?.back === false) return null;

 
  if (header?.back === null || header?.back === undefined) {
    if (locationState?.fromPath) {
      return {
        label: locationState.from ?? "Back",
        to: locationState.fromPath,
      };
    }
   
    const previous = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;
    return previous ? { label: previous.label, to: previous.href } : null;
  }

  return header.back;
}

export function getRouteHeaderBackAction(
  pathname: string,
  breadcrumbs: RouteHeaderBreadcrumb[] = [],
  locationState?: { from?: string; fromPath?: string } | null,  // ← ADD
): RouteHeaderBackAction | null {
  const back = getRouteHeaderBack(pathname, breadcrumbs, locationState);  // ← pass it
  if (!back) return null;
  const label = back.label || "previous page";
  return {
    ...back,
    label,
    ariaLabel: `Go back to ${label}`,
    title: `Back to ${label}`,
  };
}
