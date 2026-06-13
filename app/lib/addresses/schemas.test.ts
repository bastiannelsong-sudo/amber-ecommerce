/**
 * Tests for address zod schemas — BFF-NAV-01, BFF-NAV-05, BFF-NAV-06, BFF-NAV-T4, BFF-NAV-T5, ADR S2-003
 *
 * Pure unit tests: no mocks needed, schemas are framework-agnostic.
 * Covers: valid shapes, min-length constraints, optional fields, partial (updateAddressSchema).
 */

import { describe, it, expect } from 'vitest';
import { createAddressSchema, updateAddressSchema } from './schemas';

// ---------------------------------------------------------------------------
// createAddressSchema
// ---------------------------------------------------------------------------
describe('createAddressSchema', () => {
  const validBody = {
    street: 'Main St 123',
    city: 'Lima',
    region: 'Lima',
  };

  it('accepts valid body with required fields only', () => {
    const result = createAddressSchema.safeParse(validBody);
    expect(result.success).toBe(true);
  });

  it('accepts valid body with all optional fields', () => {
    const result = createAddressSchema.safeParse({
      street: 'Main St 123',
      apartment: 'Apt 4B',
      city: 'Lima',
      region: 'Lima',
      zip_code: '15001',
      is_default: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects street shorter than 5 chars (min(5))', () => {
    const result = createAddressSchema.safeParse({ ...validBody, street: 'Hi' });
    expect(result.success).toBe(false);
  });

  it('accepts street of exactly 5 chars (min boundary)', () => {
    const result = createAddressSchema.safeParse({ ...validBody, street: '12345' });
    expect(result.success).toBe(true);
  });

  it('rejects street exceeding 255 chars (max(255))', () => {
    const result = createAddressSchema.safeParse({ ...validBody, street: 'x'.repeat(256) });
    expect(result.success).toBe(false);
  });

  it('rejects city shorter than 2 chars (min(2))', () => {
    const result = createAddressSchema.safeParse({ ...validBody, city: 'X' });
    expect(result.success).toBe(false);
  });

  it('accepts city of exactly 2 chars (min boundary)', () => {
    const result = createAddressSchema.safeParse({ ...validBody, city: 'Li' });
    expect(result.success).toBe(true);
  });

  it('rejects region shorter than 2 chars', () => {
    const result = createAddressSchema.safeParse({ ...validBody, region: 'X' });
    expect(result.success).toBe(false);
  });

  it('optional fields absent — valid', () => {
    const result = createAddressSchema.safeParse(validBody);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.apartment).toBeUndefined();
      expect(result.data.zip_code).toBeUndefined();
      expect(result.data.is_default).toBeUndefined();
    }
  });

  it('strips unknown field injected into body', () => {
    const result = createAddressSchema.safeParse({ ...validBody, injected: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Object.keys(result.data)).not.toContain('injected');
    }
  });

  it('rejects missing city', () => {
    const { city: _, ...withoutCity } = validBody;
    const result = createAddressSchema.safeParse(withoutCity);
    expect(result.success).toBe(false);
  });

  it('rejects missing region', () => {
    const { region: _, ...withoutRegion } = validBody;
    const result = createAddressSchema.safeParse(withoutRegion);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateAddressSchema (= createAddressSchema.partial() — BFF-NAV-06, ADR S2-003)
// ---------------------------------------------------------------------------
describe('updateAddressSchema', () => {
  it('accepts empty body {} — all fields optional (BFF-NAV-06)', () => {
    const result = updateAddressSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only city', () => {
    const result = updateAddressSchema.safeParse({ city: 'Arequipa' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ city: 'Arequipa' });
    }
  });

  it('accepts partial update with only region', () => {
    const result = updateAddressSchema.safeParse({ region: 'Arequipa' });
    expect(result.success).toBe(true);
  });

  it('rejects { street: "Hi" } — street still enforces min(5) when provided', () => {
    const result = updateAddressSchema.safeParse({ street: 'Hi' });
    expect(result.success).toBe(false);
  });

  it('accepts { street: "12345" } — at min(5) boundary', () => {
    const result = updateAddressSchema.safeParse({ street: '12345' });
    expect(result.success).toBe(true);
  });

  it('rejects { city: "X" } — city still enforces min(2) when provided', () => {
    const result = updateAddressSchema.safeParse({ city: 'X' });
    expect(result.success).toBe(false);
  });

  it('accepts full update with all fields', () => {
    const result = updateAddressSchema.safeParse({
      street: 'Main St 123',
      apartment: 'Apt 4B',
      city: 'Lima',
      region: 'Lima',
      zip_code: '15001',
      is_default: false,
    });
    expect(result.success).toBe(true);
  });
});
