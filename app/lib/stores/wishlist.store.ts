import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, WishlistItem } from '../types';

interface WishlistStore {
  items: WishlistItem[];

  // Actions
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  toggleItem: (product: Product) => void;
  clearWishlist: () => void;

  // Computed
  isInWishlist: (productId: number) => boolean;
  getItemCount: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        set((state) => {
          const exists = state.items.some(
            (item) => item.product.product_id === product.product_id
          );

          if (exists) {
            return state;
          }

          return {
            items: [
              ...state.items,
              {
                product,
                added_at: new Date().toISOString(),
              },
            ],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => item.product.product_id !== productId
          ),
        }));
      },

      toggleItem: (product) => {
        const { isInWishlist, addItem, removeItem } = get();

        if (isInWishlist(product.product_id)) {
          removeItem(product.product_id);
        } else {
          addItem(product);
        }
      },

      clearWishlist: () => {
        set({ items: [] });
      },

      isInWishlist: (productId) => {
        const { items } = get();
        return items.some((item) => item.product.product_id === productId);
      },

      getItemCount: () => {
        const { items } = get();
        return items.length;
      },
    }),
    {
      name: 'amber-wishlist-storage',
    }
  )
);
