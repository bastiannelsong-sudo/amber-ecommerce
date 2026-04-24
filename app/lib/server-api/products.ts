import 'server-only';
import { cache } from 'react';
import type { Product } from '../types';

const BASE = process.env.INTERNAL_API_URL ?? 'http://localhost:3000';

/**
 * Fetchers server-only para catálogo de productos.
 * Envueltos en React.cache() para deduplicar dentro de un mismo request RSC.
 * ISR por defecto (revalidate = 120s); sobreescribir por caller si hace falta.
 */

interface FetchOptions {
  revalidate?: number;
}

export const getBestsellerIds = cache(
  async (opts: FetchOptions = {}): Promise<number[]> => {
    const res = await fetch(`${BASE}/ecommerce/bestsellers`, {
      next: { revalidate: opts.revalidate ?? 300 },
    });
    if (!res.ok) return [];
    return res.json();
  },
);

export const getFeaturedProducts = cache(
  async (limit = 8, opts: FetchOptions = {}): Promise<Product[]> => {
    // Usa el catálogo ecommerce con sort=featured. Fallback silencioso a lista vacía.
    const res = await fetch(
      `${BASE}/products/catalog?limit=${limit}&sort=featured`,
      { next: { revalidate: opts.revalidate ?? 120 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data ?? []) as Product[];
  },
);

export const getRelatedProducts = cache(
  async (
    productId: number,
    limit = 4,
    opts: FetchOptions = {},
  ): Promise<Product[]> => {
    const res = await fetch(
      `${BASE}/products/catalog?limit=${limit}&sort=featured`,
      { next: { revalidate: opts.revalidate ?? 120 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    const products = (data?.data ?? []) as Product[];
    return products.filter((p) => p.product_id !== productId).slice(0, limit);
  },
);
