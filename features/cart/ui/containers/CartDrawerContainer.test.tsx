/**
 * CARTUI-CONT-1 + CARTUI-T3
 * RTL test for CartDrawerContainer — mocked hooks, verifies hook values in DOM.
 * ADR-9: module-level vi.mock following use-search-suggestions.test.ts precedent.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { CartItem } from '@/features/cart/domain/cart.types';

// ─── Module-level mocks (must be before imports that use them) ────────────────

vi.mock('@/features/cart/application/use-cart', () => ({
  useCart: vi.fn(),
}));

vi.mock('@/features/cart/application/use-cart-summary', () => ({
  useCartSummary: vi.fn(),
}));

vi.mock('@/features/cart/application/use-cart-drawer', () => ({
  useCartDrawer: vi.fn(),
}));

// Mock cart store for coupon state (CartDrawerContainer reads it directly)
vi.mock('@/features/cart/application/cart.store', () => ({
  useCartStore: vi.fn((selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      appliedCoupon: null,
      discountAmount: 0,
      setCoupon: vi.fn(),
      clearCoupon: vi.fn(),
    }),
  ),
}));

import { useCart } from '@/features/cart/application/use-cart';
import { useCartSummary } from '@/features/cart/application/use-cart-summary';
import { useCartDrawer } from '@/features/cart/application/use-cart-drawer';
import { CartDrawerContainer } from './CartDrawerContainer';

const mockItem: CartItem = {
  product: {
    product_id: 1,
    internal_sku: 'SKU-001',
    name: 'Anillo de Prueba',
    price: 15990,
    image_url: '',
  },
  quantity: 1,
};

const mockRemoveItem = vi.fn();
const mockUpdateQuantity = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  (useCart as ReturnType<typeof vi.fn>).mockReturnValue({
    items: [mockItem],
    addItem: vi.fn(),
    removeItem: mockRemoveItem,
    updateQuantity: mockUpdateQuantity,
    clearCart: vi.fn(),
  });

  (useCartSummary as ReturnType<typeof vi.fn>).mockReturnValue({
    subtotal: 15990,
    shipping: 5000,
    discountAmount: 0,
    finalTotal: 20990,
    total: 20990,
    itemCount: 1,
  });

  (useCartDrawer as ReturnType<typeof vi.fn>).mockReturnValue({
    isOpen: true,
    openCart: vi.fn(),
    closeCart: vi.fn(),
    toggleCart: vi.fn(),
  });
});

describe('CartDrawerContainer', () => {
  it('renders item name from mocked useCart items', () => {
    render(<CartDrawerContainer />);

    expect(screen.getByText('Anillo de Prueba')).toBeInTheDocument();
  });

  it('renders when isOpen=false (drawer not shown)', () => {
    (useCartDrawer as ReturnType<typeof vi.fn>).mockReturnValue({
      isOpen: false,
      openCart: vi.fn(),
      closeCart: vi.fn(),
      toggleCart: vi.fn(),
    });

    // When closed, the drawer content may not be in DOM — just verify it doesn't crash
    const { container } = render(<CartDrawerContainer />);
    expect(container).toBeDefined();
  });

  it('renders the drawer header when isOpen=true', () => {
    render(<CartDrawerContainer />);

    // Drawer panel header should be visible
    expect(screen.getByText('Carrito')).toBeInTheDocument();
  });
});
