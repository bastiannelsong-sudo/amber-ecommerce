'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import ProductGridSkeleton from './ProductGridSkeleton';
import type { Product } from '../lib/types';

interface RelatedProductsProps {
  currentProductId: number;
  categoryId?: number;
}

export default function RelatedProducts({ currentProductId, categoryId }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch related products
    setTimeout(() => {
      // Mock related products - filter out current product
      const allProducts: Product[] = [
        {
          product_id: 1,
          internal_sku: 'AMB-COL-001',
          name: 'Collar Solitario Diamante',
          stock: 5,
          stock_bodega: 2,
          cost: 800000,
          price: 1250000,
          image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=800&fit=crop',
          images: [
            'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=800&fit=crop',
          ],
          category: { category_id: 1, name: 'Collares' },
        },
        {
          product_id: 2,
          internal_sku: 'AMB-ANI-001',
          name: 'Anillo Eternidad Oro Rosa',
          stock: 8,
          stock_bodega: 3,
          cost: 550000,
          price: 890000,
          image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=800&fit=crop',
          images: [
            'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&h=800&fit=crop',
          ],
          category: { category_id: 2, name: 'Anillos' },
        },
        {
          product_id: 3,
          internal_sku: 'AMB-ARE-001',
          name: 'Aretes Perla Cultivada',
          stock: 12,
          stock_bodega: 5,
          cost: 420000,
          price: 680000,
          image_url: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600&h=800&fit=crop',
          images: [
            'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&h=800&fit=crop',
          ],
          category: { category_id: 3, name: 'Aretes' },
        },
        {
          product_id: 7,
          internal_sku: 'AMB-ARE-002',
          name: 'Aretes Gota Zafiro',
          stock: 6,
          stock_bodega: 2,
          cost: 980000,
          price: 1580000,
          image_url: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&h=800&fit=crop',
          category: { category_id: 3, name: 'Aretes' },
        },
      ];

      const related = allProducts
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
