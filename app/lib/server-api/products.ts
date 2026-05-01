import 'server-only';
import { cache } from 'react';
import type { Product } from '../types';
import { internalFetch } from './internal-fetch';

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
    const res = await internalFetch(`/ecommerce/bestsellers`, {
      next: { revalidate: opts.revalidate ?? 300 },
    });
    if (!res.ok) return [];
    return res.json();
  },
);

export const getFeaturedProducts = cache(
  async (limit = 8, opts: FetchOptions = {}): Promise<Product[]> => {
    // Usa el catálogo ecommerce con sort=featured. Fallback silencioso a lista vacía.
    const res = await internalFetch(
      `/products/catalog?limit=${limit}&sort=featured`,
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
    opts: FetchOptions & {
      limit?: number;
      productType?: string;
      material?: string;
    } = {},
  ): Promise<Product[]> => {
    const limit = opts.limit ?? 4;
    // Heurística simple: prioriza mismo tipo + material. Si el backend no
    // devuelve suficientes, hace fallback a "featured" general. Pedimos limit+1
    // para descontar el producto actual sin quedarnos cortos.
    const params = new URLSearchParams({
      limit: String(limit + 1),
      sort: 'featured',
    });
    if (opts.productType) params.set('product_type', opts.productType);
    if (opts.material) params.set('material', opts.material);

    const fetchWith = async (qs: string): Promise<Product[]> => {
      const res = await internalFetch(`/products/catalog?${qs}`, {
        next: { revalidate: opts.revalidate ?? 120 },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return ((data?.data ?? []) as Product[]).filter(
        (p) => p.product_id !== productId,
      );
    };

    let related = await fetchWith(params.toString());
    if (related.length < limit) {
      // Fallback: relajar filtros y pegar resultados sin duplicar.
      const fallback = await fetchWith(`limit=${limit + 1}&sort=featured`);
      const seen = new Set(related.map((p) => p.product_id));
      for (const p of fallback) {
        if (related.length >= limit) break;
        if (!seen.has(p.product_id)) related.push(p);
      }
    }
    return related.slice(0, limit);
  },
);
