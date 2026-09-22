import type {
    UIPolicy,
    PolicyEvalContext,
    UIPolicyDecision,
} from "./policy.types";
import type { TelemetryPort } from "@/services/telemetry/TelemetryPort";

/**
 * evaluatePolicy
 * --------------
 * Core policy evaluation engine.
 * - Deny-by-default
 * - Deterministic
 * - Observable (telemetry is optional)
 */
export function evaluatePolicy(
    policies: UIPolicy[],
    ctx: PolicyEvalContext,
    telemetry?: TelemetryPort
): UIPolicyDecision {
    // 🔒 DENY by default
    const decision: UIPolicyDecision = {
        visible: false,
        enabled: false,
    };

    let matched = false;

    for (const policy of policies) {
        const match =
            (!policy.appliesTo.permissionKey ||
                policy.appliesTo.permissionKey === ctx.permissionKey) &&
            (!policy.appliesTo.entity ||
                policy.appliesTo.entity === ctx.entity?.type) &&
            (!policy.appliesTo.action ||
                policy.appliesTo.action === ctx.action);

        if (!match) continue;

        matched = true;

        for (const rule of policy.rules) {
            if (rule.when(ctx)) {
                Object.assign(decision, rule.effect);
            }
        }
    }

    const allowed = decision.visible !== false && decision.enabled !== false;

    /* =========================
     * Telemetry (NON-BLOCKING)
     * =======================*/
    if (telemetry && ctx.permissionKey) {
        telemetry.track({
            type: "policy_check",
            permissionKey: ctx.permissionKey,
            allowed,
            role: ctx.user.role,
            route: ctx.route,
            timestamp: Date.now(),
            source: "policy",
        });

        if (!allowed) {
            telemetry.track({
                type: "policy_denied",
                permissionKey: ctx.permissionKey,
                role: ctx.user.role,
                reason: decision.reason,
                route: ctx.route,
                timestamp: Date.now(),
                source: "policy",
            });
        }
    }

    // Optional: strict mode safeguard
    if (!matched && import.meta.env.PROD) {
        return { visible: false, enabled: false };
    }

    return decision;
}
