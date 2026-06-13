/**
 * Tests for ecommerce zod schemas — BFF-NAV-01, BFF-NAV-T3, BFF-NAV-T4, BFF-NAV-T5
 *
 * Pure unit tests: no mocks needed, schemas are framework-agnostic.
 * Covers: valid shapes, invalid types, missing required fields, unknown field stripping.
 */

import { describe, it, expect } from 'vitest';
import {
  createOrderSchema,
  validateCouponSchema,
} from './schemas';

// ---------------------------------------------------------------------------
// createOrderSchema — orderItemSchema (nested)
// ---------------------------------------------------------------------------
describe('createOrderSchema — order item validation', () => {
  const validItem = {
    product_id: 1,
    name: 'Widget',
    internal_sku: 'WGT-001',
    quantity: 2,
    unit_price: 19.99,
  };

  const validBase = {
    customer_email: 'buyer@example.com',
    customer_name: 'John Doe',
    shipping_address: '123 Main St',
    shipping_city: 'Lima',
    shipping_region: 'Lima',
  };

  it('accepts valid item with all required fields', () => {
    const result = createOrderSchema.safeParse({ ...validBase, items: [validItem] });
    expect(result.success).toBe(true);
  });

  it('accepts item with optional image_url', () => {
    const result = createOrderSchema.safeParse({
      ...validBase,
      items: [{ ...validItem, image_url: 'https://cdn.example.com/widget.png' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects item with string quantity (wrong type)', () => {
    const result = createOrderSchema.safeParse({
      ...validBase,
      items: [{ ...validItem, quantity: 'two' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects item with quantity < 1 (min(1) constraint)', () => {
    const result = createOrderSchema.safeParse({
      ...validBase,
      items: [{ ...validItem, quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects item missing internal_sku', () => {
    const { internal_sku: _, ...itemWithoutSku } = validItem;
    const result = createOrderSchema.safeParse({ ...validBase, items: [itemWithoutSku] });
    expect(result.success).toBe(false);
  });

  it('strips unknown fields on item', () => {
    const result = createOrderSchema.safeParse({
      ...validBase,
      items: [{ ...validItem, extra_field: 'evil' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Object.keys(result.data.items[0])).not.toContain('extra_field');
    }
  });
});

// ---------------------------------------------------------------------------
// createOrderSchema — top-level
// ---------------------------------------------------------------------------
describe('createOrderSchema — top-level validation', () => {
  const validItem = {
    product_id: 1,
    name: 'Widget',
    internal_sku: 'WGT-001',
    quantity: 2,
    unit_price: 19.99,
  };

  it('accepts valid full order body', () => {
    const result = createOrderSchema.safeParse({
      customer_email: 'buyer@example.com',
      customer_name: 'John Doe',
      customer_phone: '+56912345678',
      shipping_address: '123 Main St',
      shipping_city: 'Lima',
      shipping_region: 'Lima',
      shipping_postal_code: '15001',
      coupon_code: 'SAVE10',
      items: [validItem],
    });
    expect(result.success).toBe(true);
  });

  it('accepts order without optional fields', () => {
    const result = createOrderSchema.safeParse({
      customer_email: 'buyer@example.com',
      customer_name: 'John Doe',
      shipping_address: '123 Main St',
      shipping_city: 'Lima',
      shipping_region: 'Lima',
      items: [validItem],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty items array (min(1))', () => {
    const result = createOrderSchema.safeParse({
      customer_email: 'buyer@example.com',
      customer_name: 'John Doe',
      shipping_address: '123 Main St',
      shipping_city: 'Lima',
      shipping_region: 'Lima',
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid customer_email format', () => {
    const result = createOrderSchema.safeParse({
      customer_email: 'not-an-email',
      customer_name: 'John Doe',
      shipping_address: '123 Main St',
      shipping_city: 'Lima',
      shipping_region: 'Lima',
      items: [validItem],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing customer_name', () => {
    const result = createOrderSchema.safeParse({
      customer_email: 'buyer@example.com',
      shipping_address: '123 Main St',
      shipping_city: 'Lima',
      shipping_region: 'Lima',
      items: [validItem],
    });
    expect(result.success).toBe(false);
  });

  it('strips unknown top-level fields (e.g. __proto__)', () => {
    const result = createOrderSchema.safeParse({
      customer_email: 'buyer@example.com',
      customer_name: 'John Doe',
      shipping_address: '123 Main St',
      shipping_city: 'Lima',
      shipping_region: 'Lima',
      items: [validItem],
      __proto__: 'evil',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Object.keys(result.data)).not.toContain('__proto__');
    }
  });
});

// ---------------------------------------------------------------------------
// validateCouponSchema
// ---------------------------------------------------------------------------
describe('validateCouponSchema', () => {
  it('accepts valid { code, cart_total }', () => {
    const result = validateCouponSchema.safeParse({ code: 'SAVE10', cart_total: 99.9 });
    expect(result.success).toBe(true);
  });

  it('rejects string cart_total (wrong type)', () => {
    const result = validateCouponSchema.safeParse({ code: 'SAVE10', cart_total: 'ninety' });
    expect(result.success).toBe(false);
  });

  it('rejects missing code', () => {
    const result = validateCouponSchema.safeParse({ cart_total: 50 });
    expect(result.success).toBe(false);
  });

  it('rejects missing cart_total', () => {
    const result = validateCouponSchema.safeParse({ code: 'SAVE10' });
    expect(result.success).toBe(false);
  });

  it('accepts numeric cart_total of 0', () => {
    const result = validateCouponSchema.safeParse({ code: 'FREE', cart_total: 0 });
    expect(result.success).toBe(true);
  });

  it('strips unknown fields', () => {
    const result = validateCouponSchema.safeParse({
      code: 'SAVE10',
      cart_total: 99.9,
      injected: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Object.keys(result.data)).not.toContain('injected');
    }
  });
});
