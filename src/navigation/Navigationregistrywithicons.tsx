import {
    LayoutGrid,
    LayoutDashboard,
    ShieldCheck,
    UserPlus,
    MapPin,
} from "lucide-react";
import { navigationRegistry } from "./NavigationRegistry";

// ── Attach icons to each node by id ──────────────────────────────────────────
// This is in a .tsx file so Lucide component references are valid.
// The registry itself stays as pure .ts (no React/JSX).

const iconMap: Record<string, any> = {
    "componentlibrary":        LayoutGrid,
    "dashboard":               LayoutDashboard,
    "user-access-management":  ShieldCheck,
    "user-onboarding":         UserPlus,
    "slate":                   MapPin,
};

function attachIcons(nodes: typeof navigationRegistry): typeof navigationRegistry {
    return nodes.map(node => ({
        ...node,
        icon: iconMap[node.id],
        children: node.children ? attachIcons(node.children) : undefined,
    }));
}

export const navigationRegistryWithIcons = attachIcons(navigationRegistry);