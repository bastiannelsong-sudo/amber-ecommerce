import { useCartStore } from '@/app/lib/stores/cart.store';
import {
  subtotal as domainSubtotal,
  shippingCost,
} from '@/features/cart/domain/cart.rules';
import { orderTotal } from '@/features/checkout/domain/checkout.rules';

/**
 * Derives checkout summary totals from the cart store via domain functions.
 * Zero arithmetic lives here — all values route through domain.
 */
export const useCheckoutSummary = () => {
  const items = useCartStore((state) => state.items);
  const discountAmount = useCartStore((state) => state.discountAmount);

  const subtotal = domainSubtotal(items);
  const shipping = shippingCost(subtotal);
  const total = orderTotal(subtotal, discountAmount, shipping);

  return {
    subtotal,
    discount: discountAmount,
    shipping,
    total,
  };
};
