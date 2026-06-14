'use client';

/**
 * CATUI-ORG-1 — ProductGrid organism.
 * Pure presentational: accepts products, onAddToCart, emptyState, onReachEnd, viewMode.
 * IntersectionObserver lives here per design ADR #4 (hook stays DOM-free).
 * Stagger animation via CSS class + inline animationDelay.
 */

import { useRef, useEffect, useCallback, ReactNode } from 'react';
import ProductCard from '@/features/catalog/ui/molecules/ProductCard';
import type { Product } from '@/app/lib/types';

type ViewMode = 'grid-3' | 'grid-4' | 'list';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product, qty: number) => void;
  emptyState: ReactNode;
  onReachEnd: () => void;
  viewMode: ViewMode;
}

const GRID_CLASS: Record<ViewMode, string> = {
  'grid-3': 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3',
  'grid-4': 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
  list: 'grid-cols-1',
};

export function ProductGrid({
  products,
  onAddToCart,
  emptyState,
  onReachEnd,
  viewMode,
}: ProductGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const animateFromRef = useRef(0);

  const handleReachEnd = useCallback(() => {
    animateFromRef.current = products.length;
    onReachEnd();
  }, [onReachEnd, products.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleReachEnd();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleReachEnd]);

  if (products.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className="flex-1">
      <div className={`grid ${GRID_CLASS[viewMode]} gap-3 gap-y-6 sm:gap-6 sm:gap-y-10 lg:gap-8`}>
        {products.map((product, index) => {
          const isNew = index >= animateFromRef.current;
          const staggerDelay = isNew
            ? Math.min((index - animateFromRef.current) * 50, 600)
            : 0;

          return (
            <div
              key={product.product_id}
              className={isNew ? 'catalog-item-enter' : undefined}
              style={isNew ? ({ animationDelay: `${staggerDelay}ms` } as React.CSSProperties) : undefined}
            >
              <ProductCard product={product} onAddToCart={onAddToCart} />
            </div>
          );
        })}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-px" aria-hidden="true" />
    </div>
  );
}
