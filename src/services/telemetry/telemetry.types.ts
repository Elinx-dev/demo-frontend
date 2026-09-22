/* =========================
 * Telemetry Event Types
 * =======================*/

export type BaseTelemetryEvent = {
    timestamp: number;
    correlationId?: string;
    source: "ui" | "policy" | "navigation" | "workflow" | "api";
};

/* =========================
 * Policy Events
 * =======================*/

export type PolicyCheckEvent = BaseTelemetryEvent & {
    type: "policy_check";
    permissionKey: string;
    allowed: boolean;
    role: string;
    route?: string;
};

export type PolicyDeniedEvent = BaseTelemetryEvent & {
    type: "policy_denied";
    permissionKey: string;
    role: string;
    reason?: string;
    route?: string;
};

/* =========================
 * Route Events (future-proof)
 * =======================*/

export type RouteChangeEvent = BaseTelemetryEvent & {
    type: "route_change";
    from?: string;
    to: string;
};

/* =========================
 * Workflow Events (future-proof)
 * =======================*/

export type WorkflowTransitionEvent = BaseTelemetryEvent & {
    type: "workflow_transition";
    workflowId: string;
    fromStep?: string;
    toStep: string;
};

/* =========================
 * Union
 * =======================*/

export type TelemetryEvent =
    | PolicyCheckEvent
    | PolicyDeniedEvent
    | RouteChangeEvent
    | WorkflowTransitionEvent;
