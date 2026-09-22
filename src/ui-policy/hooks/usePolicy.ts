import { useMemo } from "react";
import { evaluatePolicy } from "../engine/evaluatePolicy";
import { explainPolicy } from "../engine/explainPolicy";
import { useUIPolicies } from "./useUIPolicies";
import { usePolicyDebug } from "../context/PolicyDebugProvider";
import type {
    PolicyEvalContext,
    UIPolicyDecision,
} from "../engine/policy.types";
import { useBuildPolicyContext } from "../context/BuildPolicyContext";

/* =========================
 * Canonical CRUD Actions
 * =======================*/
export type CanonicalAction =
    | "create"
    | "read"
    | "update"
    | "delete"
    | "view";

/* =========================
 * Policy Selector
 * =======================*/
export type PolicySelector = {
    permissionKey?: string;
    action?: CanonicalAction;
    entity?: PolicyEvalContext["entity"];
};

/* =========================
 * Hook
 * =======================*/
export function usePolicy(
    selector: PolicySelector
): UIPolicyDecision & { explain?: unknown } {
    const { evalCtx } = useBuildPolicyContext(); // ✅ ENGINE CONTEXT
    const policies = useUIPolicies();
    const debug = usePolicyDebug();

    return useMemo(() => {
        // const ctx: PolicyEvalContext = {
        //     ...evalCtx,
        //     ...selector,
        // };
        let permissionKey = selector.permissionKey;

        if (!permissionKey && selector.entity && selector.action) {
            // Generic, entity-agnostic permission key for the masters
            // framework: "master.<entityType>.<action>" (e.g. "master.country.view").
            permissionKey = `master.${selector.entity.type}.${selector.action}`.toLowerCase();
        }

        const ctx: PolicyEvalContext = {
            ...evalCtx,
            ...selector,
            permissionKey,
        };


        const decision = evaluatePolicy(policies, ctx);

        if (debug.enabled && import.meta.env.DEV) {
            return {
                ...decision,
                explain: explainPolicy(policies, ctx),
            };
        }

        return decision;
    }, [
        policies,
        debug.enabled,
        JSON.stringify(evalCtx),
        JSON.stringify(selector),
    ]);
}
