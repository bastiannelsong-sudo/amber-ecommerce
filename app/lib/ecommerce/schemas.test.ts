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
  createReviewSchema,
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

// ---------------------------------------------------------------------------
// createReviewSchema — matches amber-back CreateReviewDto
// Source: amber-back/src/ecommerce/dto/create-review.dto.ts
// Backend enforces: customer_name max(100), title max(255), comment max(2000)
// ---------------------------------------------------------------------------
describe('createReviewSchema', () => {
  const validReview = {
    product_id: 42,
    customer_name: 'Jane Doe',
    customer_email: 'jane@example.com',
    rating: 5,
    comment: 'Excellent product!',
  };

  // ---- happy path ----

  it('accepts a valid review payload', () => {
    const result = createReviewSchema.safeParse(validReview);
    expect(result.success).toBe(true);
  });

  it('accepts a review with all optional fields at valid lengths', () => {
    const result = createReviewSchema.safeParse({
      ...validReview,
      title: 'A'.repeat(255),
      order_number: 'ORD-001',
    });
    expect(result.success).toBe(true);
  });

  it('accepts customer_name at exact max length (100 chars)', () => {
    const result = createReviewSchema.safeParse({
      ...validReview,
      customer_name: 'A'.repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it('accepts comment at exact max length (2000 chars)', () => {
    const result = createReviewSchema.safeParse({
      ...validReview,
      comment: 'B'.repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  // ---- max-length violations (must REJECT) ----

  it('rejects customer_name exceeding 100 characters', () => {
    const result = createReviewSchema.safeParse({
      ...validReview,
      customer_name: 'A'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('rejects title exceeding 255 characters', () => {
    const result = createReviewSchema.safeParse({
      ...validReview,
      title: 'T'.repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it('rejects comment exceeding 2000 characters', () => {
    const result = createReviewSchema.safeParse({
      ...validReview,
      comment: 'C'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  // ---- existing min/required rules must still hold ----

  it('rejects missing comment (min(1) still applies)', () => {
    const { comment: _, ...withoutComment } = validReview;
    const result = createReviewSchema.safeParse(withoutComment);
    expect(result.success).toBe(false);
  });

  it('rejects empty comment (min(1) still applies)', () => {
    const result = createReviewSchema.safeParse({ ...validReview, comment: '' });
    expect(result.success).toBe(false);
  });

  it('rejects rating out of range (must be 1–5)', () => {
    const result = createReviewSchema.safeParse({ ...validReview, rating: 6 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid customer_email', () => {
    const result = createReviewSchema.safeParse({
      ...validReview,
      customer_email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});
