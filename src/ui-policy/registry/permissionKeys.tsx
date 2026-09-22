/**
 * Permission Keys Registry
 * ------------------------
 * Single Source of Truth for ALL UI permissions.
 *
 * Rules:
 * - No inline strings in components
 * - No ad-hoc permission names
 * - Add here first, then use everywhere
 *
 * This prevents:
 * - Typos
 * - Drift
 * - Ghost permissions
 */

/* =========================
 * Navigation Permissions
 * ======================= */
export const NAVIGATION_PERMISSIONS = {
    COMPONENT_LIBRARY_VIEW: "nav.componentlibrary.view",
    DASHBOARD_VIEW: "nav.dashboard.view",
    USER_ACCESS_MANAGEMENT_VIEW: "nav.useraccessmanagement.view",
    USER_ONBOARDING_VIEW: "nav.useronboarding.view",
    SLATE_VIEW: "nav.slate.view",
} as const;


export const USER_PERMISSIONS = {
  // Dashboard
  DASHBOARD_KPI_CARDS:   "DASHBOARD_KPI_CARDS",

  // Users
  USER_CREATE_MANAGER:   "USER_CREATE_MANAGER",
  USER_DELETE_MANAGER:   "USER_DELETE_MANAGER",
  USER_CREATE_ANALYST:   "USER_CREATE_ANALYST",
  USER_DELETE_ANALYST:   "USER_DELETE_ANALYST",
  USER_EDIT_MANAGER:    "USER_EDIT_MANAGER",
  USER_EDIT_ANALYST:    "USER_EDIT_ANALYST",

  // Settings
  TENANT_SETTINGS:       "TENANT_SETTINGS",
} as const;

/* =========================
 * Canonical Export
 * ======================= */
export const PERMISSIONS = {
    NAV: NAVIGATION_PERMISSIONS,
    USER:      USER_PERMISSIONS,
} as const;


/* =========================
 * Union Type (Auto-Derived)
 * ======================= */
type Values<T> = T[keyof T];

export type PermissionKey =
    | Values<typeof USER_PERMISSIONS>
    | Values<typeof NAVIGATION_PERMISSIONS>;
