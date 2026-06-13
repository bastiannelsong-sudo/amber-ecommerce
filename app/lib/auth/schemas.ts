/**
 * Zod schemas for BFF auth route input validation.
 *
 * Each schema mirrors the corresponding amber-back DTO contract exactly.
 * Unknown fields are stripped by default (zod's .strip() behavior).
 * Do NOT add server-only here — this module must be importable in test environments.
 *
 * BFF-SEC-01, BFF-SEC-T3
 */

import { z } from 'zod';

// Source: amber-back/src/ecommerce-auth/dto/login.dto.ts — LoginDto
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Source: amber-back/src/ecommerce-auth/dto/register.dto.ts — RegisterDto
export const registerSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

// Source: amber-back/src/ecommerce-auth/dto/forgot-password.dto.ts — ForgotPasswordDto
export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// Source: amber-back/src/ecommerce-auth/dto/reset-password.dto.ts — ResetPasswordDto
// Note: field is `new_password`, NOT `password`.
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(6),
});

// Source: amber-back/src/ecommerce-auth/dto/update-profile.dto.ts — ChangePasswordDto
export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(6),
});

// Source: amber-back/src/ecommerce-auth/dto/update-profile.dto.ts — CreatePasswordDto
export const createPasswordSchema = z.object({
  password: z.string().min(6),
});

// Source: amber-back/src/ecommerce-auth/dto/google-auth.dto.ts — GoogleAuthDto
// Note: field is `credential`, NOT `id_token` (BFF-SEC-04 / ADR-006).
export const googleAuthSchema = z.object({
  credential: z.string().min(1),
});

// Source: amber-back/src/ecommerce-auth/dto/google-auth.dto.ts — GoogleAuthDto
// link-google reuses same shape as google auth.
export const linkGoogleSchema = z.object({
  credential: z.string().min(1),
});

// Source: amber-back/src/ecommerce-auth/dto/update-profile.dto.ts — UpdateProfileDto
// All fields optional — empty {} is valid (BFF-SEC-05).
export const updateProfileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  avatar_url: z.string().optional(),
});

// Inferred types for use in route handlers
export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type CreatePasswordDto = z.infer<typeof createPasswordSchema>;
export type GoogleAuthDto = z.infer<typeof googleAuthSchema>;
export type LinkGoogleDto = z.infer<typeof linkGoogleSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
