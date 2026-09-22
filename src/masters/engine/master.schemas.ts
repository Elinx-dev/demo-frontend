import { z } from "zod";

/* =========================
 * Column Schema (DATA ONLY)
 * =======================*/
/**
 * ⚠️ NOTE:
 * - render() is intentionally NOT validated
 * - render is a compile-time concern only
 */
export const MasterColumnSchema = z.object({
    key: z.string(),
    label: z.string(),
    sortable: z.boolean().optional(),
    filterable: z.boolean().optional(),
    type: z.enum(["text", "number", "boolean", "date"]).optional(),
});

/* =========================
 * Form Field Schema
 * =======================*/
export const MasterFieldSchema = z.object({
    name: z.string(),
    label: z.string(),

    type: z.enum([
        "text",
        "number",
        "textarea",
        "select",
        "autocomplete",
        "toggle",
        "checkbox",
        "date",
    ]),

    required: z.boolean().optional(),
    readonly: z.boolean().optional(),
    defaultValue: z.any().optional(),

    validation: z
        .object({
            minLength: z.number().optional(),
            maxLength: z.number().optional(),
            errorMessage: z.string().optional(),
        })
        .optional(),

    optionDetails: z.any().optional(),
});

/* =========================
 * Entity Definition
 * =======================*/
export const MasterEntitySchema = z.object({
    name: z.string(),
    idField: z.string(),
    statusField: z.string().optional(),
});

/* =========================
 * Endpoints Schema
 * =======================*/
export const MasterEndpointsSchema = z.object({
    list: z.string(),
    getById: z.string().optional(), // 🔥 FIX
    create: z.string(),
    update: z.string().optional(),
    delete: z.string().optional(),
});

/* =========================
 * Workflow Hook (Optional)
 * =======================*/
export const MasterWorkflowSchema = z.object({
    workflowKey: z.string(),
});

/* =========================
 * Master Config Schema
 * =======================*/
export const MasterConfigSchema = z.object({
    id: z.string(),

    // 🔥 REQUIRED for migration safety
    version: z.number().int().min(1),

    title: z.string(),

    entity: MasterEntitySchema,
    endpoints: MasterEndpointsSchema,

    columns: z.array(MasterColumnSchema).min(1),

    form: z.object({
        fields: z.array(MasterFieldSchema).min(1),
    }),

    workflow: MasterWorkflowSchema.optional(),

    audit: z.boolean().optional(),
});

/* =========================
 * Runtime Validator
 * =======================*/
/**
 * Runtime validation for master registry entries
 * Fails fast during app boot
 */
export function validateMasterConfig(config: unknown) {
    const result = MasterConfigSchema.safeParse(config);

    if (!result.success) {
        console.error(
            "❌ Invalid Master Config",
            result.error.format()
        );
        throw new Error("Invalid master configuration");
    }

    return result.data;
}

/* =========================
 * Inferred Runtime Type
 * =======================*/
export type MasterConfigRuntime = z.infer<
    typeof MasterConfigSchema
>;
