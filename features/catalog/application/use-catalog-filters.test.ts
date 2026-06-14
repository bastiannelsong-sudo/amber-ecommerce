/**
 * CATUI-T2 — Tests for use-catalog-filters application hook.
 *
 * Mock strategy (per design ADR #8):
 *   vi.mock('next/navigation', ...) — useSearchParams, useRouter, usePathname
 *   vi.mock('@/app/lib/analytics', ...) — trackViewItemList
 *
 * Pattern: renderHook + act from @testing-library/react (same as use-cart-drawer).
 * No QueryClient needed — hook has no React Query.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCatalogFilters, parseFiltersFromParams } from './use-catalog-filters';
import type { Product } from '@/app/lib/types';

// ─── Mock next/navigation (per design ADR #8) ────────────────────────────────

const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/catalogo',
}));

// ─── Mock analytics ───────────────────────────────────────────────────────────

const mockTrackViewItemList = vi.fn();

vi.mock('@/app/lib/analytics', () => ({
  trackViewItemList: (...args: unknown[]) => mockTrackViewItemList(...args),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  product_id: 1,
  internal_sku: 'SKU-001',
  name: 'Collar Ambar',
  price: 15990,
  image_url: 'https://cdn.example.com/collar.jpg',
  stock: 5,
  stock_bodega: 2,
  cost: 8000,
  material: 'plata',
  ...overrides,
});

const products: Product[] = [
  makeProduct({ product_id: 1, material: 'plata', price: 100 }),
  makeProduct({ product_id: 2, material: 'oro', price: 300 }),
  makeProduct({ product_id: 3, material: 'plata', price: 200 }),
];

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useCatalogFilters', () => {
  describe('filter change updates visibleProducts and calls router.replace', () => {
    it('onFiltersChange({ materials: ["plata"] }) filters to only plata products', () => {
      const { result } = renderHook(() => useCatalogFilters(products));

      act(() => {
        result.current.onFiltersChange({
          collections: [],
          materials: ['plata'],
          styles: [],
          priceMin: 0,
          priceMax: Infinity,
        });
      });

      const materials = result.current.visibleProducts.map((p) => p.material);
      expect(materials.every((m) => m === 'plata')).toBe(true);
      expect(result.current.visibleProducts).toHaveLength(2);
    });

    it('onFiltersChange calls router.replace with materials=plata in URL', () => {
      const { result } = renderHook(() => useCatalogFilters(products));

      act(() => {
        result.current.onFiltersChange({
          collections: [],
          materials: ['plata'],
          styles: [],
          priceMin: 0,
          priceMax: Infinity,
        });
      });

      expect(mockReplace).toHaveBeenCalledTimes(1);
      const calledUrl: string = mockReplace.mock.calls[0][0];
      expect(calledUrl).toContain('mat=plata');
    });
  });

  describe('sort change reorders visibleProducts and calls router.replace', () => {
    it('onSortChange("price-asc") reorders cheapest first', () => {
      const { result } = renderHook(() => useCatalogFilters(products));

      act(() => {
        result.current.onSortChange('price-asc');
      });

      const prices = result.current.visibleProducts.map((p) => p.price);
      expect(prices).toEqual([100, 200, 300]);
    });

    it('onSortChange calls router.replace with sort=price-asc', () => {
      const { result } = renderHook(() => useCatalogFilters(products));

      act(() => {
        result.current.onSortChange('price-asc');
      });

      expect(mockReplace).toHaveBeenCalledTimes(1);
      const calledUrl: string = mockReplace.mock.calls[0][0];
      expect(calledUrl).toContain('sort=price-asc');
    });
  });

  describe('loadMore increments visibleCount', () => {
    it('loadMore increases visible products beyond initial batch when more products exist', async () => {
      // Need more products than PRODUCTS_PER_BATCH (24)
      const manyProducts = Array.from({ length: 30 }, (_, i) =>
        makeProduct({ product_id: i + 1, name: `Product ${i + 1}` })
      );

      const { result } = renderHook(() => useCatalogFilters(manyProducts));

      const initialVisible = result.current.visibleProducts.length;
      expect(result.current.hasMore).toBe(true);

      // Use fake timers scoped to this test only
      vi.useFakeTimers();
      try {
        await act(async () => {
          result.current.loadMore();
          vi.advanceTimersByTime(400);
        });
      } finally {
        vi.useRealTimers();
      }

      expect(result.current.visibleProducts.length).toBeGreaterThan(initialVisible);
    });

    it('hasMore is false when all products are visible', () => {
      // products fixture has only 3 items — well under the 24 batch size
      const { result } = renderHook(() => useCatalogFilters(products));
      expect(result.current.hasMore).toBe(false);
    });
  });

  describe('facet derivation from products', () => {
    it('materialOptions contains unique material values from products', () => {
      // products has 'plata' (x2) and 'oro' (x1)
      const { result } = renderHook(() => useCatalogFilters(products));

      const materialValues = result.current.materialOptions;
      expect(materialValues).toHaveLength(2);
      expect(materialValues).toContain('plata');
      expect(materialValues).toContain('oro');
    });

    it('materialOptions has no duplicates', () => {
      const productsWithDuplicates: Product[] = [
        makeProduct({ product_id: 1, material: 'plata' }),
        makeProduct({ product_id: 2, material: 'plata' }),
        makeProduct({ product_id: 3, material: 'oro' }),
      ];

      const { result } = renderHook(() => useCatalogFilters(productsWithDuplicates));

      const materialValues = result.current.materialOptions;
      const unique = new Set(materialValues);
      expect(unique.size).toBe(materialValues.length);
    });
  });

  describe('URL params initialize filters on mount', () => {
    it('parseFiltersFromParams correctly parses materials from URL', () => {
      // Pure function test — no hook, no navigation mock needed
      const params = new URLSearchParams('mat=plata&sort=price-asc');
      const filters = parseFiltersFromParams(params);

      expect(filters.materials).toEqual(['plata']);
    });

    it('parseFiltersFromParams correctly parses multi-value materials from URL', () => {
      const params = new URLSearchParams('mat=plata%2Coro');
      const filters = parseFiltersFromParams(params);

      expect(filters.materials).toEqual(['plata', 'oro']);
    });
  });

  describe('trackViewItemList fires exactly once on mount', () => {
    it('trackViewItemList called once on mount with non-empty products', () => {
      renderHook(() => useCatalogFilters(products));

      expect(mockTrackViewItemList).toHaveBeenCalledTimes(1);
      expect(mockTrackViewItemList).toHaveBeenCalledWith('catalogo', expect.any(Array));
    });

    it('trackViewItemList not called again on re-render', () => {
      const { rerender } = renderHook(() => useCatalogFilters(products));

      rerender();
      rerender();

      expect(mockTrackViewItemList).toHaveBeenCalledTimes(1);
    });
  });

  describe('activeFilterCount', () => {
    it('is 0 when no filters active', () => {
      const { result } = renderHook(() => useCatalogFilters(products));
      expect(result.current.activeFilterCount).toBe(0);
    });

    it('increments when materials filter is active', () => {
      const { result } = renderHook(() => useCatalogFilters(products));

      act(() => {
        result.current.onFiltersChange({
          collections: [],
          materials: ['plata'],
          styles: [],
          priceMin: 0,
          priceMax: Infinity,
        });
      });

      expect(result.current.activeFilterCount).toBeGreaterThan(0);
    });
  });
});
