'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import type { Product } from '../lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface RelatedProductsProps {
  currentProductId: number;
  categoryId?: number;
  material?: string;
}

export default function RelatedProducts({
  currentProductId,
  categoryId,
  material,
}: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        let url = `${API_URL}/products/ecommerce?limit=8`;
        if (material) url += `&material=${encodeURIComponent(material)}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Error fetching');

        const data = await res.json();
        const allProducts: Product[] = data.data || data || [];

        // Filtrar el producto actual y tomar 4
        const related = allProducts
          .filter((p) => p.product_id !== currentProductId)
          .slice(0, 4);

        setProducts(related);
      } catch (error) {
        console.error('Error loading related products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [currentProductId, categoryId, material]);

  if (loading) {
    return (
      <section className="mt-24">
        <div className="text-center mb-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-amber-gold-500 font-semibold mb-3">Completa tu Look</p>
          <h2
            className="text-3xl lg:text-4xl font-light text-obsidian-900"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            También te Puede Gustar
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-square bg-pearl-200 mb-4 rounded" />
              <div className="space-y-2">
                <div className="h-3 w-20 bg-pearl-200 mx-auto rounded" />
                <div className="h-4 w-3/4 bg-pearl-200 mx-auto rounded" />
                <div className="h-4 w-16 bg-pearl-200 mx-auto rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mt-24">
      <div className="text-center mb-12">
        <p className="text-[10px] uppercase tracking-[0.3em] text-amber-gold-500 font-semibold mb-3">Completa tu Look</p>
        <h2
          className="text-3xl lg:text-4xl font-light text-obsidian-900"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          También te Puede Gustar
        </h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
        {products.map((product) => (
          <ProductCard
            key={product.product_id}
            product={product}
            hoverImage={product.images?.[1]}
          />
        ))}
      </div>
    </section>
  );
}
