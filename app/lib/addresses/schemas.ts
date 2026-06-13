/**
 * Zod schemas for BFF address route input validation.
 *
 * Each schema mirrors the corresponding amber-back DTO contract exactly.
 * Unknown fields are stripped by default (zod's .strip() behavior).
 * Do NOT add server-only here — this module must be importable in test environments.
 *
 * BFF-NAV-01, BFF-NAV-T5
 */

import { z } from 'zod';

// Source: amber-back/src/ecommerce-auth/dto/address.dto.ts — CreateAddressDto
export const createAddressSchema = z.object({
  street: z.string().min(5).max(255),
  apartment: z.string().max(100).optional(),
  city: z.string().min(2).max(100),
  region: z.string().min(2).max(100),
  zip_code: z.string().max(20).optional(),
  is_default: z.boolean().optional(),
});

// Source: amber-back/src/ecommerce-auth/dto/address.dto.ts — UpdateAddressDto
// All fields optional — empty {} is valid (BFF-NAV-06, ADR S2-003)
export const updateAddressSchema = createAddressSchema.partial();

// Inferred types for use in route handlers
export type CreateAddressDto = z.infer<typeof createAddressSchema>;
export type UpdateAddressDto = z.infer<typeof updateAddressSchema>;
