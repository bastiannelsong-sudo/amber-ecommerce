'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../lib/stores/cart.store';

const LAST_VISIT_KEY = 'amber-last-visit';
const MODAL_SHOWN_KEY = 'amber-welcome-back-shown';

export default function AbandonedCartModal() {
  const [isOpen, setIsOpen] = useState(false);
  const items = useCartStore((state) => state.items);
  const openCart = useCartStore((state) => state.openCart);

  useEffect(() => {
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    const modalShownToday = localStorage.getItem(MODAL_SHOWN_KEY);
    const now = Date.now();
    const today = new Date().toDateString();

    // Show modal if:
    // 1. User has items in cart
    // 2. Last visit was more than 1 hour ago
    // 3. Modal hasn't been shown today
    if (
      items.length > 0 &&
      lastVisit &&
      now - parseInt(lastVisit) > 3600000 &&
      modalShownToday !== today
    ) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem(MODAL_SHOWN_KEY, today);
      }, 1500);

      return () => clearTimeout(timer);
    }

    // Update last visit timestamp
    localStorage.setItem(LAST_VISIT_KEY, now.toString());
  }, [items.length]);

  const handleViewCart = () => {
    setIsOpen(false);
    openCart();
  };

  const handleDismiss = () => {
    setIsOpen(false);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.product.price || 0) * item.quantity,
    0
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-obsidian-950/60 backdrop-blur-sm z-[60]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            <div className="bg-white w-full max-w-md shadow-luxury-lg overflow-hidden">
              {/* Header with gold accent */}
              <div className="relative bg-obsidian-900 px-8 pt-10 pb-8 text-center">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-gold-400 via-amber-gold-500 to-amber-gold-400" />

                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 text-pearl-400 hover:text-white transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Diamond icon */}
                <div className="w-16 h-16 mx-auto mb-5 border border-amber-gold-500/30 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-amber-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </div>

                <h2
                  className="text-2xl text-white font-light mb-2"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  Tus joyas te esperan
                </h2>
                <p className="text-sm text-pearl-400">
                  Dejaste {totalItems} {totalItems === 1 ? 'pieza' : 'piezas'} en tu carrito
                </p>
              </div>

              {/* Cart preview */}
              <div className="px-8 py-6">
                <div className="space-y-4 mb-6">
                  {items.slice(0, 3).map((item) => (
                    <div key={item.product.product_id} className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-pearl-100 flex-shrink-0 overflow-hidden relative">
                        <Image
                          src={item.product.image_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop'}
                          alt={item.product.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-obsidian-900 truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-platinum-600">
                          Cant: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-obsidian-900 flex-shrink-0">
                        ${((item.product.price || 0) * item.quantity).toLocaleString('es-CL')}
                      </p>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <p className="text-xs text-platinum-500 text-center">
                      y {items.length - 3} producto{items.length - 3 > 1 ? 's' : ''} mas...
                    </p>
                  )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between py-4 border-t border-pearl-200">
                  <span className="text-sm text-platinum-600">Total en tu carrito</span>
                  <span className="text-lg font-medium text-obsidian-900">
                    ${totalPrice.toLocaleString('es-CL')}
                  </span>
                </div>

                {/* CTA */}
                <button
                  onClick={handleViewCart}
                  className="w-full py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors cursor-pointer"
                >
                  Ver mi carrito
                </button>

                <button
                  onClick={handleDismiss}
                  className="w-full py-3 text-sm text-platinum-600 hover:text-obsidian-900 transition-colors mt-2 cursor-pointer"
                >
                  Seguir navegando
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
