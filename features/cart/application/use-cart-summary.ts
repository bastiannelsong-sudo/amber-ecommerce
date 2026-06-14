import { useCartStore } from './cart.store';
import {
  subtotal as domainSubtotal,
  shippingCost as domainShippingCost,
  cartTotal as domainCartTotal,
  itemCount as domainItemCount,
} from '@/features/cart/domain/cart.rules';
import { orderTotal } from '@/features/checkout/domain/checkout.rules';

/**
 * Exposes a derived cart summary derived exclusively from domain functions.
 * No inline arithmetic lives here — all values route through domain.
 *
 * CART-A4: finalTotal = orderTotal(subtotal, discountAmount, shipping) from checkout domain.
 * Single canonical location for coupon-aware order total computation. ADR-5.
 */
export const useCartSummary = () => {
  const items = useCartStore((state) => state.items);
  const discountAmount = useCartStore((state) => state.discountAmount);
  const sub = domainSubtotal(items);
  const shipping = domainShippingCost(sub);

  return {
    subtotal: sub,
    shipping,
    total: domainCartTotal(sub),
    itemCount: domainItemCount(items),
    finalTotal: orderTotal(sub, discountAmount, shipping),
  };
};
