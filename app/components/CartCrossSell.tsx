'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '../lib/types';
import { useCartStore } from '../lib/stores/cart.store';

/**
 * Cross-sell horizontal scroll en el drawer del carrito.
 * Marketing: aumentar AOV mostrando bestsellers que el cliente NO tiene
 * en el carrito - "Combina bien con...".
 *
 * Estrategia:
 * - Trae /api/bestsellers (max 4).
 * - Filtra productos que ya estan en el carrito.
 * - Muestra cards horizontales con add-to-cart inline.
 * - Si la API falla, NO se renderiza (degradacion silenciosa).
 */
export default function CartCrossSell() {
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    fetch('/api/bestsellers?limit=4')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        // El endpoint puede devolver { products } o array directo.
        const list: Product[] = Array.isArray(data)
          ? data
          : data?.products ?? [];
        setProducts(list);
      })
      .catch(() => setProducts([]));
  }, []);

  if (!products || products.length === 0) return null;

  // Filtrar productos que ya estan en el carrito (no sugerir lo mismo).
  const inCartIds = new Set(items.map((ci) => ci.product.product_id));
  const suggestions = products.filter((p) => !inCartIds.has(p.product_id)).slice(0, 4);

  if (suggestions.length === 0) return null;

  return (
    <div className="border-t border-pearl-200 px-4 sm:px-6 py-5 bg-pearl-50/40">
      <h3 className="text-xs uppercase tracking-wider text-platinum-600 font-medium mb-3">
        Combina bien con
      </h3>
      <div className="flex gap-3 overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6 pb-2 snap-x">
        {suggestions.map((p) => (
          <div
            key={p.product_id}
            className="flex-shrink-0 w-32 snap-start"
          >
            <Link
              href={`/producto/${p.slug || p.product_id}`}
              className="block group cursor-pointer"
            >
              <div className="aspect-square bg-white rounded overflow-hidden border border-pearl-200 mb-2 group-hover:border-amber-gold-300 transition-colors">
                <Image
                  src={p.image_url}
                  alt={p.name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-obsidian-900 font-medium line-clamp-2 leading-tight mb-1">
                {p.name}
              </p>
              <p className="text-xs text-amber-gold-600 font-semibold">
                ${Math.round(Number(p.price) || 0).toLocaleString('es-CL')}
              </p>
            </Link>
            <button
              type="button"
              onClick={() => addItem(p, 1)}
              className="mt-2 w-full py-1.5 text-[10px] uppercase tracking-wider text-obsidian-700 border border-pearl-300 hover:border-obsidian-900 hover:bg-white transition-colors cursor-pointer"
            >
              + Agregar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
