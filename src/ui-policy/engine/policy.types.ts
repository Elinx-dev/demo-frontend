/* =========================
 * Policy Evaluation Context (ENGINE INPUT)
 * =======================*/
export type PolicyEvalContext = {
    user: {
        role: string;          // (can be tightened to enum later)
        persona?: string;
        permissions?: Set<string>;
    };

    /** Current route (optional for rule targeting) */
    route?: string;

    /** Feature / page permission key */
    permissionKey?: string;

    /** Canonical CRUD action */
    action?: string;

    /** Entity context */
    entity?: {
        type: string;
        id?: string;
        status?: string;
    };

    /** Optional feature flags */
    flags?: Record<string, boolean>;
};

/* =========================
 * Policy Decision (ENGINE OUTPUT)
 * =======================*/
export type UIPolicyDecision = {
    visible?: boolean;
    enabled?: boolean;
    readonly?: boolean;
    reason?: string;
    severity?: "info" | "warning" | "blocking";
};

/* =========================
 * Policy Rule (DECLARATIVE)
 * =======================*/
export type UIPolicy = {
    id?: string;

    appliesTo: {
        permissionKey?: string;
        action?: string;
        entity?: string;
    };

    rules: {
        when: (ctx: PolicyEvalContext) => boolean;
        effect: Partial<UIPolicyDecision>;
    }[];
};

/* =========================
 * UI Policy Context (PUBLIC API)
 * =======================*/
export type UIPolicyContext = {
    /** Capability check */
    can: (permissionKey: string) => boolean;

    /** Optional explainability */
    explain?: (permissionKey: string) => {
        allowed: boolean;
        matchedPolicy?: string;
        reason?: string;
    };
};
