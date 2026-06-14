import type { SearchSuggestions } from '@/features/catalog/domain/catalog.types';

/**
 * CatalogPort — application-layer contract for catalog data fetching.
 * Only one method in this slice; extended in future slices as consumers appear.
 * Infrastructure provides the concrete implementation (bff-catalog.adapter.ts).
 * Application layer depends on this interface, not on the adapter directly (DI).
 */
export interface CatalogPort {
  /**
   * Fetch typeahead suggestions for the given query string.
   * @param query   The search query (min 2 chars expected by callers).
   * @param signal  Optional AbortSignal forwarded from React Query queryFn ctx.
   */
  fetchSuggestions(query: string, signal?: AbortSignal): Promise<SearchSuggestions>;
}
