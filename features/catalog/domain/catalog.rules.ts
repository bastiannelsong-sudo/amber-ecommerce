/**
 * Catalog domain pure functions.
 * Framework-free — zero React, Zustand, fetch, browser, or app/ imports.
 * All functions are pure: same inputs → identical outputs, no side effects.
 */

import type { CatalogProduct, CatalogFilter, SortOption } from './catalog.types';

// ─── filterProducts (CAT-R1) ──────────────────────────────────────────────────

/**
 * Returns products matching ALL non-empty filter conditions.
 * Empty or absent filter properties are treated as match-all.
 */
export const filterProducts = (
  products: CatalogProduct[],
  filters: CatalogFilter,
): CatalogProduct[] => {
  return products.filter((p) => {
    if (filters.collections && filters.collections.length > 0) {
      const tags = p.tags ?? [];
      const hasMatch = filters.collections.some((col) => tags.includes(col));
      if (!hasMatch) return false;
    }

    if (filters.material && p.material !== filters.material) return false;
    if (filters.style && p.style !== filters.style) return false;

    if (filters.priceMin !== undefined && p.price < filters.priceMin) return false;
    if (filters.priceMax !== undefined && p.price > filters.priceMax) return false;

    return true;
  });
};

// ─── sortProducts (CAT-R2) ────────────────────────────────────────────────────

/**
 * Returns a new sorted array without mutating the input.
 */
export const sortProducts = (
  products: CatalogProduct[],
  option: SortOption,
): CatalogProduct[] => {
  const copy = [...products];

  switch (option) {
    case 'price-asc':
      return copy.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return copy.sort((a, b) => b.price - a.price);
    case 'name-asc':
      return copy.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    case 'name-desc':
      return copy.sort((a, b) => b.name < a.name ? -1 : b.name > a.name ? 1 : 0);
    case 'newest':
    default:
      return copy;
  }
};

// ─── formatPrice (CAT-R3) — BOUNDARY LOCKED ──────────────────────────────────

/**
 * Formats a price value to es-CL locale string.
 * LOCKED: Math.round(Number(price)).toLocaleString('es-CL') — matches ProductCard exactly.
 */
export const formatPrice = (price: number | string): string =>
  Math.round(Number(price)).toLocaleString('es-CL');

// ─── calcDiscount (CAT-R4) ────────────────────────────────────────────────────

/**
 * Returns the rounded discount percentage, or null when no valid discount exists.
 * Returns null when compare_at_price is null, undefined, or <= price.
 */
export const calcDiscount = (
  price: number,
  compare_at_price: number | null | undefined,
): number | null => {
  if (compare_at_price == null || compare_at_price <= price) return null;
  return Math.round((1 - price / compare_at_price) * 100);
};

// ─── isInStock (CAT-R5) ───────────────────────────────────────────────────────

/**
 * Returns true when the product has positive stock.
 */
export const isInStock = (product: CatalogProduct): boolean => product.stock > 0;
