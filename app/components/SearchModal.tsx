'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { Product } from '../lib/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock products for search - in production, fetch from API
const mockProducts: Product[] = [
  {
    product_id: 1,
    internal_sku: 'AMB-COL-001',
    name: 'Collar Solitario Diamante',
    stock: 5,
    stock_bodega: 2,
    cost: 800000,
    price: 1250000,
    image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop',
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
    image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&h=200&fit=crop',
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
    image_url: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=200&h=200&fit=crop',
    category: { category_id: 3, name: 'Aretes' },
  },
];

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    if (query.length > 2) {
      // Search products
      const filtered = mockProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.internal_sku.toLowerCase().includes(query.toLowerCase()) ||
          product.category?.name.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleProductClick = (productId: number) => {
    router.push(`/producto/${productId}`);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white w-full max-w-2xl mx-4 rounded-lg shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="p-6 border-b border-pearl-200">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-platinum-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar productos..."
                autoFocus
                className="w-full pl-12 pr-12 py-4 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none text-lg rounded-lg transition-colors"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-platinum-600 hover:text-obsidian-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {query.length === 0 && (
              <div className="p-12 text-center">
                <svg
                  className="w-16 h-16 text-platinum-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-platinum-600 text-sm">
                  Comienza a escribir para buscar productos
                </p>
              </div>
            )}

            {query.length > 0 && query.length < 3 && (
              <div className="p-12 text-center">
                <p className="text-platinum-600 text-sm">
                  Escribe al menos 3 caracteres para buscar
                </p>
              </div>
            )}

            {query.length >= 3 && results.length === 0 && (
              <div className="p-12 text-center">
                <svg
                  className="w-16 h-16 text-platinum-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-platinum-600 text-sm">
                  No se encontraron productos para "{query}"
                </p>
              </div>
            )}

            {results.length > 0 && (
              <div className="py-2">
                {results.map((product) => (
                  <button
                    key={product.product_id}
                    onClick={() => handleProductClick(product.product_id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-pearl-50 transition-colors text-left"
                  >
                    <div className="w-16 h-16 bg-pearl-100 flex-shrink-0 rounded overflow-hidden">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-obsidian-900 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-platinum-600">{product.category?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-obsidian-900">
                        ${product.price?.toLocaleString('es-CL')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-pearl-200 bg-pearl-50">
            <div className="flex items-center justify-between text-xs text-platinum-600">
              <div className="flex gap-4">
                <span>↑↓ navegar</span>
                <span>↵ seleccionar</span>
                <span>esc cerrar</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
