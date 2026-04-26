'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';
import { trackSearch, trackViewItemList } from '../lib/analytics';
import type { SearchResponse } from '../lib/types';

interface SearchResultsClientProps {
  results: SearchResponse | null;
  query: string;
  currentPage: number;
  currentSort: string;
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
  { value: 'newest', label: 'Mas recientes' },
  { value: 'name-asc', label: 'A - Z' },
] as const;

const PRODUCTS_PER_PAGE = 24;

export default function SearchResultsClient({
  results,
  query,
  currentPage,
  currentSort,
}: SearchResultsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // GA4 search + view_item_list por query (no por re-render).
  // Si el user pagina o cambia sort, es la misma busqueda - no re-emit search,
  // pero si re-emit view_item_list de la nueva tanda visible.
  const lastTrackedQuery = useRef<string | null>(null);
  useEffect(() => {
    if (!query) return;
    if (lastTrackedQuery.current !== query) {
      trackSearch(query);
      lastTrackedQuery.current = query;
    }
    if (results?.data && results.data.length > 0) {
      trackViewItemList(`search:${query}`, results.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, currentPage, currentSort]);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const handleSortChange = (sort: string) => {
    updateParams({ sort: sort === 'relevance' ? undefined : sort, page: undefined });
  };

  const handlePageChange = (page: number) => {
    updateParams({ page: page === 1 ? undefined : String(page) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // No query entered
  if (!query) {
    return (
      <div className="text-center py-16">
        <svg
          className="w-16 h-16 text-pearl-300 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h2 className="text-lg text-obsidian-800 mb-2">Busca lo que necesites</h2>
        <p className="text-sm text-platinum-500 max-w-md mx-auto">
          Escribe el nombre de un producto, material o estilo para encontrar lo que buscas
        </p>
      </div>
    );
  }

  // No results
  if (!results || results.total === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 text-pearl-300 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-lg text-obsidian-800 mb-2">
          No encontramos resultados para &ldquo;{query}&rdquo;
        </h2>
        <p className="text-sm text-platinum-500 mb-6 max-w-md mx-auto">
          Revisa la ortografia o intenta con otras palabras
        </p>

        {/* Suggestions */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {['Collares', 'Anillos', 'Aros', 'Plata 925'].map((suggestion) => (
            <Link
              key={suggestion}
              href={`/buscar?q=${encodeURIComponent(suggestion)}`}
              className="px-4 py-2 bg-white border border-pearl-200 rounded-full text-sm text-obsidian-800 hover:border-amber-gold-400 hover:text-amber-gold-600 transition-colors"
            >
              {suggestion}
            </Link>
          ))}
        </div>

        {/* CTA to catalog */}
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 px-6 py-3 bg-obsidian-900 text-white text-sm rounded-lg hover:bg-obsidian-800 transition-colors"
        >
          Explorar todo el catalogo
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    );
  }

  // Has results
  const totalPages = Math.ceil(results.total / PRODUCTS_PER_PAGE);

  return (
    <div>
      {/* Sort bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <p className="text-sm text-platinum-600" aria-live="polite">
          Mostrando {(currentPage - 1) * PRODUCTS_PER_PAGE + 1}–{Math.min(currentPage * PRODUCTS_PER_PAGE, results.total)} de {results.total}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="search-sort" className="text-xs text-platinum-500 whitespace-nowrap">
            Ordenar por
          </label>
          <select
            id="search-sort"
            value={currentSort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="text-sm border border-pearl-300 rounded-lg px-3 py-1.5 bg-white text-obsidian-900 focus:border-amber-gold-500 focus-visible:ring-2 focus-visible:ring-amber-gold-500/30 focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {results.data.map((product) => (
          <ProductCard
            key={product.product_id}
            product={product}
            hoverImage={product.images?.[1]}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1 mt-10" aria-label="Paginacion de resultados">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg border border-pearl-200 text-obsidian-800 hover:bg-pearl-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Pagina anterior"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {generatePageNumbers(currentPage, totalPages).map((pageNum, i) =>
            pageNum === null ? (
              <span key={`ellipsis-${i}`} className="px-2 text-platinum-400" aria-hidden="true">
                ...
              </span>
            ) : (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  pageNum === currentPage
                    ? 'bg-obsidian-900 text-white'
                    : 'border border-pearl-200 text-obsidian-800 hover:bg-pearl-100'
                }`}
                aria-current={pageNum === currentPage ? 'page' : undefined}
                aria-label={`Pagina ${pageNum}`}
              >
                {pageNum}
              </button>
            ),
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-lg border border-pearl-200 text-obsidian-800 hover:bg-pearl-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Pagina siguiente"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </nav>
      )}
    </div>
  );
}

function generatePageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | null)[] = [1];

  if (current > 3) pages.push(null);

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push(null);

  pages.push(total);
  return pages;
}
