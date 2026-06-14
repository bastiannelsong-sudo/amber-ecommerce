import type { CartItem } from '@/features/cart/domain/cart.types';
import {
  subtotal as domainSubtotal,
  shippingCost,
} from '@/features/cart/domain/cart.rules';
import { orderTotal } from '@/features/checkout/domain/checkout.rules';
import type { CartSnapshot, CheckoutFormData } from '@/features/checkout/domain/checkout.types';

// ─── Cart → Snapshot ──────────────────────────────────────────────────────────

/**
 * Converts live cart items and a discount amount into an immutable CartSnapshot.
 * Prices are locked at this point — the snapshot is what gets sent to the backend.
 * unit_price is sourced from item.product.price (LOCKED field name).
 */
export const toCartSnapshot = (
  cartItems: CartItem[],
  discountAmount: number,
): CartSnapshot => {
  const subtotal = domainSubtotal(cartItems);
  const shipping = shippingCost(subtotal);
  const total = orderTotal(subtotal, discountAmount, shipping);

  return {
    items: cartItems.map((item) => ({
      product_id: item.product.product_id,
      name: item.product.name,
      internal_sku: item.product.internal_sku,
      quantity: item.quantity,
      unit_price: item.product.price, // LOCKED: always sourced from item.product.price
    })),
    subtotal,
    shipping,
    discount: discountAmount,
    total,
  };
};

// ─── Payload base type ────────────────────────────────────────────────────────

interface OrderPayloadBase {
  customer_email: string;
  customer_name: string;
  customer_phone: string | undefined;
  shipping_address: string;
  shipping_city: string;
  shipping_region: string;
  shipping_postal_code: string | undefined;
  items: CartSnapshot['items'];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  coupon_code?: string;
}

// ─── Snapshot + FormData → Order payload ─────────────────────────────────────

/**
 * Assembles the full order creation payload from a locked CartSnapshot and
 * checkout form data. Includes coupon_code only when present as a non-empty string.
 */
export const toOrderPayload = (
  snapshot: CartSnapshot,
  formData: CheckoutFormData,
  couponCode?: string | null,
): OrderPayloadBase => {
  const base: OrderPayloadBase = {
    customer_email: formData.email,
    customer_name: `${formData.firstName} ${formData.lastName}`.trim(),
    customer_phone: formData.phone || undefined,
    shipping_address: formData.apartment
      ? `${formData.address}, ${formData.apartment}`
      : formData.address,
    shipping_city: formData.commune,
    shipping_region: formData.region,
    shipping_postal_code: formData.postalCode || undefined,
    items: snapshot.items,
    subtotal: snapshot.subtotal,
    shipping: snapshot.shipping,
    discount: snapshot.discount,
    total: snapshot.total,
  };

  if (couponCode && couponCode.length > 0) {
    base.coupon_code = couponCode;
  }

  return base;
};
