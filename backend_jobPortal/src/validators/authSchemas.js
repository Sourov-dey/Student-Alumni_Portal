// src/validators/authSchemas.js
import { z } from "zod";

export const devLoginSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    email: z.string().email(),
    role: z.enum(["student", "alumni", "admin"]).default("student").optional(),
  }),
});
