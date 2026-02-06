'use client';

import { useCartStore } from '../lib/stores/cart.store';
import FreeShippingProgress from './marketing/FreeShippingProgress';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getTotal = useCartStore((state) => state.getTotal());

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-pearl-200 p-6">
              <h2
                className="text-2xl font-light text-obsidian-900"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Carrito
              </h2>
              <button
                onClick={closeCart}
                className="text-obsidian-700 hover:text-amber-gold-500 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <svg className="w-16 h-16 text-platinum-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p className="text-platinum-600 mb-4">Tu carrito está vacío</p>
                  <button
                    onClick={closeCart}
                    className="text-amber-gold-500 hover:text-amber-gold-600 transition-colors uppercase tracking-wide text-sm font-medium"
                  >
                    Continuar Comprando
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.product.product_id} className="flex gap-4">
                      {/* Image */}
                      <div className="w-24 h-24 bg-pearl-100 flex-shrink-0 rounded overflow-hidden">
                        <img
                          src={item.product.image_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop'}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 flex flex-col">
                        <h3 className="text-sm font-medium text-obsidian-900 mb-1">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-platinum-600 mb-2">
                          ${item.product.price?.toLocaleString('es-CL')}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-auto">
                          <button
                            onClick={() => updateQuantity(item.product.product_id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center border border-pearl-300 hover:border-amber-gold-500 transition-colors"
                          >
                            -
                          </button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.product_id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center border border-pearl-300 hover:border-amber-gold-500 transition-colors"
                          >
                            +
                          </button>

                          <button
                            onClick={() => removeItem(item.product.product_id)}
                            className="ml-auto text-platinum-600 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-pearl-200 p-6 space-y-4">
                {/* Free Shipping Progress */}
                <FreeShippingProgress cartTotal={getTotal} />

                <div className="flex items-center justify-between text-lg">
                  <span className="font-medium text-obsidian-900">Total:</span>
                  <span className="font-medium text-obsidian-900">
                    ${getTotal.toLocaleString('es-CL')}
                  </span>
                </div>

                <a
                  href="/carrito"
                  onClick={closeCart}
                  className="block w-full py-4 bg-obsidian-900 text-white text-center text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors"
                >
                  Ver Carrito
                </a>

                <a
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full py-4 border-2 border-obsidian-900 text-obsidian-900 text-center text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors"
                >
                  Finalizar Compra
                </a>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
