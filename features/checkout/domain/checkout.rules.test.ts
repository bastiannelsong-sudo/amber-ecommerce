import { describe, it, expect } from 'vitest';
import {
  orderTotal,
  isCheckoutReady,
  missingShippingFields,
  sanitizePhone,
} from './checkout.rules';
import type { CheckoutFormData } from './checkout.types';

// ─── orderTotal ───────────────────────────────────────────────────────────────

describe('orderTotal', () => {
  it('normal case: discount < subtotal + shipping', () => {
    expect(orderTotal(25000, 2000, 5000)).toBe(28000);
  });

  it('zero discount', () => {
    expect(orderTotal(20000, 0, 5000)).toBe(25000);
  });

  it('clamp boundary: discount === subtotal + shipping → 0', () => {
    expect(orderTotal(10000, 15000, 5000)).toBe(0);
  });

  it('clamp boundary: discount > subtotal + shipping → 0', () => {
    expect(orderTotal(5000, 20000, 5000)).toBe(0);
  });
});

// ─── isCheckoutReady ─────────────────────────────────────────────────────────

const fullForm: CheckoutFormData = {
  email: 'user@example.com',
  firstName: 'Ana',
  lastName: 'García',
  phone: '+56912345678',
  address: 'Av. Principal 123',
  apartment: '',
  region: 'RM',
  commune: 'Las Condes',
  postalCode: '',
};

describe('isCheckoutReady', () => {
  it('returns true when all required fields are present', () => {
    expect(isCheckoutReady(fullForm)).toBe(true);
  });

  it('returns false when commune is empty', () => {
    expect(isCheckoutReady({ ...fullForm, commune: '' })).toBe(false);
  });

  it('returns false when email is missing', () => {
    expect(isCheckoutReady({ ...fullForm, email: '' })).toBe(false);
  });

  it('returns false when region is missing', () => {
    expect(isCheckoutReady({ ...fullForm, region: '' })).toBe(false);
  });
});

// ─── missingShippingFields ───────────────────────────────────────────────────

describe('missingShippingFields', () => {
  it('returns empty array when all required fields present', () => {
    expect(missingShippingFields(fullForm)).toEqual([]);
  });

  it('returns email and region when both are empty', () => {
    const result = missingShippingFields({ ...fullForm, email: '', region: '' });
    expect(result).toContain('email');
    expect(result).toContain('region');
    expect(result).toHaveLength(2);
  });

  it('returns single missing field', () => {
    expect(missingShippingFields({ ...fullForm, firstName: '' })).toEqual(['firstName']);
  });
});

// ─── sanitizePhone ───────────────────────────────────────────────────────────

describe('sanitizePhone', () => {
  it('strips spaces from formatted phone with leading +', () => {
    expect(sanitizePhone('+56 9 1234 5678')).toBe('+56912345678');
  });

  it('leaves already clean value unchanged', () => {
    expect(sanitizePhone('912345678')).toBe('912345678');
  });

  it('removes dashes and dots', () => {
    expect(sanitizePhone('9-1234-5678')).toBe('912345678');
  });
});
