import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/app/AuthContext";
import { evaluatePolicy } from "../engine/evaluatePolicy";
import { explainPolicy } from "../engine/explainPolicy";
import type {
  PolicyEvalContext,
  UIPolicyContext,
} from "../engine/policy.types";
import { useUIPolicies } from "../hooks/useUIPolicies";
import { UserRole } from "@/domain/enums/UserRole";
import { usePolicyDebug } from "./PolicyDebugProvider";
import { useTelemetry } from "@/services/telemetry/TelemetryContext";
import { SecureStorage } from "@/services/storage/SecureStorage";
import type { AuthSession } from "@/services/auth/auth.types";

/* =========================
 * BuildPolicyContext
 * =======================*/
export function useBuildPolicyContext(): {
  evalCtx: PolicyEvalContext;
  uiCtx: UIPolicyContext;
} {
  const { user } = useAuth();
  const location = useLocation();
  const policies = useUIPolicies();
  const debug = usePolicyDebug();
  const telemetry = useTelemetry();

  // Read session OUTSIDE useMemo so we can derive a stable cache-key for the dep array.
  // SecureStorage.get is synchronous and cheap - fine to call on every render.
  const session = SecureStorage.get<AuthSession>("auth.session");

  // permissionsKey drives memo invalidation when the permissions array changes
  // (e.g. after OTP verify writes a new session with the real permissions list).
  // Using join(',') gives a stable primitive that React can compare.
  const permissionsKey = (session?.permissions ?? []).join(",");

  return useMemo(() => {
    // Re-derive inside memo so the closed-over values are always fresh.
    const rawPerms: string[] | null = session?.permissions ?? null;
    // null  → permissions key was never written (old/pre-login session)
    // []    → explicitly returned as empty from the DB (user has no grants)
    // [...] → real permission names
    const dbPermissionsLoaded = Array.isArray(rawPerms);
    const dbPermissions = new Set<string>(rawPerms ?? []);

    const evalCtx: PolicyEvalContext = {
      user: {
        role: user?.role ?? UserRole.Viewer,
        persona: user?.persona ?? "default",
        permissions: dbPermissions,
      },
      route: location.pathname,
      flags: {},
    };

    const uiCtx: UIPolicyContext = {
      can: (permissionKey: string) => {
        // 1. DB permissions were loaded AND this key is granted → allow
        if (dbPermissionsLoaded && dbPermissions.has(permissionKey)) {
          return true;
        }

        // 2. DB permissions were loaded AND key is NOT in set → deny
        //    (covers both empty-array users and users missing this specific permission)
        if (dbPermissionsLoaded) {
          return false;
        }

        // 3. Permissions array was never stored (old session / not yet logged in)
        //    → fall back to hardcoded policy engine so nothing breaks during dev/restore
        const decision = evaluatePolicy(
          policies,
          { ...evalCtx, permissionKey },
          telemetry,
        );
        return decision.enabled !== false && decision.visible !== false;
      },

      explain: debug.enabled
        ? (permissionKey: string) => {
            const result = explainPolicy(policies, {
              ...evalCtx,
              permissionKey,
            });
            return {
              allowed:
                result.decision.enabled !== false &&
                result.decision.visible !== false,
              matchedPolicy: result.matchedPolicies[0]?.policyId,
              reason: result.decision.reason,
            };
          }
        : undefined,
    };

    return { evalCtx, uiCtx };

    // permissionsKey is the critical dep - it changes whenever the DB permissions
    // array changes, forcing a fresh can() evaluation across the whole tree.
  }, [
    user?.role,
    user?.persona,
    location.pathname,
    policies,
    telemetry,
    debug.enabled,
    permissionsKey, // ← was missing in your version
  ]);
}