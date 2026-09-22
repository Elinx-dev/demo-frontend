import {
    NAVIGATION_PERMISSIONS,
} from "@/ui-policy/registry/permissionKeys";
import { ROUTES } from "@/navigation/routes";
import {
    LayoutGrid,
    LayoutDashboard,
    ShieldCheck,
    UserPlus,
    MapPin,
} from "lucide-react";
import type { ReactNode } from "react";

/* =========================
 * Types
 * =======================*/

export type NavigationNode = {
    id: string;
    label: string;
    path?: string;           // ✅ ABSOLUTE paths only
    policy?: string;
    icon?: ReactNode;        // ✅ ReactNode - actual JSX icon, not a string
    children?: NavigationNode[];
};

/**
 * Navigation Registry
 * -------------------
 * Canonical navigation structure.
 *
 * HARD RULES (L5):
 * - NO raw route strings
 * - NO relative paths
 * - NO raw permission strings
 * - Navigation ALWAYS uses ROUTES.PATHS
 */
export const navigationRegistry: NavigationNode[] = [
    {
        id: "componentlibrary",
        label: "Component Library",
        icon: <LayoutGrid size={18} />,
        path: ROUTES.PATHS.APP.COMPONENT_LIBRARY,
        policy: NAVIGATION_PERMISSIONS.COMPONENT_LIBRARY_VIEW,
    },
    {
        id: "dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard size={18} />,
        path: ROUTES.PATHS.APP.DASHBOARD,
        policy: NAVIGATION_PERMISSIONS.DASHBOARD_VIEW,
    },
    {
        id: "user-access-management",
        label: "User Access Management",
        icon: <ShieldCheck size={18} />,
        path: ROUTES.PATHS.APP.USER_ACCESS_MANAGEMENT,
        policy: NAVIGATION_PERMISSIONS.USER_ACCESS_MANAGEMENT_VIEW,
    },
    {
        id: "user-onboarding",
        label: "User Onboarding",
        icon: <UserPlus size={18} />,
        path: ROUTES.PATHS.APP.USER_ONBOARDING,
        policy: NAVIGATION_PERMISSIONS.USER_ONBOARDING_VIEW,
    },
     {
        id: "slate",
        label: "SLATE: Land Registry POC",
        icon: <MapPin size={18} />,
        path: ROUTES.PATHS.APP.SLATE.ROOT,
        policy: NAVIGATION_PERMISSIONS.SLATE_VIEW,
    },
];
