import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Invalid email").max(254).toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  name: z.string().max(100).optional(),
});

export const signinSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

export const forgotSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

export const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export const verifySchema = z.object({
  token: z.string().min(1),
});
