import { useMemo } from "react";
import { useUIPolicyContext } from "../context/UIPolicyContext";

/**
 * usePolicyExplain
 * ----------------
 * DEV-only helper for debugging policy decisions.
 *
 * ✅ Uses UI policy context
 * ❌ Does NOT touch engine directly
 */
export function usePolicyExplain(permissionKey: string) {
    const ctx = useUIPolicyContext();

    return useMemo(() => {
        if (!import.meta.env.DEV) return null;
        if (!ctx.explain) return null;

        return ctx.explain(permissionKey);
    }, [ctx, permissionKey]);
}
