'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { productsService } from '../lib/services/products.service';
import type { Product } from '../lib/types';
import toast from 'react-hot-toast';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const allProducts = await productsService.getAll();
      const productsWithImages = allProducts.filter(
        (product) => product.image_url && product.image_url.trim() !== ''
      );
      setProducts(productsWithImages.slice(0, 8));
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="aspect-[3/4] bg-pearl-200 mb-4"></div>
            <div className="space-y-2 text-center">
              <div className="h-3 bg-pearl-200 rounded w-1/3 mx-auto"></div>
              <div className="h-4 bg-pearl-200 rounded w-2/3 mx-auto"></div>
              <div className="h-4 bg-pearl-200 rounded w-1/4 mx-auto"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-platinum-600">Los productos se mostraran proximamente</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
      {products.map((product, index) => (
        <div
          key={product.product_id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <ProductCard product={product} isNew={index < 2} />
        </div>
      ))}
    </div>
  );
}
