import { describe, it, expect } from 'vitest';
import {
  addItem,
  removeItem,
  setQuantity,
  lineTotal,
  subtotal,
  qualifiesForFreeShipping,
  shippingCost,
  cartTotal,
  itemCount,
  itemQuantity,
} from './cart.rules';
import type { CartItem } from './cart.types';
import type { Product } from '@/app/lib/types';

// Minimal product fixtures — only cart-relevant fields
const productA: Product = {
  product_id: 1,
  internal_sku: 'A',
  name: 'Product A',
  stock: 10,
  stock_bodega: 0,
  cost: 0,
  price: 1000,
  image_url: '',
};

const productB: Product = {
  product_id: 2,
  internal_sku: 'B',
  name: 'Product B',
  stock: 5,
  stock_bodega: 0,
  cost: 0,
  price: 2000,
  image_url: '',
};

const itemA: CartItem = { product: productA, quantity: 2 };
const itemB: CartItem = { product: productB, quantity: 1 };

// ─────────────────────────────────────────────
// CART-R1: addItem — merge same product
// ─────────────────────────────────────────────
describe('addItem', () => {
  it('merges quantity when same product_id is already in the list', () => {
    const result = addItem([itemA], productA, 3);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(5);
  });

  it('appends a new line when product_id is different', () => {
    const result = addItem([itemA], productB, 1);
    expect(result).toHaveLength(2);
    expect(result[1].product.product_id).toBe(2);
    expect(result[1].quantity).toBe(1);
  });

  it('defaults quantity to 1 when not provided', () => {
    const result = addItem([], productA);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(1);
  });

  it('returns a new array (immutable)', () => {
    const items = [itemA];
    const result = addItem(items, productB, 1);
    expect(result).not.toBe(items);
  });
});

// ─────────────────────────────────────────────
// CART-R2: removeItem — remove by product_id
// ─────────────────────────────────────────────
describe('removeItem', () => {
  it('removes the item matching product_id', () => {
    const result = removeItem([itemA, itemB], 1);
    expect(result).toHaveLength(1);
    expect(result[0].product.product_id).toBe(2);
  });

  it('is a no-op when product_id is not found', () => {
    const result = removeItem([itemA], 999);
    expect(result).toHaveLength(1);
    expect(result[0].product.product_id).toBe(1);
  });

  it('returns a new array (immutable)', () => {
    const items = [itemA, itemB];
    const result = removeItem(items, 1);
    expect(result).not.toBe(items);
  });
});

// ─────────────────────────────────────────────
// CART-R3: setQuantity — update / remove on <= 0
// ─────────────────────────────────────────────
describe('setQuantity', () => {
  it('updates quantity for the matching line', () => {
    const result = setQuantity([itemA], 1, 4);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(4);
  });

  it('removes the line when quantity is 0', () => {
    const result = setQuantity([itemA], 1, 0);
    expect(result).toHaveLength(0);
  });

  it('removes the line when quantity is negative', () => {
    const result = setQuantity([itemA], 1, -1);
    expect(result).toHaveLength(0);
  });

  it('does not affect other lines', () => {
    const result = setQuantity([itemA, itemB], 1, 7);
    expect(result[0].quantity).toBe(7);
    expect(result[1].quantity).toBe(1);
  });
});

// ─────────────────────────────────────────────
// CART-R4: lineTotal — quantity * price, guard undefined
// ─────────────────────────────────────────────
describe('lineTotal', () => {
  it('returns quantity × price', () => {
    expect(lineTotal(itemA)).toBe(2000); // 2 * 1000
  });

  it('returns 0 when price is undefined', () => {
    const item: CartItem = {
      product: { ...productA, price: undefined as unknown as number },
      quantity: 3,
    };
    expect(lineTotal(item)).toBe(0);
  });

  it('returns 0 when price is 0', () => {
    const item: CartItem = { product: { ...productA, price: 0 }, quantity: 5 };
    expect(lineTotal(item)).toBe(0);
  });
});

// ─────────────────────────────────────────────
// CART-R5: subtotal — sum of lineTotals
// ─────────────────────────────────────────────
describe('subtotal', () => {
  it('sums line totals across all items', () => {
    // itemA: 2*1000=2000, itemB: 1*2000=2000  → 4000
    expect(subtotal([itemA, itemB])).toBe(4000);
  });

  it('returns 0 for an empty cart', () => {
    expect(subtotal([])).toBe(0);
  });
});

// ─────────────────────────────────────────────
// CART-R6 + CART-T2: qualifiesForFreeShipping — boundary 29999 / 30000 / 30001
// ─────────────────────────────────────────────
describe('qualifiesForFreeShipping', () => {
  it('returns false when subtotal is one below threshold (29999)', () => {
    expect(qualifiesForFreeShipping(29999)).toBe(false);
  });

  it('returns true when subtotal is exactly at threshold (30000) — boundary', () => {
    expect(qualifiesForFreeShipping(30000)).toBe(true);
  });

  it('returns true when subtotal is one above threshold (30001)', () => {
    expect(qualifiesForFreeShipping(30001)).toBe(true);
  });
});

// ─────────────────────────────────────────────
// CART-R7: shippingCost — delegates to qualifiesForFreeShipping
// ─────────────────────────────────────────────
describe('shippingCost', () => {
  it('returns 0 when subtotal qualifies for free shipping', () => {
    expect(shippingCost(30000)).toBe(0);
  });

  it('returns SHIPPING_COST (5000) when subtotal does not qualify', () => {
    expect(shippingCost(29999)).toBe(5000);
  });
});

// ─────────────────────────────────────────────
// CART-R8: cartTotal — subtotal + shippingCost
// ─────────────────────────────────────────────
describe('cartTotal', () => {
  it('adds shipping cost when below threshold', () => {
    expect(cartTotal(20000)).toBe(25000); // 20000 + 5000
  });

  it('has no shipping when at threshold', () => {
    expect(cartTotal(30000)).toBe(30000); // 30000 + 0
  });
});

// ─────────────────────────────────────────────
// ADR 2: itemCount + itemQuantity helpers
// ─────────────────────────────────────────────
describe('itemCount', () => {
  it('returns total quantity across all lines', () => {
    expect(itemCount([itemA, itemB])).toBe(3); // 2+1
  });

  it('returns 0 for empty cart', () => {
    expect(itemCount([])).toBe(0);
  });
});

describe('itemQuantity', () => {
  it('returns quantity for a known product_id', () => {
    expect(itemQuantity([itemA, itemB], 1)).toBe(2);
  });

  it('returns 0 for an unknown product_id', () => {
    expect(itemQuantity([itemA], 999)).toBe(0);
  });
});
