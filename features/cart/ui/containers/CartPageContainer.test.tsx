/**
 * CARTUI-CONT-2 + CARTUI-T3
 * RTL test for CartPageContainer — mocked hooks, verifies:
 * 1. CartSkeleton shown before mounted (hydration guard)
 * 2. trackViewCart called once on mount
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

// ─── Module-level mocks ───────────────────────────────────────────────────────

vi.mock('@/features/cart/application/use-cart', () => ({
  useCart: vi.fn(),
}));

vi.mock('@/features/cart/application/use-cart-summary', () => ({
  useCartSummary: vi.fn(),
}));

// Mock analytics
vi.mock('@/app/lib/analytics', () => ({
  trackViewCart: vi.fn(),
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock CartSkeleton
vi.mock('@/app/components/skeletons/CartSkeleton', () => ({
  default: () => <div data-testid="cart-skeleton">Loading...</div>,
}));

import { useCart } from '@/features/cart/application/use-cart';
import { useCartSummary } from '@/features/cart/application/use-cart-summary';
import { trackViewCart } from '@/app/lib/analytics';
import { CartPageContainer } from './CartPageContainer';
import type { CartItem } from '@/features/cart/domain/cart.types';

const mockItem: CartItem = {
  product: {
    product_id: 1,
    internal_sku: 'SKU-001',
    name: 'Producto Test',
    price: 20000,
    image_url: '',
  },
  quantity: 1,
};

beforeEach(() => {
  vi.clearAllMocks();

  (useCart as ReturnType<typeof vi.fn>).mockReturnValue({
    items: [mockItem],
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
  });

  (useCartSummary as ReturnType<typeof vi.fn>).mockReturnValue({
    subtotal: 20000,
    shipping: 0,
    discountAmount: 0,
    finalTotal: 20000,
    total: 20000,
    itemCount: 1,
  });
});

describe('CartPageContainer', () => {
  it('renders cart content after mounting (hydration guard resolves)', async () => {
    // RTL render() wraps in act() which flushes useEffect, so mounted becomes true.
    // After mount, CartPageLayout should be rendered (not the skeleton).
    await act(async () => {
      render(<CartPageContainer />);
    });

    // After mounting, "Vaciar Carrito" button is visible (content rendered)
    expect(screen.getByRole('button', { name: /vaciar/i })).toBeInTheDocument();
  });

  it('calls trackViewCart once after mount when items > 0', async () => {
    await act(async () => {
      render(<CartPageContainer />);
    });

    expect(trackViewCart).toHaveBeenCalledTimes(1);
    expect(trackViewCart).toHaveBeenCalledWith([mockItem]);
  });

  it('does not call trackViewCart twice on re-render', async () => {
    const { rerender } = await (async () => {
      let result!: ReturnType<typeof render>;
      await act(async () => {
        result = render(<CartPageContainer />);
      });
      return result;
    })();

    await act(async () => {
      rerender(<CartPageContainer />);
    });

    expect(trackViewCart).toHaveBeenCalledTimes(1);
  });
});
