/**
 * CHKUI-HOOK-2, CHK-A5, ADR-5 (sanitizePhone at boundary)
 * TDD RED phase — tests written before implementation.
 * Tests: exported API shape, redirect on success, sanitizePhone at payload boundary,
 * double-submit guard.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/app/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public status: number,
      public data: unknown,
    ) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

vi.mock('@/app/lib/stores/cart.store', () => ({
  useCartStore: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import { apiClient, ApiError } from '@/app/lib/api-client';
import { useCartStore } from '@/app/lib/stores/cart.store';
import toast from 'react-hot-toast';
import { useCheckoutSubmit } from './use-checkout-submit';
import type { CartItem } from '@/app/lib/types';

// ─── window.location mock (LOCKED #2 pattern) ────────────────────────────────

Object.defineProperty(window, 'location', {
  value: { href: '' },
  writable: true,
  configurable: true,
});

// ─── Test fixtures ────────────────────────────────────────────────────────────

const mockItems: CartItem[] = [
  {
    product: {
      product_id: 1,
      internal_sku: 'SKU-001',
      name: 'Anillo de oro',
      price: 50000,
      image_url: 'https://example.com/img.jpg',
    },
    quantity: 2,
  },
];

const mockFormData = {
  email: 'test@test.com',
  firstName: 'Juan',
  lastName: 'Pérez',
  phone: '+56 9 1234 5678',
  address: 'Av. Siempre Viva 742',
  apartment: '',
  region: 'RM',
  commune: 'Santiago',
  postalCode: '',
};

const mockSubmitPaymentEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

beforeEach(() => {
  vi.clearAllMocks();
  window.location.href = '';

  (useCartStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    (selector: (state: { items: CartItem[]; appliedCoupon: string | null; discountAmount: number }) => unknown) =>
      selector({ items: mockItems, appliedCoupon: null, discountAmount: 0 }),
  );

  (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: {
      order: { order_number: 'ORD-001' },
      init_point: 'https://mp.com/checkout/123',
    },
    status: 201,
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useCheckoutSubmit — exported API shape', () => {
  it('returns isProcessingPayment boolean and handleSubmitPayment function', () => {
    const { result } = renderHook(() => useCheckoutSubmit(mockFormData));

    expect(typeof result.current.isProcessingPayment).toBe('boolean');
    expect(result.current.isProcessingPayment).toBe(false);
    expect(typeof result.current.handleSubmitPayment).toBe('function');
  });
});

describe('useCheckoutSubmit — redirect on success', () => {
  it('redirects window.location.href to init_point on successful POST', async () => {
    const { result } = renderHook(() => useCheckoutSubmit(mockFormData));

    await act(async () => {
      await result.current.handleSubmitPayment(mockSubmitPaymentEvent);
    });

    expect(window.location.href).toBe('https://mp.com/checkout/123');
  });

  it('calls apiClient.post directly to /orders (NOT ecommerceService)', async () => {
    const { result } = renderHook(() => useCheckoutSubmit(mockFormData));

    await act(async () => {
      await result.current.handleSubmitPayment(mockSubmitPaymentEvent);
    });

    expect(apiClient.post).toHaveBeenCalledTimes(1);
    const [path] = (apiClient.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(path).toBe('/orders');
  });

  it('shows success toast on redirect', async () => {
    const { result } = renderHook(() => useCheckoutSubmit(mockFormData));

    await act(async () => {
      await result.current.handleSubmitPayment(mockSubmitPaymentEvent);
    });

    expect(toast.success).toHaveBeenCalledTimes(1);
  });
});

describe('useCheckoutSubmit — sanitizePhone at payload boundary (ADR-5)', () => {
  it('sanitizes phone in POST body: spaces stripped in payload but preserved in formData display', async () => {
    const { result } = renderHook(() => useCheckoutSubmit(mockFormData));

    await act(async () => {
      await result.current.handleSubmitPayment(mockSubmitPaymentEvent);
    });

    const postBody = (apiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    // sanitizePhone('+56 9 1234 5678') → '+56912345678'
    expect(postBody.customer_phone).toBe('+56912345678');
  });
});

describe('useCheckoutSubmit — double-submit guard', () => {
  it('only fires one POST when handleSubmitPayment called twice rapidly', async () => {
    // Make the first POST take a bit so guard can be tested
    let resolvePost!: (value: unknown) => void;
    (apiClient.post as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise((res) => { resolvePost = res; }),
    );

    const { result } = renderHook(() => useCheckoutSubmit(mockFormData));

    // Call twice without awaiting the first
    act(() => {
      void result.current.handleSubmitPayment(mockSubmitPaymentEvent);
      void result.current.handleSubmitPayment(mockSubmitPaymentEvent);
    });

    // Resolve the pending post
    await act(async () => {
      resolvePost({
        data: { order: { order_number: 'ORD-001' }, init_point: 'https://mp.com/checkout/123' },
        status: 201,
      });
    });

    expect(apiClient.post).toHaveBeenCalledTimes(1);
  });
});

describe('useCheckoutSubmit — error handling', () => {
  it('shows error toast when POST fails', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error'),
    );

    const { result } = renderHook(() => useCheckoutSubmit(mockFormData));

    await act(async () => {
      await result.current.handleSubmitPayment(mockSubmitPaymentEvent);
    });

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe('');
  });

  it('resets isProcessingPayment to false after error', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Server error'),
    );

    const { result } = renderHook(() => useCheckoutSubmit(mockFormData));

    await act(async () => {
      await result.current.handleSubmitPayment(mockSubmitPaymentEvent);
    });

    expect(result.current.isProcessingPayment).toBe(false);
  });

  it('uses ApiError backend message when available', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new ApiError('HTTP 422', 422, { error: 'Stock insuficiente' }),
    );

    const { result } = renderHook(() => useCheckoutSubmit(mockFormData));

    await act(async () => {
      await result.current.handleSubmitPayment(mockSubmitPaymentEvent);
    });

    const errorArg = (toast.error as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(errorArg).toContain('Stock insuficiente');
  });

  it('throws when init_point is missing from response', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { order: { order_number: 'ORD-001' } }, // no init_point
      status: 201,
    });

    const { result } = renderHook(() => useCheckoutSubmit(mockFormData));

    await act(async () => {
      await result.current.handleSubmitPayment(mockSubmitPaymentEvent);
    });

    // Should show error, not redirect
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe('');
  });
});
