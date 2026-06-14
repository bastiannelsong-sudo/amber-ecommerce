import { describe, it, expect } from 'vitest';
import {
  filterProducts,
  sortProducts,
  formatPrice,
  calcDiscount,
  isInStock,
} from './catalog.rules';
import type { CatalogProduct, CatalogFilter, SortOption } from './catalog.types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeProduct = (overrides: Partial<CatalogProduct> = {}): CatalogProduct => ({
  product_id: 1,
  name: 'Collar Ambar',
  price: 15990,
  compare_at_price: null,
  image_url: 'https://cdn.example.com/collar.jpg',
  slug: 'collar-ambar',
  stock: 5,
  category: { name: 'Collares' },
  ...overrides,
});

// ─── filterProducts (CAT-R1) ──────────────────────────────────────────────────

describe('filterProducts', () => {
  it('returns all products when filters are empty', () => {
    const products = [makeProduct({ product_id: 1 }), makeProduct({ product_id: 2 })];
    const result = filterProducts(products, {});
    expect(result).toHaveLength(2);
  });

  it('filters by collection (tag match)', () => {
    const anillo = makeProduct({ product_id: 1, tags: ['anillos'] });
    const collar = makeProduct({ product_id: 2, tags: ['collares'] });
    const result = filterProducts([anillo, collar], { collections: ['anillos'] });
    expect(result).toHaveLength(1);
    expect(result[0].product_id).toBe(1);
  });

  it('filters by priceMin and priceMax', () => {
    const cheap = makeProduct({ product_id: 1, price: 5000 });
    const mid = makeProduct({ product_id: 2, price: 15000 });
    const expensive = makeProduct({ product_id: 3, price: 25000 });
    const result = filterProducts([cheap, mid, expensive], { priceMin: 10000, priceMax: 20000 });
    expect(result).toHaveLength(1);
    expect(result[0].product_id).toBe(2);
  });

  it('filters by material', () => {
    const silver = makeProduct({ product_id: 1, material: 'silver' });
    const gold = makeProduct({ product_id: 2, material: 'gold' });
    const result = filterProducts([silver, gold], { material: 'silver' });
    expect(result).toHaveLength(1);
    expect(result[0].product_id).toBe(1);
  });

  it('filters by style', () => {
    const classic = makeProduct({ product_id: 1, style: 'classic' });
    const modern = makeProduct({ product_id: 2, style: 'modern' });
    const result = filterProducts([classic, modern], { style: 'classic' });
    expect(result).toHaveLength(1);
    expect(result[0].product_id).toBe(1);
  });

  it('applies all non-empty filters as AND conditions', () => {
    const match = makeProduct({ product_id: 1, price: 15000, material: 'silver', tags: ['anillos'] });
    const noMaterial = makeProduct({ product_id: 2, price: 15000, material: 'gold', tags: ['anillos'] });
    const result = filterProducts([match, noMaterial], { material: 'silver', collections: ['anillos'] });
    expect(result).toHaveLength(1);
    expect(result[0].product_id).toBe(1);
  });
});

// ─── sortProducts (CAT-R2) ────────────────────────────────────────────────────

describe('sortProducts', () => {
  it('price-asc: orders lowest price first', () => {
    const products = [
      makeProduct({ product_id: 1, price: 300 }),
      makeProduct({ product_id: 2, price: 100 }),
      makeProduct({ product_id: 3, price: 200 }),
    ];
    const result = sortProducts(products, 'price-asc');
    expect(result.map((p) => p.price)).toEqual([100, 200, 300]);
  });

  it('price-desc: orders highest price first', () => {
    const products = [
      makeProduct({ product_id: 1, price: 300 }),
      makeProduct({ product_id: 2, price: 100 }),
      makeProduct({ product_id: 3, price: 200 }),
    ];
    const result = sortProducts(products, 'price-desc');
    expect(result.map((p) => p.price)).toEqual([300, 200, 100]);
  });

  it('name-asc: orders alphabetically ascending', () => {
    const products = [
      makeProduct({ product_id: 1, name: 'Zirconia' }),
      makeProduct({ product_id: 2, name: 'Ambar' }),
      makeProduct({ product_id: 3, name: 'Luna' }),
    ];
    const result = sortProducts(products, 'name-asc');
    expect(result.map((p) => p.name)).toEqual(['Ambar', 'Luna', 'Zirconia']);
  });

  it('name-desc: orders alphabetically descending', () => {
    const products = [
      makeProduct({ product_id: 1, name: 'Zirconia' }),
      makeProduct({ product_id: 2, name: 'Ambar' }),
      makeProduct({ product_id: 3, name: 'Luna' }),
    ];
    const result = sortProducts(products, 'name-desc');
    expect(result.map((p) => p.name)).toEqual(['Zirconia', 'Luna', 'Ambar']);
  });

  it('does not mutate the original array', () => {
    const products = [
      makeProduct({ product_id: 1, price: 300 }),
      makeProduct({ product_id: 2, price: 100 }),
    ];
    const original = [...products];
    sortProducts(products, 'price-asc');
    expect(products[0].price).toBe(original[0].price);
    expect(products[1].price).toBe(original[1].price);
  });
});

// ─── formatPrice (CAT-R3) — EXACT output, BOUNDARY LOCKED ────────────────────

describe('formatPrice', () => {
  it('integer price: 15990 → "15.990" (es-CL dot thousands)', () => {
    expect(formatPrice(15990)).toBe('15.990');
  });

  it('decimal price: 15990.7 rounds to 15991 → "15.991"', () => {
    expect(formatPrice(15990.7)).toBe('15.991');
  });

  it('string price: "9990" coerces to number → "9.990"', () => {
    expect(formatPrice('9990')).toBe('9.990');
  });

  it('zero price: 0 → "0"', () => {
    expect(formatPrice(0)).toBe('0');
  });

  it('coalesced-to-zero price: formatPrice(0) → "0" (guards SearchModal null/undefined price via ?? 0)', () => {
    // SearchModal calls formatPrice(product.price ?? 0).
    // When product.price is null/undefined, the ?? 0 coalescion produces 0 before formatPrice sees it.
    // This test locks the expected output of that coalesced value.
    expect(formatPrice(0)).toBe('0');
  });
});

// ─── calcDiscount (CAT-R4) ────────────────────────────────────────────────────

describe('calcDiscount', () => {
  it('valid discount: price=8000, compare=10000 → 20', () => {
    expect(calcDiscount(8000, 10000)).toBe(20);
  });

  it('compare_at_price is null → null', () => {
    expect(calcDiscount(8000, null)).toBeNull();
  });

  it('compare_at_price === price → null (no discount)', () => {
    expect(calcDiscount(10000, 10000)).toBeNull();
  });

  it('compare_at_price < price → null (inverted)', () => {
    expect(calcDiscount(12000, 10000)).toBeNull();
  });

  it('compare_at_price is undefined → null', () => {
    expect(calcDiscount(8000, undefined)).toBeNull();
  });
});

// ─── isInStock (CAT-R5) ───────────────────────────────────────────────────────

describe('isInStock', () => {
  it('positive stock → true', () => {
    expect(isInStock(makeProduct({ stock: 3 }))).toBe(true);
  });

  it('zero stock → false', () => {
    expect(isInStock(makeProduct({ stock: 0 }))).toBe(false);
  });
});
