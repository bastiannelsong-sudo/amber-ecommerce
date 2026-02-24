'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCartStore } from '../lib/stores/cart.store';
import FreeShippingProgress from './marketing/FreeShippingProgress';
import CouponInput from './marketing/CouponInput';
import { motion, AnimatePresence } from 'motion/react';
import { buildCartWhatsAppUrl } from '../lib/whatsapp';

export default function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getTotal = useCartStore((state) => state.getTotal());
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const finalTotal = Math.max(0, getTotal - discount);

  // Lock body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

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
            className="fixed inset-0 bg-black/50 z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl z-[60] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-pearl-200 p-4 sm:p-6">
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
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                        <Image
                          src={item.product.image_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop'}
                          alt={item.product.name}
                          width={96}
                          height={96}
                          className="object-cover"
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
                            className="w-8 h-8 flex items-center justify-center border border-pearl-300 hover:border-amber-gold-500 transition-colors text-sm"
                          >
                            -
                          </button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.product_id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center border border-pearl-300 hover:border-amber-gold-500 transition-colors text-sm"
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
              <div className="border-t border-pearl-200 p-4 sm:p-6 space-y-3 sm:space-y-4">
                {/* Free Shipping Progress */}
                <FreeShippingProgress cartTotal={getTotal} />

                {/* Coupon Input */}
                <CouponInput
                  cartTotal={getTotal}
                  onApply={(amt, code) => { setDiscount(amt); setAppliedCoupon(code); }}
                  onRemove={() => { setDiscount(0); setAppliedCoupon(''); }}
                  appliedCode={appliedCoupon}
                />

                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm text-green-700">
                    <span>Descuento:</span>
                    <span>-${discount.toLocaleString('es-CL')}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-lg">
                  <span className="font-medium text-obsidian-900">Total:</span>
                  <span className="font-medium text-obsidian-900">
                    ${finalTotal.toLocaleString('es-CL')}
                  </span>
                </div>

                <a
                  href={buildCartWhatsAppUrl(
                    items.map((i) => ({
                      name: i.product.display_name || i.product.name,
                      quantity: i.quantity,
                      price: i.product.price || 0,
                    })),
                    finalTotal,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeCart}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-[#25D366] text-white text-center text-sm uppercase tracking-widest font-medium hover:bg-[#1DA851] transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Comprar por WhatsApp
                </a>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
