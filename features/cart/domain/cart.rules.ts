import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from './cart.constants';
import type { CartItem, CartProduct } from './cart.types';

// ─── Mutation rules ───────────────────────────────────────────────────────────

export const addItem = (
  items: CartItem[],
  product: CartProduct,
  quantity = 1,
): CartItem[] => {
  const existing = items.find((i) => i.product.product_id === product.product_id);
  if (existing) {
    return items.map((i) =>
      i.product.product_id === product.product_id
        ? { ...i, quantity: i.quantity + quantity }
        : i,
    );
  }
  return [...items, { product, quantity }];
};

export const removeItem = (items: CartItem[], productId: number): CartItem[] =>
  items.filter((i) => i.product.product_id !== productId);

export const setQuantity = (
  items: CartItem[],
  productId: number,
  quantity: number,
): CartItem[] => {
  if (quantity <= 0) return removeItem(items, productId);
  return items.map((i) =>
    i.product.product_id === productId ? { ...i, quantity } : i,
  );
};

// ─── Calculation rules ────────────────────────────────────────────────────────

export const lineTotal = (item: CartItem): number =>
  item.quantity * (item.product.price || 0);

export const subtotal = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + lineTotal(item), 0);

export const qualifiesForFreeShipping = (sub: number): boolean =>
  sub >= FREE_SHIPPING_THRESHOLD;

export const shippingCost = (sub: number): number =>
  qualifiesForFreeShipping(sub) ? 0 : SHIPPING_COST;

export const cartTotal = (sub: number): number => sub + shippingCost(sub);

// ─── Selector helpers ─────────────────────────────────────────────────────────

export const itemCount = (items: CartItem[]): number =>
  items.reduce((sum, i) => sum + i.quantity, 0);

export const itemQuantity = (items: CartItem[], productId: number): number =>
  items.find((i) => i.product.product_id === productId)?.quantity ?? 0;
