import 'server-only';
/**
 * Server-side catalog fetchers. Usados por las rutas SEO estáticas
 * (app/[type], app/amuletos/[tag]) desde el servidor Next.js.
 *
 * Backend NestJS es privado (subnet privada AWS). La URL NUNCA debe existir
 * en el bundle cliente — de ahí INTERNAL_API_URL (sin prefijo NEXT_PUBLIC_).
 */
import type { Product } from './types';

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
  const res = await fetch(`${API_URL}/products/catalog${toQuery(filters)}`, {
    next: { revalidate },
  });
  if (!res.ok) {
    return { data: [], total: 0, page: filters.page ?? 1, limit: filters.limit ?? 20 };
  }
  return res.json();
}

export async function fetchFacets(revalidate = 300): Promise<FacetsResponse | null> {
  const res = await fetch(`${API_URL}/products/facets`, { next: { revalidate } });
  if (!res.ok) return null;
  return res.json();
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
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) return null;
  return res.json();
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
