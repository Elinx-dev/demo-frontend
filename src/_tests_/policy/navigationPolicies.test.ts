import { describe, it, expect } from "vitest";
import { navigationPolicies } from "@/ui-policy/policies/navigation.policies";
import { evaluatePolicy } from "@/ui-policy/engine/evaluatePolicy";
import { UserRole } from "@/domain/enums/UserRole";
import { NAVIGATION_PERMISSIONS } from "@/ui-policy/registry/permissionKeys";

describe("Navigation policies", () => {
    it("allows dashboard for viewer", () => {
        const decision = evaluatePolicy(navigationPolicies, {
            user: { role: UserRole.Viewer, persona: "default" },
            permissionKey: NAVIGATION_PERMISSIONS.DASHBOARD_VIEW,
        });

        expect(decision.visible).toBe(true);
        expect(decision.enabled).toBe(true);
    });

    it("denies user access management for viewer", () => {
        const decision = evaluatePolicy(navigationPolicies, {
            user: { role: UserRole.Viewer, persona: "default" },
            permissionKey: NAVIGATION_PERMISSIONS.USER_ACCESS_MANAGEMENT_VIEW,
        });

        expect(decision.visible).toBe(false);
    });
});
