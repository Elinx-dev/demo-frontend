import { z } from "zod";

/* =========================
 * Workflow Step Schema
 * =======================*/
export const WorkflowStepSchema = z.object({
    id: z.string(),

    // 🔥 MUST match workflow.types.ts
    label: z.string(),
    description: z.string().optional(),

    /**
     * React component key
     * (resolved via registry at runtime)
     */
    component: z.string(),

    /**
     * Guards & validators
     * (functions are NOT runtime-validated)
     */
    canEnter: z.any().optional(),
    canExit: z.any().optional(),
    validate: z.any().optional(),
});

/* =========================
 * Workflow Actions
 * =======================*/
export const WorkflowActionsSchema = z.object({
    onSubmit: z.any().optional(),
    onApprove: z.any().optional(),
    onReject: z.any().optional(),
});

/* =========================
 * Persistence Metadata
 * =======================*/
export const WorkflowPersistenceSchema = z.object({
    enabled: z.boolean(),
    version: z.number().int().min(1),
});

/* =========================
 * Workflow Definition
 * =======================*/
export const WorkflowSchema = z.object({
    id: z.string(),

    // 🔥 workflow version (mandatory)
    version: z.number().int().min(1),

    entity: z.string(),

    /** Ordered steps */
    steps: z.array(WorkflowStepSchema).min(1),

    actions: WorkflowActionsSchema.optional(),

    persistence: WorkflowPersistenceSchema.optional(),
});

/* =========================
 * Runtime Validator
 * =======================*/
export function validateWorkflowConfig(config: unknown) {
    const result = WorkflowSchema.safeParse(config);

    if (!result.success) {
        console.error(
            "❌ Invalid Workflow Config",
            result.error.format()
        );
        throw new Error("Invalid workflow configuration");
    }

    return result.data;
}

/* =========================
 * Inferred Type (OPTIONAL)
 * =======================*/
export type WorkflowConfigRuntime = z.infer<
    typeof WorkflowSchema
>;
