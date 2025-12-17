import { z } from "zod";

export const createApplicationSchema = z.object({
  body: z.object({
    jobId: z.string().length(24, "Invalid job id"),
    coverLetter: z.string().max(5000).optional(),
    resumeUrl: z.string().url().optional(), // if student wants to attach custom resume
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().length(24, "Invalid application id") }),
});

export const updateStatusSchema = z.object({
  params: z.object({ id: z.string().length(24, "Invalid application id") }),
  body: z.object({
    status: z.enum(["shortlisted", "rejected", "hired"]),
  }),
});
