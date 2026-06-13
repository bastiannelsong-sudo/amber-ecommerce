/**
 * Tests for contact zod schemas — BFF-NAV-01, BFF-NAV-04, BFF-NAV-T4, BFF-NAV-T5
 *
 * Pure unit tests: no mocks needed, schemas are framework-agnostic.
 * Covers: valid shapes, invalid email, length constraints, optional fields.
 */

import { describe, it, expect } from 'vitest';
import { createContactMessageSchema } from './schemas';

// ---------------------------------------------------------------------------
// createContactMessageSchema
// ---------------------------------------------------------------------------
describe('createContactMessageSchema', () => {
  const validBody = {
    name: 'Ana',
    email: 'ana@example.com',
    subject: 'Hello',
    message: 'World',
  };

  it('accepts valid body with required fields only', () => {
    const result = createContactMessageSchema.safeParse(validBody);
    expect(result.success).toBe(true);
  });

  it('accepts valid body with optional phone', () => {
    const result = createContactMessageSchema.safeParse({
      ...validBody,
      phone: '+56912345678',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = createContactMessageSchema.safeParse({
      ...validBody,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing email', () => {
    const { email: _, ...withoutEmail } = validBody;
    const result = createContactMessageSchema.safeParse(withoutEmail);
    expect(result.success).toBe(false);
  });

  it('rejects message exceeding 2000 chars', () => {
    const result = createContactMessageSchema.safeParse({
      ...validBody,
      message: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts message of exactly 2000 chars (boundary)', () => {
    const result = createContactMessageSchema.safeParse({
      ...validBody,
      message: 'x'.repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  it('rejects subject exceeding 50 chars', () => {
    const result = createContactMessageSchema.safeParse({
      ...validBody,
      subject: 'x'.repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it('accepts subject of exactly 50 chars (boundary)', () => {
    const result = createContactMessageSchema.safeParse({
      ...validBody,
      subject: 'x'.repeat(50),
    });
    expect(result.success).toBe(true);
  });

  it('rejects name exceeding 100 chars', () => {
    const result = createContactMessageSchema.safeParse({
      ...validBody,
      name: 'x'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('rejects phone exceeding 20 chars when provided', () => {
    const result = createContactMessageSchema.safeParse({
      ...validBody,
      phone: '1'.repeat(21),
    });
    expect(result.success).toBe(false);
  });

  it('optional phone absent — valid', () => {
    const result = createContactMessageSchema.safeParse(validBody);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeUndefined();
    }
  });

  it('strips unknown fields', () => {
    const result = createContactMessageSchema.safeParse({
      ...validBody,
      injected: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Object.keys(result.data)).not.toContain('injected');
    }
  });
});
