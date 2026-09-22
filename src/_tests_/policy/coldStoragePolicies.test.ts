import { describe, it, expect } from "vitest";
import { coldStoragePolicies } from "@/ui-policy/policies/coldStorage.policies";
import { evaluatePolicy } from "@/ui-policy/engine/evaluatePolicy";
import { EntityStatus } from "@/domain/enums/Status";
import { UserRole } from "@/domain/enums/UserRole";

describe("Cold storage policies", () => {
    it("blocks update for non-admin", () => {
        const decision = evaluatePolicy(coldStoragePolicies, {
            user: { role: UserRole.Viewer, persona: "default" },
            action: "update",
            entity: { type: "cold-storages", status: EntityStatus.Draft },
        });

        expect(decision.enabled).toBe(false);
    });

    it("locks approved cold storage even for admin", () => {
        const decision = evaluatePolicy(coldStoragePolicies, {
            user: { role: UserRole.PlatformAdmin, persona: "internal" },
            action: "update",
            entity: { type: "cold-storages", status: EntityStatus.Approved },
        });

        expect(decision.enabled).toBe(false);
    });
});