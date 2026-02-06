'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import ProductGridSkeleton from './ProductGridSkeleton';
import { dummyProducts } from '../lib/data/dummy-products';
import type { Product } from '../lib/types';

interface RelatedProductsProps {
  currentProductId: number;
  categoryId?: number;
}

export default function RelatedProducts({ currentProductId, categoryId }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      const related = dummyProducts
        .filter((p) => p.product_id !== currentProductId)
        .slice(0, 4);

      setProducts(related);
      setLoading(false);
    }, 500);
  }, [currentProductId, categoryId]);

  if (loading) {
    return (
      <section className="mt-24">
        <h2
          className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-12 text-center"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          También te Puede Gustar
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-[3/4] bg-pearl-200 mb-4 rounded" />
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
      <h2
        className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-12 text-center"
        style={{ fontFamily: 'var(--font-cormorant)' }}
      >
        También te Puede Gustar
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
