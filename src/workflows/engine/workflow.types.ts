import type { ComponentType } from "react";

/* =========================
 * Step Status
 * =======================*/
export type WorkflowStepStatus =
    | "not_started"
    | "in_progress"
    | "blocked"
    | "completed";

/* =========================
 * Step Props (GENERIC)
 * =======================*/
export type WorkflowStepProps<TData extends Record<string, any>> = {
    data: TData;
    setData: React.Dispatch<React.SetStateAction<TData>>;
};

/* =========================
 * Step Config (GENERIC)
 * =======================*/
export type WorkflowStepConfig<TData extends Record<string, any>> = {
    id: string;
    label: string;
    description?: string;

    component: ComponentType<WorkflowStepProps<TData>>;

    canEnter?: (ctx: TData) => boolean;
    canExit?: (data: TData) => boolean;
    validate?: (data: TData) => string | null;
};

/* =========================
 * Workflow Config (GENERIC)
 * =======================*/
export type WorkflowConfig<TData extends Record<string, any> = Record<string, any>> = {
    id: string;
    entity: string;
    steps: WorkflowStepConfig<TData>[];
};
