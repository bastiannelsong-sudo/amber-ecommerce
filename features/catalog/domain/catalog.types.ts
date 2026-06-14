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
  material?: string;
  style?: string;
  priceMin?: number;
  priceMax?: number;
}

/** BFF response shape for /api/products/suggestions. */
export interface SearchSuggestions {
  products: { name: string; slug: string; image_url: string; price: number }[];
  collections: { name: string; slug: string }[];
}
