/**
 * Lean domain types for the catalog feature.
 * Framework-free — zero React, Zustand, fetch, browser, or app/ imports.
 * Only the fields that catalog consumers actually need are included.
 */

export interface CatalogProduct {
  product_id: number | string;
  name: string;
  price: number;
  compare_at_price?: number | null;
  image_url: string;
  slug: string;
  stock: number;
  material?: string;
  style?: string;
  tags?: string[];
  category: { name: string };
}

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

export interface CatalogFilter {
  collections?: string[];
  /** @deprecated Use `materials` array for multi-select. Kept for backward compatibility. */
  material?: string;
  /** @deprecated Use `styles` array for multi-select. Kept for backward compatibility. */
  style?: string;
  /** Multi-select materials filter. Empty or absent = match-all. */
  materials?: string[];
  /** Multi-select styles filter. Empty or absent = match-all. */
  styles?: string[];
  priceMin?: number;
  priceMax?: number;
}

/**
 * UI-facing multi-select filter state.
 * Arrays are empty when no filter is active (match-all).
 * priceMin === 0 and priceMax === Infinity when no price filter is active.
 */
export interface ActiveFilters {
  collections: string[];
  materials: string[];
  styles: string[];
  priceMin: number;
  priceMax: number;
}

/** Zero-value for ActiveFilters: all arrays empty, prices at 0/Infinity. */
export const emptyFilters: ActiveFilters = {
  collections: [],
  materials: [],
  styles: [],
  priceMin: 0,
  priceMax: Infinity,
};

/** BFF response shape for /api/products/suggestions. */
export interface SearchSuggestions {
  products: { name: string; slug: string; image_url: string; price: number }[];
  collections: { name: string; slug: string }[];
}
