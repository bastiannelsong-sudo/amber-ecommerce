/**
 * CARTUI-CONT-2 — Cart page container.
 * Consumes useCart + useCartSummary. Implements hydration guard + trackViewCart once-per-entry.
 * Delegates all layout to CartPageLayout. ADR-6.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useCart } from '@/features/cart/application/use-cart';
import { useCartSummary } from '@/features/cart/application/use-cart-summary';
import { trackViewCart } from '@/app/lib/analytics';
import CartSkeleton from '@/app/components/skeletons/CartSkeleton';
import { CartPageLayout } from '../organisms/CartPageLayout';
import { useCartStore } from '@/features/cart/application/cart.store';

export function CartPageContainer() {
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const { subtotal, shipping, finalTotal } = useCartSummary();
  const discountAmount = useCartStore((state) => state.discountAmount);

  // Hydration guard — Zustand persist does not hydrate until after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // GA4 view_cart: call exactly once per entry, never on re-render
  const tracked = useRef(false);
  useEffect(() => {
    if (!tracked.current && mounted && items.length > 0) {
      trackViewCart(items);
      tracked.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const handleRemoveItem = (productId: number) => {
    const item = items.find((i) => i.product.product_id === productId);
    removeItem(productId);
    if (item) {
      toast.success(`${item.product.name} eliminado del carrito`);
    }
  };

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

  const handleClearCart = () => {
    clearCart();
    toast.success('Carrito vaciado');
  };

  if (!mounted) {
    return <CartSkeleton />;
  }

  const itemCountLabel = `${items.length} ${items.length === 1 ? 'producto' : 'productos'}`;

  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm text-platinum-600 mb-8">
      <Link href="/" className="hover:text-amber-gold-500 transition-colors">
        Inicio
      </Link>
      <span>/</span>
      <span className="text-obsidian-900">Carrito</span>
    </div>
  );

  return (
    <>
      {/* Page header — owned by container so shell stays a pure thin wrapper */}
      <div className="mb-12">
        <h1
          className="text-4xl lg:text-5xl font-light text-obsidian-900 mb-2"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          Carrito de Compras
        </h1>
        <p className="text-platinum-600">{itemCountLabel}</p>
      </div>

      <CartPageLayout
        items={items}
        summary={{
          subtotal,
          shipping,
          discountAmount,
          finalTotal,
          checkoutHref: '/checkout',
          onCheckout: () => {},
          onContinueShopping: () => {},
        }}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onRemove={handleRemoveItem}
        breadcrumb={breadcrumb}
      />
      {items.length > 0 && (
        <button
          type="button"
          onClick={handleClearCart}
          className="mt-4 text-sm text-platinum-600 hover:text-red-500 transition-colors uppercase tracking-wide"
        >
          Vaciar Carrito
        </button>
      )}
    </>
  );
}
