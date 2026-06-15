import 'server-only';
/**
 * Server-side catalog fetchers. Usados por las rutas SEO estáticas
 * (app/[type], app/amuletos/[tag]) desde el servidor Next.js.
 *
 * Backend NestJS es privado (subnet privada AWS). La URL NUNCA debe existir
 * en el bundle cliente — de ahí INTERNAL_API_URL (sin prefijo NEXT_PUBLIC_).
 *
 * ALL ad-hoc INTERNAL_API_URL fetches from page components must go through
 * this module. Page components must never reference INTERNAL_API_URL directly.
 */
import type { Collection, Product, SearchResponse } from './types';

const API_URL = process.env.INTERNAL_API_URL || 'http://localhost:3000';

export interface CatalogFilters {
  product_type?: string;
  audience?: string;
  material?: string;
  collection?: string;
  tags?: string[];
  min_price?: number;
  max_price?: number;
  sort?: 'featured' | 'price_asc' | 'price_desc' | 'newest' | 'name_asc';
  page?: number;
  limit?: number;
}

export interface CatalogResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface FacetBucket {
  value: string;
  count: number;
}

export interface FacetsResponse {
  product_type: FacetBucket[];
  audience: FacetBucket[];
  material: FacetBucket[];
  tags: FacetBucket[];
  price_range: { min: number; max: number };
}

function toQuery(filters: CatalogFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value == null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      params.set(key, value.join(','));
    } else {
      params.set(key, String(value));
    }
  }
  const q = params.toString();
  return q ? `?${q}` : '';
}

export async function fetchCatalog(
  filters: CatalogFilters = {},
  revalidate = 120,
): Promise<CatalogResponse> {
  const url = `${API_URL}/products/catalog${toQuery(filters)}`;
  const sentinel: CatalogResponse = {
    data: [],
    total: 0,
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
  };
  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return sentinel;
    return await res.json();
  } catch (err) {
    console.warn(`fetchCatalog: failed to fetch or parse response from ${url}`, err);
    return sentinel;
  }
}

export async function fetchFacets(revalidate = 300): Promise<FacetsResponse | null> {
  const url = `${API_URL}/products/facets`;
  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn(`fetchFacets: failed to fetch or parse response from ${url}`, err);
    return null;
  }
}

export async function fetchProductBySlug(
  slug: string,
  revalidate = 120,
): Promise<Product | null> {
  // Si el slug es numérico, asumimos que es product_id.
  const isNumeric = /^\d+$/.test(slug);
  const url = isNumeric
    ? `${API_URL}/products/${slug}`
    : `${API_URL}/products/by-slug/${encodeURIComponent(slug)}`;
  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn(`fetchProductBySlug: failed to fetch or parse response from ${url}`, err);
    return null;
  }
}

export interface ReviewSummary {
  average_rating: number;
  total_reviews: number;
}

export async function fetchReviewSummary(
  productId: number,
  revalidate = 300,
): Promise<ReviewSummary | null> {
  try {
    const res = await fetch(`${API_URL}/ecommerce/reviews/${productId}`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const avg = Number(data?.average_rating);
    const total = Number(data?.total_reviews);
    if (!isFinite(avg) || !isFinite(total) || total <= 0) return null;
    return { average_rating: avg, total_reviews: total };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Search & Collections — centralized helpers (replaces ad-hoc page fetches)
// ---------------------------------------------------------------------------

/** Maximum allowed length for a search query string. */
const SEARCH_Q_MAX_LENGTH = 200;

/**
 * Sanitize a raw search query string coming from user input (URL params).
 * - Trims leading/trailing whitespace
 * - Strips ASCII control characters (0x00–0x1F, 0x7F)
 * - Truncates to SEARCH_Q_MAX_LENGTH characters
 */
export function sanitizeSearchQuery(raw: string): string {
  // eslint-disable-next-line no-control-regex
  const stripped = raw.replace(/[\x00-\x1F\x7F]/g, '');
  return stripped.trim().slice(0, SEARCH_Q_MAX_LENGTH);
}

export interface SearchFilters {
  page?: number;
  limit?: number;
  sort?: string;
  material?: string;
  style?: string;
  collection?: string;
}

/**
 * Search products by query string.
 * The `q` parameter is sanitized before being forwarded to the backend.
 * Returns an empty SearchResponse on error rather than throwing.
 */
export async function searchProducts(
  rawQ: string,
  filters: SearchFilters = {},
  revalidate = 30,
): Promise<SearchResponse> {
  const q = sanitizeSearchQuery(rawQ);

  const urlParams = new URLSearchParams();
  urlParams.set('q', q);
  if (filters.page != null) urlParams.set('page', String(filters.page));
  if (filters.limit != null) urlParams.set('limit', String(filters.limit));
  if (filters.sort) urlParams.set('sort', filters.sort);
  if (filters.material) urlParams.set('material', filters.material);
  if (filters.style) urlParams.set('style', filters.style);
  if (filters.collection) urlParams.set('collection', filters.collection);

  try {
    const res = await fetch(
      `${API_URL}/products/ecommerce/search?${urlParams.toString()}`,
      { next: { revalidate } },
    );
    if (!res.ok) throw new Error(`Search API error: ${res.status}`);
    const json = await res.json();

    // Normalize backend category shape to the canonical frontend shape.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    json.data = (json.data || []).map((raw: any) => ({
      ...raw,
      category: raw.category
        ? {
            category_id: raw.category.category_id ?? raw.category.platform_id,
            name: raw.category.name ?? raw.category.platform_name,
            description: raw.category.description,
          }
        : undefined,
    }));

    return json as SearchResponse;
  } catch {
    return { data: [], total: 0, page: filters.page ?? 1, limit: filters.limit ?? 24, query: q };
  }
}

/**
 * Fetch the full collection tree (universes + children).
 * Returns an empty array on error.
 */
export async function fetchCollectionsTree(revalidate = 60): Promise<Collection[]> {
  try {
    const res = await fetch(`${API_URL}/collections/tree`, { next: { revalidate } });
    if (!res.ok) throw new Error(`Collections tree API error: ${res.status}`);
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Fetch a single collection by its slug.
 * Returns null on error or when the slug is not found.
 */
export async function fetchCollectionBySlug(
  slug: string,
  revalidate = 60,
): Promise<Collection | null> {
  try {
    const res = await fetch(`${API_URL}/collections/${encodeURIComponent(slug)}`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface CollectionProductsResult {
  data: Product[];
  total: number;
}

/**
 * Fetch products belonging to a collection slug.
 * Returns empty data on error.
 */
export async function fetchCollectionProducts(
  slug: string,
  options: { limit?: number; sort?: string } = {},
  revalidate = 60,
): Promise<CollectionProductsResult> {
  const params = new URLSearchParams();
  if (options.limit != null) params.set('limit', String(options.limit));
  if (options.sort) params.set('sort', options.sort);
  const qs = params.toString() ? `?${params.toString()}` : '';

  try {
    const res = await fetch(
      `${API_URL}/collections/${encodeURIComponent(slug)}/products${qs}`,
      { next: { revalidate } },
    );
    if (!res.ok) return { data: [], total: 0 };
    return await res.json();
  } catch {
    return { data: [], total: 0 };
  }
}
