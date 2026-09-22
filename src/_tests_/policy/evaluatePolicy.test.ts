import { describe, it, expect } from "vitest";
import { evaluatePolicy } from "@/ui-policy/engine/evaluatePolicy";
import type { PolicyEvalContext } from "@/ui-policy/engine/policy.types";
import { UserRole } from "@/domain/enums/UserRole";

describe("evaluatePolicy", () => {
    it("denies by default when no policies match", () => {
        const ctx: PolicyEvalContext = {
            user: {
                role: UserRole.Viewer,
                persona: "default",
            },
            route: "/",
        };

        const decision = evaluatePolicy([], ctx);

        expect(decision.visible).toBe(false);
        expect(decision.enabled).toBe(false);
    });
});
