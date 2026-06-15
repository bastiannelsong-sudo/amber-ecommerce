/**
 * Zod schemas for BFF ecommerce route input validation.
 *
 * Each schema mirrors the corresponding amber-back DTO contract exactly.
 * Unknown fields are stripped by default (zod's .strip() behavior).
 * Do NOT add server-only here — this module must be importable in test environments.
 *
 * BFF-NAV-01, BFF-NAV-T5
 */

import { z } from 'zod';

// Source: amber-back/src/ecommerce/dto/create-order.dto.ts — OrderItemDto
const orderItemSchema = z.object({
  product_id: z.number(),
  name: z.string().min(1),
  internal_sku: z.string().min(1),
  quantity: z.number().int().min(1),
  unit_price: z.number(),
  image_url: z.string().optional(),
});

// Source: amber-back/src/ecommerce/dto/create-order.dto.ts — CreateOrderDto
export const createOrderSchema = z.object({
  customer_email: z.string().email(),
  customer_name: z.string().min(1),
  customer_phone: z.string().optional(),
  shipping_address: z.string().min(1),
  shipping_city: z.string().min(1),
  shipping_region: z.string().min(1),
  shipping_postal_code: z.string().optional(),
  coupon_code: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
});

// Source: amber-back/src/ecommerce/dto/create-coupon.dto.ts — ValidateCouponDto
export const validateCouponSchema = z.object({
  code: z.string().min(1),
  cart_total: z.number(),
});

// Source: amber-back/src/ecommerce/dto/create-card-payment.dto.ts — CreateCardPaymentDto
// Backend contract: order (nested CreateOrderDto) + MP Bricks card fields.
export const cardPaymentSchema = z.object({
  order: createOrderSchema,
  card_token: z.string().min(1),
  payment_method_id: z.string().min(1),
  installments: z.number().int().min(1),
  issuer_id: z.number().optional(),
  payer_identification_type: z.string().optional(),
  payer_identification_number: z.string().optional(),
});

// Source: amber-back/src/ecommerce/dto/create-review.dto.ts — CreateReviewDto
export const createReviewSchema = z.object({
  product_id: z.number(),
  customer_name: z.string().min(1).max(100),
  customer_email: z.string().email(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(255).optional(),
  comment: z.string().min(1).max(2000),
  order_number: z.string().optional(),
});

// Inferred types for use in route handlers
export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type ValidateCouponDto = z.infer<typeof validateCouponSchema>;
export type CardPaymentDto = z.infer<typeof cardPaymentSchema>;
export type CreateReviewDto = z.infer<typeof createReviewSchema>;
