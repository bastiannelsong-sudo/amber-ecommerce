'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '../lib/types';

interface StickyAddToCartProps {
  product: Product;
  onAddToCart: () => void;
  targetRef?: React.RefObject<HTMLElement | null>;
}

export default function StickyAddToCart({ product, onAddToCart, targetRef }: StickyAddToCartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      if (!targetRef?.current) return;

      const rect = targetRef.current.getBoundingClientRect();
      const isOutOfView = rect.bottom < 0;

      setIsVisible(isOutOfView);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, [targetRef]);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-pearl-200 shadow-2xl"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
              {/* Product Info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-16 h-16 bg-pearl-100 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-obsidian-900 truncate text-sm md:text-base">
                    {product.name}
                  </p>
                  <p className="text-xl font-light text-obsidian-900" style={{ fontFamily: 'var(--font-cormorant)' }}>
                    ${product.price?.toLocaleString('es-CL')}
                  </p>
                </div>
              </div>

              {/* Quantity & Add to Cart */}
              <div className="flex items-center gap-3">
                {/* Quantity Selector */}
                <div className="hidden sm:flex items-center border border-pearl-300">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-pearl-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock || 1, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-pearl-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={!product.stock || product.stock === 0}
                  className="px-6 py-3 bg-obsidian-900 text-white text-sm uppercase tracking-wider font-medium hover:bg-amber-gold-500 transition-colors disabled:bg-platinum-300 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <span className="hidden sm:inline">Agregar al Carrito</span>
                  <span className="sm:hidden">Agregar</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
