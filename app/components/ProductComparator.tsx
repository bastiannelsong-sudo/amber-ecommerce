'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '../lib/types';

interface ProductComparatorProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRemove: (productId: number) => void;
}

export default function ProductComparator({ isOpen, onClose, products, onRemove }: ProductComparatorProps) {
  if (!isOpen) return null;

  const maxProducts = 3;
  const emptySlots = maxProducts - products.length;

  const features = [
    { key: 'price', label: 'Precio', format: (p: Product) => `$${p.price?.toLocaleString('es-CL')}` },
    { key: 'category', label: 'Categoría', format: (p: Product) => p.category?.name || '-' },
    { key: 'stock', label: 'Stock', format: (p: Product) => `${p.stock} unidades` },
    { key: 'sku', label: 'SKU', format: (p: Product) => p.internal_sku },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="bg-white w-full max-w-6xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-br from-obsidian-900 to-obsidian-800 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-3xl font-light"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  Comparador de Productos
                </h2>
                <p className="text-pearl-300 text-sm mt-1">
                  Compara hasta {maxProducts} productos
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="p-6">
            {products.length === 0 ? (
              <div className="text-center py-24">
                <svg
                  className="w-24 h-24 mx-auto text-platinum-300 mb-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <p className="text-platinum-600 text-lg">
                  No has agregado productos para comparar
                </p>
                <p className="text-platinum-500 text-sm mt-2">
                  Busca productos y haz clic en "Comparar"
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left p-4 bg-pearl-100 sticky left-0 z-10">
                        <span className="text-sm uppercase tracking-wider text-platinum-600">
                          Característica
                        </span>
                      </th>
                      {products.map((product) => (
                        <th key={product.product_id} className="p-4 bg-pearl-100 min-w-[250px]">
                          <div className="relative">
                            <button
                              onClick={() => onRemove(product.product_id)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-xs"
                            >
                              ×
                            </button>
                            <div className="aspect-square bg-white rounded overflow-hidden mb-3 relative">
                              <Image
                                src={product.image_url || '/logo_oscuro.jpeg'}
                                alt={product.name}
                                fill
                                sizes="250px"
                                className="object-cover"
                              />
                            </div>
                            <p className="font-medium text-obsidian-900 text-sm line-clamp-2">
                              {product.name}
                            </p>
                          </div>
                        </th>
                      ))}
                      {Array.from({ length: emptySlots }).map((_, i) => (
                        <th key={`empty-${i}`} className="p-4 bg-pearl-50 min-w-[250px]">
                          <div className="aspect-square border-2 border-dashed border-platinum-300 rounded flex items-center justify-center">
                            <div className="text-center">
                              <svg
                                className="w-12 h-12 mx-auto text-platinum-300 mb-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                              <p className="text-xs text-platinum-500">Agregar producto</p>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feature, index) => (
                      <tr key={feature.key} className={index % 2 === 0 ? 'bg-white' : 'bg-pearl-50'}>
                        <td className="p-4 font-medium text-obsidian-900 sticky left-0 z-10 bg-inherit">
                          {feature.label}
                        </td>
                        {products.map((product) => (
                          <td key={product.product_id} className="p-4 text-center text-platinum-700">
                            {feature.format(product)}
                          </td>
                        ))}
                        {Array.from({ length: emptySlots }).map((_, i) => (
                          <td key={`empty-${i}`} className="p-4 text-center text-platinum-400">
                            -
                          </td>
                        ))}
                      </tr>
                    ))}

                    {/* Action Row */}
                    <tr>
                      <td className="p-4 sticky left-0 z-10 bg-white" />
                      {products.map((product) => (
                        <td key={product.product_id} className="p-4">
                          <a
                            href={`/producto/${product.product_id}`}
                            className="block w-full py-3 bg-obsidian-900 text-white text-sm uppercase tracking-wider font-medium hover:bg-amber-gold-500 transition-colors text-center"
                          >
                            Ver Detalle
                          </a>
                        </td>
                      ))}
                      {Array.from({ length: emptySlots }).map((_, i) => (
                        <td key={`empty-${i}`} className="p-4" />
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
