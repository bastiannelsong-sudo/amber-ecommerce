/**
 * CARTUI-CONT-1 — Cart drawer container.
 * Consumes useCart + useCartSummary + useCartDrawer exclusively.
 * Reads coupon state directly from store (simple case, not hook delegation anti-pattern).
 * Delegates all presentation to CartDrawerPanel. ADR-6.
 */
'use client';

import { useEffect } from 'react';
import { useCart } from '@/features/cart/application/use-cart';
import { useCartSummary } from '@/features/cart/application/use-cart-summary';
import { useCartDrawer } from '@/features/cart/application/use-cart-drawer';
import { useCartStore } from '@/features/cart/application/cart.store';
import { CartDrawerPanel } from '../organisms/CartDrawerPanel';
import FreeShippingProgress from '@/app/components/marketing/FreeShippingProgress';
import CouponInput from '@/app/components/marketing/CouponInput';
import CartCrossSell from '@/app/components/CartCrossSell';

export function CartDrawerContainer() {
  const { items, removeItem, updateQuantity } = useCart();
  const { subtotal, shipping, discountAmount, finalTotal } = useCartSummary();
  const { isOpen, closeCart } = useCartDrawer();

  // Coupon state — simple store reads (not hook delegation, per ADR-6)
  const appliedCoupon = useCartStore((state) => state.appliedCoupon);
  const setCoupon = useCartStore((state) => state.setCoupon);
  const clearCoupon = useCartStore((state) => state.clearCoupon);

  // Preserve scroll-lock behavior (was in CartDrawer.tsx) — ADR-6
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleIncrement = (productId: number) => {
    const item = items.find((i) => i.product.product_id === productId);
    if (item) {
      updateQuantity(productId, item.quantity + 1);
    }
  };

  const handleDecrement = (productId: number) => {
    const item = items.find((i) => i.product.product_id === productId);
    if (item && item.quantity > 1) {
      updateQuantity(productId, item.quantity - 1);
    }
  };

  const handleRemove = (productId: number) => {
    removeItem(productId);
  };

  return (
    <CartDrawerPanel
      isOpen={isOpen}
      onClose={closeCart}
      items={items}
      summary={{
        subtotal,
        shipping,
        discountAmount,
        finalTotal,
        onCheckout: closeCart,
        onContinueShopping: closeCart,
      }}
      onIncrement={handleIncrement}
      onDecrement={handleDecrement}
      onRemove={handleRemove}
    >
      {items.length > 0 && (
        <>
          <CartCrossSell />
          <div className="border-t border-pearl-200 p-4 sm:p-6 space-y-3">
            <FreeShippingProgress cartTotal={subtotal} />
            <CouponInput
              cartTotal={subtotal}
              onApply={(amt, code) => setCoupon(code, amt)}
              onRemove={() => clearCoupon()}
              appliedCode={appliedCoupon ?? ''}
            />
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm text-green-700">
                <span>Descuento:</span>
                <span>-${discountAmount.toLocaleString('es-CL')}</span>
              </div>
            )}
          </div>
        </>
      )}
    </CartDrawerPanel>
  );
}
