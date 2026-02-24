import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cart.store';
import type { Product } from '../types';

const mockProduct: Product = {
  product_id: 1,
  internal_sku: 'AMB-COL-001',
  name: 'Collar Punto de Luz',
  stock: 10,
  stock_bodega: 5,
  cost: 15000,
  price: 29990,
  image_url: 'https://images.unsplash.com/test',
};

const mockProduct2: Product = {
  product_id: 2,
  internal_sku: 'AMB-ARO-001',
  name: 'Aros Plata 925',
  stock: 8,
  stock_bodega: 3,
  cost: 12000,
  price: 19990,
  image_url: 'https://images.unsplash.com/test2',
};

describe('CartStore', () => {
  beforeEach(() => {
    // Resetear el store antes de cada test
    useCartStore.setState({ items: [], isOpen: false });
  });

  describe('addItem', () => {
    it('should add a new item to the cart', () => {
      useCartStore.getState().addItem(mockProduct);
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].product.product_id).toBe(1);
      expect(items[0].quantity).toBe(1);
    });

    it('should increment quantity if item already exists', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProduct);
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it('should add custom quantity', () => {
      useCartStore.getState().addItem(mockProduct, 3);
      expect(useCartStore.getState().items[0].quantity).toBe(3);
    });
  });

  describe('removeItem', () => {
    it('should remove an item from the cart', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProduct2);
      useCartStore.getState().removeItem(1);
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].product.product_id).toBe(2);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateQuantity(1, 5);
      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it('should remove item when quantity is 0', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateQuantity(1, 0);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should remove item when quantity is negative', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateQuantity(1, -1);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should not affect other items when updating', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProduct2);
      useCartStore.getState().updateQuantity(1, 10);
      expect(useCartStore.getState().items[0].quantity).toBe(10);
      expect(useCartStore.getState().items[1].quantity).toBe(1);
    });
  });

  describe('getTotal', () => {
    it('should calculate total correctly', () => {
      useCartStore.getState().addItem(mockProduct, 2);
      useCartStore.getState().addItem(mockProduct2, 1);
      const total = useCartStore.getState().getTotal();
      expect(total).toBe(29990 * 2 + 19990 * 1);
    });

    it('should return 0 for empty cart', () => {
      expect(useCartStore.getState().getTotal()).toBe(0);
    });

    it('should treat missing price as 0', () => {
      const productNoPrice = { ...mockProduct, price: undefined as unknown as number };
      useCartStore.getState().addItem(productNoPrice, 2);
      expect(useCartStore.getState().getTotal()).toBe(0);
    });
  });

  describe('getItemCount', () => {
    it('should return total item count', () => {
      useCartStore.getState().addItem(mockProduct, 2);
      useCartStore.getState().addItem(mockProduct2, 3);
      expect(useCartStore.getState().getItemCount()).toBe(5);
    });

    it('should return 0 for empty cart', () => {
      expect(useCartStore.getState().getItemCount()).toBe(0);
    });
  });

  describe('getItemQuantity', () => {
    it('should return quantity of existing item', () => {
      useCartStore.getState().addItem(mockProduct, 3);
      expect(useCartStore.getState().getItemQuantity(1)).toBe(3);
    });

    it('should return 0 for non-existing item', () => {
      expect(useCartStore.getState().getItemQuantity(999)).toBe(0);
    });
  });

  describe('clearCart', () => {
    it('should clear all items', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProduct2);
      useCartStore.getState().clearCart();
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('cart toggle', () => {
    it('should open cart', () => {
      useCartStore.getState().openCart();
      expect(useCartStore.getState().isOpen).toBe(true);
    });

    it('should close cart', () => {
      useCartStore.getState().openCart();
      useCartStore.getState().closeCart();
      expect(useCartStore.getState().isOpen).toBe(false);
    });

    it('should toggle cart', () => {
      useCartStore.getState().toggleCart();
      expect(useCartStore.getState().isOpen).toBe(true);
      useCartStore.getState().toggleCart();
      expect(useCartStore.getState().isOpen).toBe(false);
    });
  });
});
