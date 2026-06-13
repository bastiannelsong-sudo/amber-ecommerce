import { useCartStore } from './cart.store';
import type { Product } from '@/app/lib/types';

/**
 * Forward-path hook for cart mutations.
 * Exposes addItem / removeItem as the stable public API for new consumers.
 * Analytics remain in the store for this slice; they will be migrated here
 * in the UI-migration slice once call sites switch to useCart.
 */
export const useCart = () => {
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const items = useCartStore((state) => state.items);

  return {
    items,
    addItem: (product: Product, quantity?: number) => addItem(product, quantity),
    removeItem: (productId: number) => removeItem(productId),
    updateQuantity: (productId: number, quantity: number) =>
      updateQuantity(productId, quantity),
    clearCart,
  };
};
