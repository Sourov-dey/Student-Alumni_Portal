import { z } from "zod";

export const idParamSchema = z.object({
  params: z.object({ id: z.string().length(24, "Invalid user id") }),
});

export const updateUserSchema = z.object({
  params: z.object({ id: z.string().length(24, "Invalid user id") }),
  body: z
    .object({
      name: z.string().min(2).max(120).optional(),
      role: z.enum(["student", "alumni", "admin"]).optional(),
      graduationYear: z.number().int().min(1950).max(2100).optional(),
      department: z.string().max(120).optional(),
      currentCompany: z.string().max(120).optional(),
      position: z.string().max(120).optional(),
      contactPhone: z.string().max(20).optional(),
      currentYear: z.number().int().min(1).max(8).optional(),
      skills: z.array(z.string().min(1).max(60)).optional(),
      profileComplete: z.boolean().optional(),
      verifiedByAdmin: z.boolean().optional(),
    })
    .strict(),
});
