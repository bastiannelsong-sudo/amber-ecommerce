/**
 * Unit tests for the checkout/resultado polling state machine.
 *
 * The ResultContent component polls ecommerceService.getOrder every 2s (up to 15×)
 * to resolve the payment status. This suite covers the 4 terminal states:
 *   paid    → success heading + clearCart + GA purchase event
 *   pending → "Pago en proceso" + keeps polling
 *   failed  → failure heading + "Reintentar pago" CTA
 *   error   → error heading after POLL_MAX_ATTEMPTS exhausted
 *
 * Strategy:
 *   - vi.useFakeTimers() to control setTimeout
 *   - vi.hoisted() to share mock refs safely across the vi.mock hoisting boundary
 *   - vi.mock ecommerceService.getOrder for deterministic API responses
 *   - vi.mock next/navigation for useSearchParams
 *   - vi.mock cart store for clearCart spy (also covers .getState() call)
 *   - vi.mock analytics for trackPurchase spy
 *   - vi.mock canvas-confetti (dynamic import) to prevent side-effects
 *   - vi.mock OrderStatusTimeline and Header/Footer to keep renders shallow
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';

// ─── Hoisted refs (safe across vi.mock hoisting boundary) ────────────────────

const { mockGetOrder, mockClearCart, mockTrackPurchase, mockNavState } = vi.hoisted(() => {
  const mockNavState = {
    orderNumber: 'AMB-TEST-001' as string | null,
    queryStatus: 'success',
  };
  return {
    mockGetOrder: vi.fn(),
    mockClearCart: vi.fn(),
    mockTrackPurchase: vi.fn(),
    mockNavState,
  };
});

// ─── Module-level mocks ──────────────────────────────────────────────────────

vi.mock('@/app/lib/services/ecommerce.service', () => ({
  ecommerceService: {
    getOrder: (...args: unknown[]) => mockGetOrder(...args),
  },
}));

vi.mock('@/app/lib/stores/cart.store', () => {
  // useCartStore is called both as hook (selector) and directly as .getState()
  const items = [
    {
      product: { product_id: 1, name: 'Collar Test', price: 29990 },
      quantity: 1,
    },
  ];
  const state = { clearCart: mockClearCart, items };
  const useCartStore = vi.fn(
    (selector: (s: typeof state) => unknown) => selector(state),
  );
  Object.assign(useCartStore, { getState: () => state });
  return { useCartStore };
});

vi.mock('@/app/lib/analytics', () => ({
  trackPurchase: (...args: unknown[]) => mockTrackPurchase(...args),
  trackAddToCart: vi.fn(),
  trackRemoveFromCart: vi.fn(),
  trackBeginCheckout: vi.fn(),
}));

// Prevent dynamic import of canvas-confetti from throwing in jsdom
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Shallow-render layout components
vi.mock('@/app/components/Header', () => ({
  default: () => <header data-testid="header" />,
}));

vi.mock('@/app/components/Footer', () => ({
  default: () => <footer data-testid="footer" />,
}));

vi.mock('@/app/components/OrderStatusTimeline', () => ({
  default: ({ status }: { status: string }) => (
    <div data-testid="order-status-timeline" data-status={status} />
  ),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === 'order') return mockNavState.orderNumber;
      if (key === 'status') return mockNavState.queryStatus;
      return null;
    },
  }),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeOrder(status: string, orderNumber = 'AMB-TEST-001') {
  return {
    order_id: 1,
    order_number: orderNumber,
    status,
    total: 29990,
    customer_email: 'test@amber.cl',
    mp_payment_status: status === 'paid' ? 'approved' : status,
    mp_payment_method: null,
  };
}

// ─── Import AFTER mocks ───────────────────────────────────────────────────────
import CheckoutResultPage from './page';

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('CheckoutResultPage — polling state machine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetOrder.mockReset();
    mockClearCart.mockReset();
    mockTrackPurchase.mockReset();
    mockNavState.orderNumber = 'AMB-TEST-001';
    mockNavState.queryStatus = 'success';

    // jsdom does not implement window.matchMedia — polyfill for fireConfetti
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  // ── paid ──────────────────────────────────────────────────────────────────

  describe('paid status', () => {
    it('shows "Pedido confirmado" heading when order status is paid', async () => {
      mockGetOrder.mockResolvedValueOnce(makeOrder('paid'));

      render(<CheckoutResultPage />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(
        screen.getByRole('heading', { name: /pedido confirmado/i }),
      ).toBeInTheDocument();
    });

    it('calls clearCart once when payment is confirmed', async () => {
      mockGetOrder.mockResolvedValueOnce(makeOrder('paid'));

      render(<CheckoutResultPage />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockClearCart).toHaveBeenCalledTimes(1);
    });

    it('fires trackPurchase exactly once with correct transaction_id', async () => {
      mockGetOrder.mockResolvedValueOnce(makeOrder('paid'));

      render(<CheckoutResultPage />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockTrackPurchase).toHaveBeenCalledTimes(1);
      expect(mockTrackPurchase).toHaveBeenCalledWith(
        expect.objectContaining({ transaction_id: 'AMB-TEST-001' }),
      );
    });

    it('shows "Ver comprobante" link when paid', async () => {
      mockGetOrder.mockResolvedValueOnce(makeOrder('paid'));

      render(<CheckoutResultPage />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(
        screen.getByRole('link', { name: /ver comprobante/i }),
      ).toBeInTheDocument();
    });

    it('does NOT fire trackPurchase twice across multiple poll cycles', async () => {
      mockGetOrder.mockResolvedValue(makeOrder('paid'));

      render(<CheckoutResultPage />);

      await act(async () => {
        await Promise.resolve();
        vi.advanceTimersByTime(4000);
        await Promise.resolve();
      });

      expect(mockTrackPurchase).toHaveBeenCalledTimes(1);
    });
  });

  // ── pending → resolves to paid ─────────────────────────────────────────────

  describe('pending status — keeps polling until paid', () => {
    it('shows "Pago en proceso" initially then transitions to "Pedido confirmado"', async () => {
      mockNavState.queryStatus = 'pending';

      mockGetOrder
        .mockResolvedValueOnce(makeOrder('pending'))
        .mockResolvedValueOnce(makeOrder('paid'));

      render(<CheckoutResultPage />);

      // First poll resolves → pending UI
      await act(async () => {
        await Promise.resolve();
      });

      expect(
        screen.getByRole('heading', { name: /pago en proceso/i }),
      ).toBeInTheDocument();

      // Advance to trigger second poll
      await act(async () => {
        vi.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(
        screen.getByRole('heading', { name: /pedido confirmado/i }),
      ).toBeInTheDocument();
    });
  });

  // ── failed ────────────────────────────────────────────────────────────────

  describe('failed status', () => {
    it('shows "Pago no completado" heading when order is cancelled', async () => {
      mockGetOrder.mockResolvedValueOnce(makeOrder('cancelled'));
      mockNavState.queryStatus = 'failure';

      render(<CheckoutResultPage />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(
        screen.getByRole('heading', { name: /pago no completado/i }),
      ).toBeInTheDocument();
    });

    it('shows "Reintentar pago" CTA on failure', async () => {
      mockGetOrder.mockResolvedValueOnce(makeOrder('cancelled'));
      mockNavState.queryStatus = 'failure';

      render(<CheckoutResultPage />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(
        screen.getByRole('link', { name: /reintentar pago/i }),
      ).toBeInTheDocument();
    });

    it('does NOT show "Ver comprobante" link on failure', async () => {
      mockGetOrder.mockResolvedValueOnce(makeOrder('cancelled'));
      mockNavState.queryStatus = 'failure';

      render(<CheckoutResultPage />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(
        screen.queryByRole('link', { name: /ver comprobante/i }),
      ).not.toBeInTheDocument();
    });

    it('maps pending DB status + failure query param to failed UI (failure gate)', async () => {
      // MP redirected with failure but webhook hasn't arrived yet → still pending in DB
      mockGetOrder.mockResolvedValueOnce(makeOrder('pending'));
      mockNavState.queryStatus = 'failure';

      render(<CheckoutResultPage />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(
        screen.getByRole('heading', { name: /pago no completado/i }),
      ).toBeInTheDocument();
    });

    it('does NOT call clearCart on failed payment', async () => {
      mockGetOrder.mockResolvedValueOnce(makeOrder('cancelled'));
      mockNavState.queryStatus = 'failure';

      render(<CheckoutResultPage />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockClearCart).not.toHaveBeenCalled();
    });
  });

  // ── error / timeout ───────────────────────────────────────────────────────

  describe('error / timeout state', () => {
    it('shows error heading after all retries fail with network error', async () => {
      mockGetOrder.mockRejectedValue(new Error('Network error'));

      render(<CheckoutResultPage />);

      // POLL_MAX_ATTEMPTS = 15, each 2s apart = 28s of timers needed
      await act(async () => {
        for (let i = 0; i < 15; i++) {
          await Promise.resolve(); // flush rejection
          vi.advanceTimersByTime(2000);
        }
        await Promise.resolve();
      });

      expect(
        screen.getByRole('heading', { name: /no pudimos verificar el pago/i }),
      ).toBeInTheDocument();
    });

    it('does NOT show "Reintentar pago" or "Ver comprobante" in error state', async () => {
      mockGetOrder.mockRejectedValue(new Error('Network error'));

      render(<CheckoutResultPage />);

      await act(async () => {
        for (let i = 0; i < 15; i++) {
          await Promise.resolve();
          vi.advanceTimersByTime(2000);
        }
        await Promise.resolve();
      });

      expect(
        screen.queryByRole('link', { name: /reintentar pago/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /ver comprobante/i }),
      ).not.toBeInTheDocument();
    });
  });

  // ── missing order number ────────────────────────────────────────────────────

  describe('missing order number', () => {
    it('shows error UI immediately when order param is absent', async () => {
      mockNavState.orderNumber = null;

      render(<CheckoutResultPage />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(
        screen.getByRole('heading', { name: /no pudimos verificar el pago/i }),
      ).toBeInTheDocument();
    });
  });
});
