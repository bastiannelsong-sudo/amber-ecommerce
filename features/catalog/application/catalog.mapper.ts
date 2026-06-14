import type { SearchSuggestions } from '@/features/catalog/domain/catalog.types';

/**
 * BFF DTO shape for /api/products/suggestions response.
 * Field extraction only — no business logic.
 */
interface BffSuggestionsDto {
  products: Array<{
    product_id?: number | string;
    name: string;
    slug: string;
    image_url: string;
    price: number;
    [key: string]: unknown;
  }>;
  collections: Array<{
    name: string;
    slug: string;
    [key: string]: unknown;
  }>;
}

/**
 * Maps the raw BFF suggestions response to the domain SearchSuggestions shape.
 * Shape transformation only — no business logic, no invented fields.
 * collections.image_url is intentionally excluded (BFF does not return it).
 */
export const mapSuggestions = (raw: BffSuggestionsDto): SearchSuggestions => ({
  products: raw.products.map((p) => ({
    name: p.name,
    slug: p.slug,
    image_url: p.image_url,
    price: p.price,
  })),
  collections: raw.collections.map((c) => ({
    name: c.name,
    slug: c.slug,
  })),
});
