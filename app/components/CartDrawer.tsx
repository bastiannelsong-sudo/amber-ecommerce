'use client';

/**
 * CARTUI-SWAP — Thin shell. Delegates all rendering to CartDrawerContainer.
 * One-line rollback: replace this file with the pre-strangle version.
 * All behavior preserved: animation, scroll-lock, cross-sell, coupon, progress, CTAs.
 */
import { CartDrawerContainer } from '@/features/cart/ui/containers/CartDrawerContainer';

export default function CartDrawer() {
  return <CartDrawerContainer />;
}
