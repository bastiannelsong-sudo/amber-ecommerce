import { useCartStore } from './cart.store';
import {
  subtotal as domainSubtotal,
  shippingCost as domainShippingCost,
  cartTotal as domainCartTotal,
  itemCount as domainItemCount,
} from '@/features/cart/domain/cart.rules';

/**
 * Exposes a derived cart summary derived exclusively from domain functions.
 * No inline arithmetic lives here — all values route through domain.
 */
export const useCartSummary = () => {
  const items = useCartStore((state) => state.items);
  const sub = domainSubtotal(items);

  return {
    subtotal: sub,
    shipping: domainShippingCost(sub),
    total: domainCartTotal(sub),
    itemCount: domainItemCount(items),
  };
};
