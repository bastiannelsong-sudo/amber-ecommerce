import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/app/lib/types';
import type { CartItem } from '@/features/cart/domain/cart.types';
import {
  addItem as domainAddItem,
  removeItem as domainRemoveItem,
  setQuantity as domainSetQuantity,
  subtotal as domainSubtotal,
  itemCount as domainItemCount,
  itemQuantity as domainItemQuantity,
} from '@/features/cart/domain/cart.rules';
import { toCartProduct } from './cart.mapper';
import { trackAddToCart, trackRemoveFromCart } from '@/app/lib/analytics';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Computed
  getTotal: () => number;
  getItemCount: () => number;
  getItemQuantity: (productId: number) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1) => {
        const cartProduct = toCartProduct(product);
        set((state) => ({ items: domainAddItem(state.items, cartProduct, quantity) }));
        trackAddToCart(product, quantity);
      },

      removeItem: (productId) => {
        const removed = get().items.find(
          (item) => item.product.product_id === productId,
        );
        set((state) => ({ items: domainRemoveItem(state.items, productId) }));
        if (removed) {
          trackRemoveFromCart(removed.product, removed.quantity);
        }
      },

      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: domainSetQuantity(state.items, productId, quantity),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      getTotal: () => domainSubtotal(get().items),

      getItemCount: () => domainItemCount(get().items),

      getItemQuantity: (productId) => domainItemQuantity(get().items, productId),
    }),
    {
      name: 'amber-cart-storage',
    },
  ),
);
