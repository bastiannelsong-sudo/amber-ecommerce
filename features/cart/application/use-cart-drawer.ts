/**
 * CARTUI-HOOK-1 — Cart drawer open/close hook.
 * Thin selector wrappers over useCartStore: one selector per field, NOT function-in-selector.
 * Single responsibility: drawer open/close state only. ADR-4.
 */
import { useCartStore } from './cart.store';

export const useCartDrawer = () => {
  const isOpen = useCartStore((state) => state.isOpen);
  const openCart = useCartStore((state) => state.openCart);
  const closeCart = useCartStore((state) => state.closeCart);
  const toggleCart = useCartStore((state) => state.toggleCart);

  return { isOpen, openCart, closeCart, toggleCart };
};
