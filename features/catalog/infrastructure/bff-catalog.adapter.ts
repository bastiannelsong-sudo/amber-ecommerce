import { apiClient } from '@/app/lib/api-client';
import { mapSuggestions } from '@/features/catalog/application/catalog.mapper';
import type { CatalogPort } from '@/features/catalog/application/ports/CatalogPort';
import type { SearchSuggestions } from '@/features/catalog/domain/catalog.types';

/**
 * BFF implementation of CatalogPort using apiClient.
 *
 * Module-singleton default export — hook imports it directly (DI by module).
 * Testable via vi.mock('@/features/catalog/infrastructure/bff-catalog.adapter').
 *
 * THROWS on error — no dummy/empty fallback.
 * React Query needs a thrown error to set isError correctly.
 */
const fetchSuggestions = async (
  query: string,
  signal?: AbortSignal,
): Promise<SearchSuggestions> => {
  const { data } = await apiClient.get<SearchSuggestions>('/products/suggestions', {
    params: { q: query },
    signal,
  });
  return mapSuggestions(data as Parameters<typeof mapSuggestions>[0]);
};

export const bffCatalogAdapter: CatalogPort = {
  fetchSuggestions,
};
