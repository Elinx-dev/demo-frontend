import type {
    UIPolicy,
    UIPolicyDecision,
    PolicyEvalContext,
} from "./policy.types";
import { evaluatePolicy } from "./evaluatePolicy";

/* =========================
 * Policy Explanation Types
 * =======================*/
export type PolicyExplanation = {
    decision: UIPolicyDecision;
    matchedPolicies: {
        policyId: string;
        matchedRules: {
            ruleIndex: number;
            effect: Partial<UIPolicyDecision>;
            reason?: string;
        }[];
    }[];
};

/* =========================
 * AppliesTo Matcher (ENGINE LEVEL)
 * =======================*/
function matchesAppliesTo(
    policy: UIPolicy,
    ctx: PolicyEvalContext
): boolean {
    const applies = policy.appliesTo;
    if (!applies) return true;

    if (applies.permissionKey && applies.permissionKey !== ctx.permissionKey) {
        return false;
    }

    if (applies.action && applies.action !== ctx.action) {
        return false;
    }

    if (applies.entity && ctx.entity?.type !== applies.entity) {
        return false;
    }

    return true;
}

/* =========================
 * explainPolicy (DEV ONLY)
 * =======================*/
export function explainPolicy(
    policies: UIPolicy[],
    ctx: PolicyEvalContext
): PolicyExplanation {
    const decision = evaluatePolicy(policies, ctx);

    const matchedPolicies: PolicyExplanation["matchedPolicies"] = [];

    for (const policy of policies) {
        // ✅ SAME FILTER AS ENGINE
        if (!matchesAppliesTo(policy, ctx)) continue;

        const matchedRules = policy.rules
            .map((rule, index) =>
                rule.when(ctx)
                    ? {
                        ruleIndex: index,
                        effect: rule.effect,
                        reason: rule.effect.reason,
                    }
                    : null
            )
            .filter(Boolean) as {
                ruleIndex: number;
                effect: Partial<UIPolicyDecision>;
                reason?: string;
            }[];

        if (matchedRules.length > 0) {
            matchedPolicies.push({
                policyId: policy.id ?? "anonymous-policy",
                matchedRules,
            });
        }
    }

    return {
        decision,
        matchedPolicies,
    };
}
