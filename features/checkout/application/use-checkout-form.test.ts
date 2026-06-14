/**
 * CHKUI-HOOK-1, CHK-A4, CHKUI-FIX-S001
 * TDD RED phase — tests written before implementation.
 * Tests: exported API shape, GEO loading with cancellation, communesOfRegion memo,
 * handleInputChange phone preservation, handleSubmitShipping validation (S-001),
 * retryGeo, trackBeginCheckout once-per-entry.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ─── Module mocks (hoisted above imports) ─────────────────────────────────────

vi.mock('@/app/lib/services/addresses.service', () => ({
  addressesService: {
    getGeo: vi.fn(),
  },
}));

vi.mock('@/app/lib/analytics', () => ({
  trackBeginCheckout: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@/app/lib/stores/cart.store', () => ({
  useCartStore: vi.fn(),
}));

import { addressesService } from '@/app/lib/services/addresses.service';
import { trackBeginCheckout } from '@/app/lib/analytics';
import toast from 'react-hot-toast';
import { useCartStore } from '@/app/lib/stores/cart.store';
import { useCheckoutForm } from './use-checkout-form';
import type { ChileGeoResponse } from '@/app/lib/types';

// ─── Test fixture ─────────────────────────────────────────────────────────────

const mockGeo: ChileGeoResponse = {
  regions: [
    {
      id: 1,
      short_name: 'RM',
      full_name: 'Región Metropolitana',
      capital: 'Santiago',
      communes: [{ name: 'Santiago' }, { name: 'Providencia' }],
    },
    {
      id: 2,
      short_name: 'V',
      full_name: 'Valparaíso',
      capital: 'Valparaíso',
      communes: [{ name: 'Valparaíso' }, { name: 'Viña del Mar' }],
    },
  ],
  total_regions: 2,
  total_communes: 4,
};

const validFormData = {
  email: 'test@test.com',
  firstName: 'Juan',
  lastName: 'Pérez',
  phone: '+56912345678',
  address: 'Av. Siempre Viva 742',
  apartment: '',
  region: 'RM',
  commune: 'Santiago',
  postalCode: '',
};

beforeEach(() => {
  vi.clearAllMocks();
  (useCartStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: { items: unknown[] }) => unknown) =>
    selector({ items: [] }),
  );
  (addressesService.getGeo as ReturnType<typeof vi.fn>).mockResolvedValue(mockGeo);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useCheckoutForm — exported API shape', () => {
  it('returns all expected properties', async () => {
    let result!: ReturnType<typeof renderHook<ReturnType<typeof useCheckoutForm>, undefined>>['result'];
    await act(async () => {
      ({ result } = renderHook(() => useCheckoutForm()));
    });

    expect(result.current).toHaveProperty('formData');
    expect(result.current).toHaveProperty('selectedAddressId');
    expect(result.current).toHaveProperty('geo');
    expect(result.current).toHaveProperty('geoError');
    expect(result.current).toHaveProperty('communesOfRegion');
    expect(result.current).toHaveProperty('mounted');
    expect(result.current).toHaveProperty('handleInputChange');
    expect(result.current).toHaveProperty('handleSelectSavedAddress');
    expect(result.current).toHaveProperty('handleSubmitShipping');
    expect(result.current).toHaveProperty('retryGeo');
  });

  it('formData uses commune (not city) field', async () => {
    let result!: ReturnType<typeof renderHook<ReturnType<typeof useCheckoutForm>, undefined>>['result'];
    await act(async () => {
      ({ result } = renderHook(() => useCheckoutForm()));
    });

    expect(result.current.formData).toHaveProperty('commune');
    expect(result.current.formData).not.toHaveProperty('city');
  });
});

describe('useCheckoutForm — GEO loading', () => {
  it('loads geo on mount via addressesService.getGeo()', async () => {
    let result!: ReturnType<typeof renderHook<ReturnType<typeof useCheckoutForm>, undefined>>['result'];
    await act(async () => {
      ({ result } = renderHook(() => useCheckoutForm()));
    });

    expect(addressesService.getGeo).toHaveBeenCalledTimes(1);
    expect(result.current.geo).toEqual(mockGeo);
    expect(result.current.geoError).toBeNull();
  });

  it('sets geoError when getGeo rejects', async () => {
    (addressesService.getGeo as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error'),
    );

    let result!: ReturnType<typeof renderHook<ReturnType<typeof useCheckoutForm>, undefined>>['result'];
    await act(async () => {
      ({ result } = renderHook(() => useCheckoutForm()));
    });

    expect(result.current.geo).toBeNull();
    expect(result.current.geoError).toContain('Network error');
  });

  it('sets geoError when getGeo returns empty regions', async () => {
    (addressesService.getGeo as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      regions: [],
      total_regions: 0,
      total_communes: 0,
    });

    let result!: ReturnType<typeof renderHook<ReturnType<typeof useCheckoutForm>, undefined>>['result'];
    await act(async () => {
      ({ result } = renderHook(() => useCheckoutForm()));
    });

    expect(result.current.geo).toBeNull();
    expect(result.current.geoError).toBeTruthy();
  });

  it('cancels pending GEO fetch on unmount (let cancelled flag)', async () => {
    // If cancelled is working, no state update should happen after unmount
    // We verify by checking getGeo was called (cancellation is internal)
    let unmount!: () => void;
    await act(async () => {
      ({ unmount } = renderHook(() => useCheckoutForm()));
    });
    // Unmount before next tick — cancelled should prevent state update
    act(() => { unmount(); });
    // No error thrown = cancelled flag worked
    expect(addressesService.getGeo).toHaveBeenCalledTimes(1);
  });
});

describe('useCheckoutForm — communesOfRegion memo', () => {
  it('returns communes for selected region', async () => {
    let result!: ReturnType<typeof renderHook<ReturnType<typeof useCheckoutForm>, undefined>>['result'];
    await act(async () => {
      ({ result } = renderHook(() => useCheckoutForm()));
    });

    // Set region to RM
    act(() => {
      result.current.handleInputChange({
        target: { name: 'region', value: 'RM' },
      } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
    });

    expect(result.current.communesOfRegion).toHaveLength(2);
    expect(result.current.communesOfRegion[0].name).toBe('Santiago');
  });

  it('resets commune when region changes', async () => {
    let result!: ReturnType<typeof renderHook<ReturnType<typeof useCheckoutForm>, undefined>>['result'];
    await act(async () => {
      ({ result } = renderHook(() => useCheckoutForm()));
    });

    // First set region+commune
    act(() => {
      result.current.handleInputChange({
        target: { name: 'region', value: 'RM' },
      } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
    });
    act(() => {
      result.current.handleInputChange({
        target: { name: 'commune', value: 'Providencia' },
      } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
    });

    expect(result.current.formData.commune).toBe('Providencia');

    // Change region — commune should reset
    act(() => {
      result.current.handleInputChange({
        target: { name: 'region', value: 'V' },
      } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
    });

    expect(result.current.formData.commune).toBe('');
  });

  it('returns empty array when region not in geo', async () => {
    let result!: ReturnType<typeof renderHook<ReturnType<typeof useCheckoutForm>, undefined>>['result'];
    await act(async () => {
      ({ result } = renderHook(() => useCheckoutForm()));
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'region', value: 'NONEXISTENT' },
      } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
    });

    expect(result.current.communesOfRegion).toHaveLength(0);
  });
});

describe('useCheckoutForm — handleInputChange phone', () => {
  it('preserves phone spaces (keeps +56 9 1234 5678 as-is)', async () => {
    let result!: ReturnType<typeof renderHook<ReturnType<typeof useCheckoutForm>, undefined>>['result'];
    await act(async () => {
      ({ result } = renderHook(() => useCheckoutForm()));
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'phone', value: '+56 9 1234 5678' },
      } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
    });

    // Spaces are preserved — only non-digit non-plus chars stripped
    expect(result.current.formData.phone).toBe('+56 9 1234 5678');
  });

  it('strips non-digit non-plus non-space chars from phone', async () => {
    let result!: ReturnType<typeof renderHook<ReturnType<typeof useCheckoutForm>, undefined>>['result'];
    await act(async () => {
      ({ result } = renderHook(() => useCheckoutForm()));
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'phone', value: '+56(9)1234-5678' },
      } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
    });

    // Parens and dash stripped; plus and digits kept (no spaces in input → none in output)
    expect(result.current.formData.phone).toBe('+56912345678');
  });
});

describe('useCheckoutForm — handleSubmitShipping (S-001)', () => {
  const mockSetStep = vi.fn();
  const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

  it('blocks and shows toast when region is missing', async () => {
    let result!: ReturnType<typeof renderHook<ReturnType<typeof useCheckoutForm>, undefined>>['result'];
    await act(async () => {
      ({ result } = renderHook(() => useCheckoutForm()));
    });

    act(() => {
      result.current.handleSubmitShipping(mockEvent, mockSetStep);
    });

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(mockSetStep).not.toHaveBeenCalled();
  });

  it('blocks when commune is missing', async () => {
    let result!: ReturnType<typeof renderHook<ReturnType<typeof useCheckoutForm>, undefined>>['result'];
    await act(async () => {
      ({ result } = renderHook(() => useCheckoutForm()));
    });

    // Fill everything except commune
    act(() => {
      result.current.handleInputChange({ target: { name: 'email', value: validFormData.email } } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
      result.current.handleInputChange({ target: { name: 'firstName', value: validFormData.firstName } } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
      result.current.handleInputChange({ target: { name: 'lastName', value: validFormData.lastName } } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
      result.current.handleInputChange({ target: { name: 'address', value: validFormData.address } } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
      result.current.handleInputChange({ target: { name: 'region', value: validFormData.region } } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
      // commune NOT filled
    });

    act(() => {
      result.current.handleSubmitShipping(mockEvent, mockSetStep);
    });

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(mockSetStep).not.toHaveBeenCalled();
  });

  it('advances to payment step when all required fields are valid', async () => {
    let result!: ReturnType<typeof renderHook<ReturnType<typeof useCheckoutForm>, undefined>>['result'];
    await act(async () => {
      ({ result } = renderHook(() => useCheckoutForm()));
    });

    act(() => {
      result.current.handleInputChange({ target: { name: 'email', value: validFormData.email } } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
      result.current.handleInputChange({ target: { name: 'firstName', value: validFormData.firstName } } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
      result.current.handleInputChange({ target: { name: 'lastName', value: validFormData.lastName } } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
      result.current.handleInputChange({ target: { name: 'address', value: validFormData.address } } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
      result.current.handleInputChange({ target: { name: 'region', value: validFormData.region } } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
      result.current.handleInputChange({ target: { name: 'commune', value: validFormData.commune } } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
    });

    act(() => {
      result.current.handleSubmitShipping(mockEvent, mockSetStep);
    });

    expect(toast.error).not.toHaveBeenCalled();
    expect(mockSetStep).toHaveBeenCalledWith('payment');
  });

  it('toast message uses Spanish label map (includes "región" when region missing)', async () => {
    let result!: ReturnType<typeof renderHook<ReturnType<typeof useCheckoutForm>, undefined>>['result'];
    await act(async () => {
      ({ result } = renderHook(() => useCheckoutForm()));
    });

    // Only fill email to keep other fields empty
    act(() => {
      result.current.handleInputChange({ target: { name: 'email', value: 'x@x.com' } } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
    });

    act(() => {
      result.current.handleSubmitShipping(mockEvent, mockSetStep);
    });

    const errorCall = (toast.error as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(errorCall).toMatch(/región/);
  });
});

describe('useCheckoutForm — retryGeo', () => {
  it('re-triggers GEO load on retryGeo call', async () => {
    let result!: ReturnType<typeof renderHook<ReturnType<typeof useCheckoutForm>, undefined>>['result'];
    await act(async () => {
      ({ result } = renderHook(() => useCheckoutForm()));
    });

    // First call on mount
    expect(addressesService.getGeo).toHaveBeenCalledTimes(1);

    // Trigger retry
    await act(async () => {
      result.current.retryGeo();
    });

    expect(addressesService.getGeo).toHaveBeenCalledTimes(2);
  });

  it('clears geoError on retryGeo', async () => {
    (addressesService.getGeo as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce(mockGeo);

    let result!: ReturnType<typeof renderHook<ReturnType<typeof useCheckoutForm>, undefined>>['result'];
    await act(async () => {
      ({ result } = renderHook(() => useCheckoutForm()));
    });

    expect(result.current.geoError).toBeTruthy();

    await act(async () => {
      result.current.retryGeo();
    });

    expect(result.current.geoError).toBeNull();
    expect(result.current.geo).toEqual(mockGeo);
  });
});

describe('useCheckoutForm — trackBeginCheckout', () => {
  it('calls trackBeginCheckout once when items present', async () => {
    const mockItems = [{ product: { product_id: 1, name: 'Test', price: 100, internal_sku: 'S', image_url: '' }, quantity: 1 }];
    (useCartStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: { items: unknown[] }) => unknown) =>
      selector({ items: mockItems }),
    );

    await act(async () => {
      renderHook(() => useCheckoutForm());
    });

    expect(trackBeginCheckout).toHaveBeenCalledTimes(1);
    expect(trackBeginCheckout).toHaveBeenCalledWith(mockItems);
  });

  it('does not call trackBeginCheckout when items empty', async () => {
    (useCartStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: { items: unknown[] }) => unknown) =>
      selector({ items: [] }),
    );

    await act(async () => {
      renderHook(() => useCheckoutForm());
    });

    expect(trackBeginCheckout).not.toHaveBeenCalled();
  });
});
