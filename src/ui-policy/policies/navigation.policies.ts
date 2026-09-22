import type { UIPolicy } from "../engine/policy.types";
import { UserRole } from "@/domain/enums/UserRole";
import { NAVIGATION_PERMISSIONS } from "@/ui-policy/registry/permissionKeys";

/**
 * Navigation Policies
 * -------------------
 * Controls sidebar visibility & route access
 *
 * ❗ Deny-by-default (engine behavior)
 * ✅ Permission registry = single source of truth
 * ✅ Backend can fully control menu visibility
 */
export const navigationPolicies: UIPolicy[] = [
    /* =========================
     * DASHBOARD
     * =======================*/
    {
        id: "nav-dashboard-access",
        appliesTo: {
            permissionKey: NAVIGATION_PERMISSIONS.DASHBOARD_VIEW,
        },
        rules: [
            {
                when: (ctx) =>
                    ctx.user.role === UserRole.PlatformAdmin ||
                    ctx.user.role === UserRole.Operator ||
                    ctx.user.role === UserRole.Viewer,
                effect: {
                    visible: true,
                    enabled: true,
                },
            },
        ],
    },

    /* =========================
     * USER ACCESS MANAGEMENT
     * =======================*/
    {
        id: "nav-user-access-management-access",
        appliesTo: {
            permissionKey: NAVIGATION_PERMISSIONS.USER_ACCESS_MANAGEMENT_VIEW,
        },
        rules: [
            {
                when: (ctx) =>
                    ctx.user.role === UserRole.PlatformAdmin ||
                    ctx.user.role === UserRole.Operator,
                effect: {
                    visible: true,
                    enabled: true,
                },
            },
        ],
    },

    /* =========================
     * USER ONBOARDING
     * =======================*/
    {
        id: "nav-user-onboarding-access",
        appliesTo: {
            permissionKey: NAVIGATION_PERMISSIONS.USER_ONBOARDING_VIEW,
        },
        rules: [
            {
                when: (ctx) =>
                    ctx.user.role === UserRole.PlatformAdmin ||
                    ctx.user.role === UserRole.Operator,
                effect: {
                    visible: true,
                    enabled: true,
                },
            },
        ],
    },

    /* =========================
     * SLATE (land-registry POC)
     * =======================*/
    {
        id: "nav-slate-access",
        appliesTo: {
            permissionKey: NAVIGATION_PERMISSIONS.SLATE_VIEW,
        },
        rules: [
            {
                when: (ctx) =>
                    ctx.user.role === UserRole.PlatformAdmin ||
                    ctx.user.role === UserRole.Operator ||
                    ctx.user.role === UserRole.Viewer,
                effect: {
                    visible: true,
                    enabled: true,
                },
            },
        ],
    },
];
