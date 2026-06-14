'use client';

import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { bffCatalogAdapter } from '@/features/catalog/infrastructure/bff-catalog.adapter';
import type { SearchSuggestions } from '@/features/catalog/domain/catalog.types';

const DEBOUNCE_MS = 300;

/**
 * React Query hook for catalog typeahead suggestions.
 *
 * Debounces the query by 300ms before enabling the fetch.
 * Only fetches when debouncedQuery.length >= 2.
 * Module-singleton DI: imports bffCatalogAdapter directly — testable via vi.mock.
 *
 * Sets the renderHook test precedent for this repo:
 * - QueryClientProvider with retry:false wrapper
 * - vi.mock adapter at module level
 * - vi.useFakeTimers() for debounce control
 */
export const useSearchSuggestions = (query: string) => {
  // Initialize to '' — debounce effect sets the value after 300ms.
  // This ensures first render is always disabled, matching SearchModal usage
  // where query always starts as '' and updates on user input.
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isError } = useQuery<SearchSuggestions>({
    queryKey: ['catalog', 'suggestions', debouncedQuery],
    queryFn: ({ signal }) => bffCatalogAdapter.fetchSuggestions(debouncedQuery, signal),
    enabled: debouncedQuery.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const isEmpty =
    !!data && data.products.length === 0 && data.collections.length === 0;

  return {
    suggestions: data,
    isLoading,
    isError,
    isEmpty,
  };
};
