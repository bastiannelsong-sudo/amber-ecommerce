/**
 * Zod schemas for BFF contact route input validation.
 *
 * Each schema mirrors the corresponding amber-back DTO contract exactly.
 * Unknown fields are stripped by default (zod's .strip() behavior).
 * Do NOT add server-only here — this module must be importable in test environments.
 *
 * BFF-NAV-01, BFF-NAV-T5
 */

import { z } from 'zod';

// Source: amber-back/src/contact/dto/create-contact-message.dto.ts — CreateContactMessageDto
export const createContactMessageSchema = z.object({
  name: z.string().max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  subject: z.string().max(50),
  message: z.string().max(2000),
});

// Inferred types for use in route handlers
export type CreateContactMessageDto = z.infer<typeof createContactMessageSchema>;
