import { describe, it, expect } from "vitest";
import { evaluatePolicy } from "@/ui-policy/engine/evaluatePolicy";
import { navigationPolicies } from "@/ui-policy/policies/navigation.policies";
import type { PolicyEvalContext } from "@/ui-policy/engine/policy.types";
import { navigationRegistry } from "@/navigation/NavigationRegistry";
import { UserRole } from "@/domain/enums/UserRole";
import { NAVIGATION_PERMISSIONS } from "@/ui-policy/registry/permissionKeys";

/* =========================
 * Helpers (ENGINE CONTEXT)
 * =======================*/
function ctx(
    role: UserRole,
    permissionKey: string
): PolicyEvalContext {
    return {
        user: { role },
        permissionKey,
        route: "/", // realistic but optional
    };
}

/* =========================
 * Tests
 * =======================*/
describe("Navigation governance", () => {
    it("Dashboard is visible to platform_admin", () => {
        const decision = evaluatePolicy(
            navigationPolicies,
            ctx(UserRole.PlatformAdmin, NAVIGATION_PERMISSIONS.DASHBOARD_VIEW)
        );

        expect(decision.visible).toBe(true);
        expect(decision.enabled).toBe(true);
    });

    it("Dashboard is visible to viewer", () => {
        const decision = evaluatePolicy(
            navigationPolicies,
            ctx(UserRole.Viewer, NAVIGATION_PERMISSIONS.DASHBOARD_VIEW)
        );

        expect(decision.visible).toBe(true);
    });

    it("User Access Management is hidden from viewer", () => {
        const decision = evaluatePolicy(
            navigationPolicies,
            ctx(UserRole.Viewer, NAVIGATION_PERMISSIONS.USER_ACCESS_MANAGEMENT_VIEW)
        );

        expect(decision.visible).toBe(false);
    });

    it("User Access Management is visible to platform_admin", () => {
        const decision = evaluatePolicy(
            navigationPolicies,
            ctx(UserRole.PlatformAdmin, NAVIGATION_PERMISSIONS.USER_ACCESS_MANAGEMENT_VIEW)
        );

        expect(decision.visible).toBe(true);
        expect(decision.enabled).toBe(true);
    });

    it("SLATE is visible to viewer", () => {
        const decision = evaluatePolicy(
            navigationPolicies,
            ctx(UserRole.Viewer, NAVIGATION_PERMISSIONS.SLATE_VIEW)
        );

        expect(decision.visible).toBe(true);
    });

    it("Every navigation item with policy has a matching policy rule", () => {
        const policyKeys = new Set(
            navigationPolicies
                .map(p => p.appliesTo.permissionKey)
                .filter(Boolean)
        );

        function walk(nodes: typeof navigationRegistry) {
            nodes.forEach(node => {
                if (node.policy) {
                    expect(policyKeys.has(node.policy)).toBe(true);
                }
                if (node.children) walk(node.children);
            });
        }

        walk(navigationRegistry);
    });
});
