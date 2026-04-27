'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCartStore } from '../lib/stores/cart.store';
import FreeShippingProgress from './marketing/FreeShippingProgress';
import CouponInput from './marketing/CouponInput';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

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

          {/* Drawer - en mobile 92% para dejar franja visible del fondo
              (refuerza visualmente "modal cerrable" vs "nueva pagina") */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[92%] max-w-md bg-white shadow-2xl z-[60] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-pearl-200 p-4 sm:p-6">
              <h2
                className="text-2xl font-light text-obsidian-900"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Carrito
              </h2>
              {/* Touch target 44x44 minimo (a11y + mobile usability) */}
              <button
                onClick={closeCart}
                aria-label="Cerrar carrito"
                className="flex items-center justify-center w-11 h-11 -mr-2 text-obsidian-700 hover:text-amber-gold-500 hover:bg-pearl-100 rounded-full transition-colors cursor-pointer"
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
                      <div className="w-24 h-24 bg-pearl-100 flex-shrink-0 rounded overflow-hidden flex items-center justify-center p-1">
                        <Image
                          src={item.product.image_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop'}
                          alt={item.product.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 flex flex-col">
                        <h3 className="text-sm font-medium text-obsidian-900 mb-1">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-platinum-600 mb-2">
                          ${Math.round(Number(item.product.price) || 0).toLocaleString('es-CL')}
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

                {/* Doble CTA: primary checkout + secondary 'seguir comprando'.
                    Marketing psychology: usuario percibe control (no UNICA salida
                    es comprar). Conversion ~+8-15pp vs single CTA. */}
                <div className="flex flex-col gap-2">
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-obsidian-900 text-white text-center text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                    Ir al Checkout
                  </Link>
                  <button
                    onClick={closeCart}
                    className="w-full py-3 text-obsidian-700 text-center text-xs uppercase tracking-widest font-medium border border-pearl-300 hover:border-obsidian-900 hover:bg-pearl-50 transition-colors cursor-pointer"
                  >
                    Seguir comprando
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
