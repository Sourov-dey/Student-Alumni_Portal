import { z } from "zod";

export const JobTypes = [
  "Full-time",
  "Part-time",
  "Internship",
  "Contract",
  "Freelance",
];

export const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(120),
    company: z.string().min(2).max(120),
    location: z.string().min(2).max(120).default("Remote").optional(),
    department: z.string().min(2).max(120).optional(),
    type: z.enum(JobTypes).default("Full-time").optional(),
    description: z.string().min(10).max(8000),
    requirements: z.array(z.string().min(1).max(120)).default([]).optional(),
  }),
});

export const updateJobSchema = z.object({
  params: z.object({
    id: z.string().length(24, "Invalid job id"),
  }),
  body: z
    .object({
      title: z.string().min(3).max(120).optional(),
      company: z.string().min(2).max(120).optional(),
      location: z.string().min(2).max(120).optional(),
      department: z.string().min(2).max(120).optional(),
      type: z.enum(JobTypes).optional(),
      description: z.string().min(10).max(8000).optional(),
      requirements: z.array(z.string().min(1).max(120)).optional(),
      isActive: z.boolean().optional(),
      markedFilled: z.boolean().optional(),
    })
    .strict(),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().length(24, "Invalid job id"),
  }),
});

export const listJobsQuerySchema = z.object({
  query: z.object({
    search: z.string().max(200).optional(),
    department: z.string().optional(),
    location: z.string().optional(),
    type: z.enum(JobTypes).optional(),
    isActive: z.union([z.literal("true"), z.literal("false")]).optional(),
    sort: z.enum(["recent", "company", "title"]).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});
