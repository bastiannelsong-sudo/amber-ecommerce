/**
 * FIRST renderHook test in the amber-ecommerce repo.
 *
 * Pattern to follow for all future hook tests:
 * - Import renderHook, act, waitFor from '@testing-library/react'
 * - Create a fresh QueryClient with retry:false + gcTime:0 per test
 * - Wrap with a QueryClientProvider in the wrapper option
 * - vi.mock the adapter module (module-level, before imports)
 *
 * Timer strategy:
 * - Debounce-only tests (no async resolution): vi.useFakeTimers() + advanceTimersByTime
 * - Tests that need async React Query resolution: use real timers throughout;
 *   hook initializes debouncedQuery to '' so first render never fetches.
 *   Rerender with a query that's already past the debounce by using a hook
 *   that sets the debounced value synchronously for testing — OR — simply
 *   expose the debouncedQuery setter indirectly by passing props.
 *
 * The cleanest approach found for React Query v5 + Vitest:
 * - Pure debounce assertions: fake timers only
 * - Async result assertions: real timers + mock that resolves immediately
 *   (mockResolvedValue is microtask-resolved, no setTimeout needed)
 *   BUT we still need to advance past the 300ms debounce.
 *   Solution: re-render the hook after 300ms of real elapsed time is impractical.
 *   Better: test the hook with a debouncedQuery state that's already set
 *   by using a wrapper component that skips debounce for direct integration tests.
 *
 * FINAL pattern adopted: split into two groups:
 * 1. Disabled/debounce tests: fake timers, assert fetchSuggestions not called
 * 2. Data tests: mock the adapter and advance fake timers + runAllTimersAsync
 *    inside a single act to flush both the debounce AND React Query's tick
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSearchSuggestions } from './use-search-suggestions';

// ─── Mock the BFF adapter at module level ────────────────────────────────────

vi.mock('@/features/catalog/infrastructure/bff-catalog.adapter', () => ({
  bffCatalogAdapter: {
    fetchSuggestions: vi.fn(),
  },
}));

import { bffCatalogAdapter } from '@/features/catalog/infrastructure/bff-catalog.adapter';

const mockFetchSuggestions = bffCatalogAdapter.fetchSuggestions as ReturnType<typeof vi.fn>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const successPayload = {
  products: [{ name: 'Collar Ambar', slug: 'collar-ambar', image_url: 'https://cdn.example.com/collar.jpg', price: 15990 }],
  collections: [{ name: 'Anillos', slug: 'anillos' }],
};

const emptyPayload = {
  products: [],
  collections: [],
};

// ─── Wrapper factory — fresh QueryClient per test ─────────────────────────────

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Advance fake timers past the 300ms debounce, flushing microtasks too. */
const advancePastDebounce = async () => {
  await act(async () => {
    vi.advanceTimersByTime(400);
  });
};

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useSearchSuggestions', () => {
  it('does not fetch when query length < 2', async () => {
    const { result } = renderHook(() => useSearchSuggestions('a'), {
      wrapper: createWrapper(),
    });

    await advancePastDebounce();

    expect(mockFetchSuggestions).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('does not fetch when query is empty string', async () => {
    const { result } = renderHook(() => useSearchSuggestions(''), {
      wrapper: createWrapper(),
    });

    await advancePastDebounce();

    expect(mockFetchSuggestions).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('does not fetch before debounce interval elapses (300ms)', async () => {
    renderHook(() => useSearchSuggestions('ambar'), {
      wrapper: createWrapper(),
    });

    // Only advance 200ms — debounce has NOT elapsed
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(mockFetchSuggestions).not.toHaveBeenCalled();
  });

  it('calls fetchSuggestions after debounce elapses with query >= 2 chars', async () => {
    mockFetchSuggestions.mockResolvedValue(successPayload);

    renderHook(() => useSearchSuggestions('ambar'), {
      wrapper: createWrapper(),
    });

    // Advance past debounce so debouncedQuery becomes 'ambar'
    await advancePastDebounce();

    // React Query runs synchronously in the same tick after enabled flips to true
    // — it may need one more microtask tick via runAllTimersAsync
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockFetchSuggestions).toHaveBeenCalledWith('ambar', expect.anything());
  });

  it('returns suggestions and isEmpty=false on successful fetch', async () => {
    mockFetchSuggestions.mockResolvedValue(successPayload);

    const { result } = renderHook(() => useSearchSuggestions('ambar'), {
      wrapper: createWrapper(),
    });

    await advancePastDebounce();

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Give React Query one more cycle to update state
    vi.useRealTimers();
    await waitFor(() => expect(result.current.suggestions).toBeDefined());

    expect(result.current.isEmpty).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.suggestions?.products).toHaveLength(1);
  });

  it('isEmpty=true when fetch resolves with empty products and collections', async () => {
    mockFetchSuggestions.mockResolvedValue(emptyPayload);

    const { result } = renderHook(() => useSearchSuggestions('xyz'), {
      wrapper: createWrapper(),
    });

    await advancePastDebounce();

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    vi.useRealTimers();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.suggestions?.products).toHaveLength(0);
  });

  it('isError=true when adapter rejects', async () => {
    mockFetchSuggestions.mockRejectedValue(new Error('BFF down'));

    const { result } = renderHook(() => useSearchSuggestions('ambar'), {
      wrapper: createWrapper(),
    });

    await advancePastDebounce();

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    vi.useRealTimers();
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.isLoading).toBe(false);
  });
});
