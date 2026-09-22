import { z } from "zod";

/* =========================
 * Common Primitives
 * =======================*/

export const IdSchema = z.union([z.string(), z.number()]);

export const PaginationSchema = z.object({
    page: z.number().int().positive().optional(),
    size: z.number().int().positive().optional(),
    total: z.number().int().nonnegative().optional(),
});

/* =========================
 * Generic API Wrappers
 * =======================*/

export const ApiSuccessSchema = <T extends z.ZodTypeAny>(data: T) =>
    z.object({
        success: z.literal(true),
        data,
    });

export const ApiListSchema = <T extends z.ZodTypeAny>(item: T) =>
    z.object({
        items: z.array(item),
        pagination: PaginationSchema.optional(),
    });

export const ApiErrorSchema = z.object({
    success: z.literal(false),
    error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.unknown().optional(),
    }),
});

/* =========================
 * Master Entity Schemas
 * =======================*/

export const CountrySchema = z.object({
    id: IdSchema,
    name: z.string().min(1),
    code: z.string().min(2),
    is_active: z.boolean(),
});

export const ModuleSchema = z.object({
    id: IdSchema,
    name: z.string().min(1),
    key: z.string().min(1),
    is_active: z.boolean(),
});

export const StateSchema = z.object({
    id: IdSchema,
    name: z.string().min(1),
    code: z.string().min(1),
    country_id: IdSchema,
    is_active: z.boolean(),
});

export const DistrictSchema = z.object({
    id: IdSchema,
    name: z.string().min(1),
    code: z.string().min(1),
    state_id: IdSchema,
    is_active: z.boolean(),
});


/* =========================
 * API Response Schemas
 * =======================*/

export const CountryListResponseSchema = ApiSuccessSchema(
    ApiListSchema(CountrySchema)
);

export const ModuleListResponseSchema = ApiSuccessSchema(
    ApiListSchema(ModuleSchema)
);

/* =========================
 * Inferred Types (🔥 SAFE)
 * =======================*/

export type CountryDTO = z.infer<typeof CountrySchema>;
export type ModuleDTO = z.infer<typeof ModuleSchema>;

export type CountryListResponse = z.infer<
    typeof CountryListResponseSchema
>;

export type ModuleListResponse = z.infer<
    typeof ModuleListResponseSchema
>;
