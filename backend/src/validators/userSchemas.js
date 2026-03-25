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
      gender: z.enum(["male", "female", "other", "prefer-not-to-say"]).optional(),
      dateOfBirth: z.string().optional(),
      graduationYear: z.number().int().min(1950).max(2100).optional(),
      department: z.string().max(120).optional(),
      currentCompany: z.string().max(120).optional(),
      position: z.string().max(120).optional(),
      contactPhone: z.string().max(20).optional(),
      phone: z.string().max(20).optional(),
      currentYear: z.number().int().min(1).max(8).optional(),
      bio: z.string().max(500).optional(),
      skills: z.array(z.string().min(1).max(60)).optional(),
      technicalSkills: z.array(z.string().min(1).max(60)).optional(),
      nonTechnicalSkills: z.array(z.string().min(1).max(60)).optional(),
      projects: z.array(z.object({
        title: z.string().min(1).max(120),
        description: z.string().max(500).optional(),
        link: z.string().max(300).optional(),
      })).optional(),
      certifications: z.array(z.object({
        title: z.string().min(1).max(120),
        issuer: z.string().max(120).optional(),
        year: z.number().int().min(1950).max(2100).optional(),
      })).optional(),
      interests: z.array(z.string().min(1).max(60)).optional(),
      profileComplete: z.boolean().optional(),
      verifiedByAdmin: z.boolean().optional(),
      location: z.object({
        city: z.string().max(120).optional(),
        country: z.string().max(120).optional(),
        coordinates: z.object({
          lat: z.number().min(-90).max(90),
          lng: z.number().min(-180).max(180),
        }).optional(),
      }).optional(),
    })
    .strict(),
});
