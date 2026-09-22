import { z } from "zod";

const passwordSchema = z
  .string()
  .trim()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

const userOnboardingBaseSchema = z.object({
tenantProfileIds: z
  .array(z.number())
  .min(1, "Select at least one profile"),
  tenantId: z.number(),
  authUserName: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),

  appUserName: z.string().optional(),
  designation: z.string().optional(),
  notes: z.string().optional(),
  password: z.string().optional(),
  assignedBy: z.number(),
  roleId: z.number().optional(),
  isActive: z.boolean().optional(),
  profile: z.object({
    fullName: z.string().min(1, "Full name is required"),
    whatsappNumber: z
  .string()
  .min(1, "WhatsApp number is required")
  .regex(/^[0-9]{10}$/, "WhatsApp number must be exactly 10 digits"),
    profileImageUrl: z.any().optional(),
  }),
});

export const createUserOnboardingSchema = (isEditMode: boolean) =>
  userOnboardingBaseSchema.superRefine((data, ctx) => {
    if (isEditMode) return;

    if (!data.designation?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["designation"],
        message: "Designation is required",
      });
    }

    const passwordResult = passwordSchema.safeParse(data.password ?? "");
    if (!passwordResult.success) {
      passwordResult.error.issues.forEach((issue) => {
        ctx.addIssue({
          ...issue,
          path: ["password"],
        });
      });
    }
  });

export const userOnboardingSchema = createUserOnboardingSchema(false);

export type UserOnboardingForm = z.infer<typeof userOnboardingBaseSchema>;
