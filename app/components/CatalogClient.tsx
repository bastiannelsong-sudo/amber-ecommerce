'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import FilterSidebar, { type ActiveFilters, emptyFilters } from './FilterSidebar';
import ProductCard from './ProductCard';
import { trackViewItemList } from '../lib/analytics';
import type { Product, Collection } from '../lib/types';

type ViewMode = 'grid-3' | 'grid-4' | 'list';
type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

const PRODUCTS_PER_BATCH = 24;

interface CatalogClientProps {
  products: Product[];
  collections?: Collection[];
}

/** Parse filters from URL search params */
function parseFiltersFromParams(params: URLSearchParams): ActiveFilters {
  return {
    collections: params.get('col')?.split(',').filter(Boolean) || [],
    materials: params.get('mat')?.split(',').filter(Boolean) || [],
    styles: params.get('sty')?.split(',').filter(Boolean) || [],
    priceMin: Number(params.get('pmin')) || 0,
    priceMax: Number(params.get('pmax')) || 0,
  };
}

/** Serialize filters to URL search params */
function filtersToParams(filters: ActiveFilters, sort: SortOption): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.collections.length) params.set('col', filters.collections.join(','));
  if (filters.materials.length) params.set('mat', filters.materials.join(','));
  if (filters.styles.length) params.set('sty', filters.styles.join(','));
  if (filters.priceMin > 0) params.set('pmin', String(filters.priceMin));
  if (filters.priceMax > 0) params.set('pmax', String(filters.priceMax));
  if (sort !== 'newest') params.set('sort', sort);
  return params;
}

/** Check if a product belongs to any of the given collection slugs */
function productMatchesCollections(product: Product, slugs: string[]): boolean {
  if (!product.productCollections || product.productCollections.length === 0) return false;
  return product.productCollections.some(
    (pc) => pc.collection && slugs.includes(pc.collection.slug)
  );
}

export default function CatalogClient({ products, collections }: CatalogClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize state from URL
  const [filters, setFilters] = useState<ActiveFilters>(() => parseFiltersFromParams(searchParams));
  const [sortOption, setSortOption] = useState<SortOption>(
    () => (searchParams.get('sort') as SortOption) || 'newest'
  );
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid-3');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const cooldownRef = useRef(false);
  // Rastrear desde qué índice animar los productos nuevos
  const animateFromRef = useRef(0);

  // Sync state to URL (without full page reload)
  const syncURL = useCallback(
    (f: ActiveFilters, s: SortOption) => {
      const params = filtersToParams(f, s);
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      router.replace(url, { scroll: false });
    },
    [router, pathname]
  );

  const handleFiltersChange = useCallback(
    (newFilters: ActiveFilters) => {
      setFilters(newFilters);
      setVisibleCount(PRODUCTS_PER_BATCH);
      animateFromRef.current = 0;
      syncURL(newFilters, sortOption);
    },
    [sortOption, syncURL]
  );

  const handleSortChange = useCallback(
    (newSort: SortOption) => {
      setSortOption(newSort);
      setVisibleCount(PRODUCTS_PER_BATCH);
      animateFromRef.current = 0;
      syncURL(filters, newSort);
    },
    [filters, syncURL]
  );

  const loadMore = useCallback(() => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => {
        animateFromRef.current = prev;
        return prev + PRODUCTS_PER_BATCH;
      });
      setIsLoadingMore(false);
      cooldownRef.current = false;
    }, 300);
  }, []);

  // GA4 view_item_list - una vez por mount con la primera tanda visible.
  const listTracked = useRef(false);
  useEffect(() => {
    if (!listTracked.current && products.length > 0) {
      trackViewItemList('catalogo', products.slice(0, PRODUCTS_PER_BATCH));
      listTracked.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // IntersectionObserver: carga automática al acercarse al final
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !cooldownRef.current) {
          loadMore();
        }
      },
      { rootMargin: '400px' } // Empieza a cargar 400px antes de llegar al final
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // Apply filters + sorting
  const filteredAndSorted = useMemo(() => {
    let result = products;

    // Filter by collections
    if (filters.collections.length > 0) {
      result = result.filter((p) => productMatchesCollections(p, filters.collections));
    }

    // Filter by material
    if (filters.materials.length > 0) {
      result = result.filter((p) => p.material && filters.materials.includes(p.material));
    }

    // Filter by style
    if (filters.styles.length > 0) {
      result = result.filter((p) => p.style && filters.styles.includes(p.style));
    }

    // Filter by price range
    if (filters.priceMin > 0) {
      result = result.filter((p) => (p.price || 0) >= filters.priceMin);
    }
    if (filters.priceMax > 0) {
      result = result.filter((p) => (p.price || 0) <= filters.priceMax);
    }

    // Sort
    return [...result].sort((a, b) => {
      switch (sortOption) {
        case 'price-asc':
          return (a.price || 0) - (b.price || 0);
        case 'price-desc':
          return (b.price || 0) - (a.price || 0);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
  }, [products, filters, sortOption]);

  // Load more slicing
  const visibleProducts = filteredAndSorted.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAndSorted.length;
  const progressPercent = filteredAndSorted.length > 0
    ? Math.min(100, (visibleCount / filteredAndSorted.length) * 100)
    : 100;

  const activeFilterCount =
    filters.collections.length +
    filters.materials.length +
    filters.styles.length +
    (filters.priceMin > 0 || filters.priceMax > 0 ? 1 : 0);

  const gridClass = {
    'grid-3': 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3',
    'grid-4': 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
    'list': 'grid-cols-1',
  }[viewMode];

  const filterSidebarProps = {
    collections,
    products,
    activeFilters: filters,
    onFiltersChange: handleFiltersChange,
  };

  return (
    <>
      {/* Controls Bar */}
      <div className="bg-white shadow-luxury rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 flex items-center justify-between gap-4">
        {/* Left: Product count + filter toggle (mobile) + view options */}
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap flex-1">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 border border-pearl-300 rounded-lg text-sm text-obsidian-700 hover:border-amber-gold-500 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            <span>Filtros</span>
            {activeFilterCount > 0 && (
              <span className="bg-amber-gold-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-medium">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="hidden sm:block">
            <h2 className="text-xl sm:text-2xl font-light text-obsidian-900" style={{ fontFamily: 'var(--font-cormorant)' }}>
              {filteredAndSorted.length} Producto{filteredAndSorted.length !== 1 ? 's' : ''}
            </h2>
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center gap-2 border border-pearl-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid-3')}
              className={`p-2 rounded transition-colors cursor-pointer ${
                viewMode === 'grid-3' ? 'bg-amber-gold-500 text-white' : 'text-platinum-600 hover:bg-pearl-100'
              }`}
              aria-label="Vista 3 columnas"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid-4')}
              className={`p-2 rounded transition-colors cursor-pointer ${
                viewMode === 'grid-4' ? 'bg-amber-gold-500 text-white' : 'text-platinum-600 hover:bg-pearl-100'
              }`}
              aria-label="Vista 4 columnas"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-amber-gold-500 text-white' : 'text-platinum-600 hover:bg-pearl-100'
              }`}
              aria-label="Vista lista"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right: Sort dropdown */}
        <div className="flex items-center gap-2 sm:gap-4">
          <label htmlFor="sort-products" className="text-sm text-platinum-600 uppercase tracking-wide whitespace-nowrap hidden sm:block">
            Ordenar por:
          </label>
          <select
            id="sort-products"
            aria-label="Ordenar por"
            value={sortOption}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="px-3 sm:px-4 py-2.5 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none text-sm bg-white rounded-lg min-w-0 sm:min-w-[200px] cursor-pointer"
          >
            <option value="newest">Mas reciente</option>
            <option value="price-asc">Menor precio</option>
            <option value="price-desc">Mayor precio</option>
            <option value="name-asc">A-Z</option>
            <option value="name-desc">Z-A</option>
          </select>
        </div>
      </div>

      {/* Active filter tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-platinum-600 uppercase tracking-wide">Filtros activos:</span>
          {filters.collections.map((slug) => (
            <FilterTag
              key={`col-${slug}`}
              label={slug}
              onRemove={() => handleFiltersChange({ ...filters, collections: filters.collections.filter((c) => c !== slug) })}
            />
          ))}
          {filters.materials.map((mat) => (
            <FilterTag
              key={`mat-${mat}`}
              label={mat}
              onRemove={() => handleFiltersChange({ ...filters, materials: filters.materials.filter((m) => m !== mat) })}
            />
          ))}
          {filters.styles.map((sty) => (
            <FilterTag
              key={`sty-${sty}`}
              label={sty}
              onRemove={() => handleFiltersChange({ ...filters, styles: filters.styles.filter((s) => s !== sty) })}
            />
          ))}
          {(filters.priceMin > 0 || filters.priceMax > 0) && (
            <FilterTag
              label={`$${filters.priceMin.toLocaleString('es-CL')} - $${filters.priceMax > 0 ? filters.priceMax.toLocaleString('es-CL') : '∞'}`}
              onRemove={() => handleFiltersChange({ ...filters, priceMin: 0, priceMax: 0 })}
            />
          )}
          <button
            onClick={() => handleFiltersChange(emptyFilters)}
            className="text-xs text-amber-gold-500 hover:text-amber-gold-600 uppercase tracking-wide font-medium ml-2 cursor-pointer"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {/* Mobile Filter Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsFilterOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl overflow-y-auto animate-fade-in">
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-pearl-200">
              <h2
                className="text-xl font-light text-obsidian-900"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Filtros
              </h2>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-obsidian-700 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <FilterSidebar {...filterSidebarProps} />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-pearl-200 p-4">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="w-full py-3.5 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors cursor-pointer"
              >
                Ver {filteredAndSorted.length} Producto{filteredAndSorted.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Filters Sidebar - Desktop only */}
        <div className="hidden lg:block lg:sticky lg:top-24 self-start">
          <FilterSidebar {...filterSidebarProps} />
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {visibleProducts.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-16 h-16 text-platinum-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-xl font-light text-obsidian-900 mb-2" style={{ fontFamily: 'var(--font-cormorant)' }}>
                Sin resultados
              </h3>
              <p className="text-sm text-platinum-600 mb-6">
                No encontramos productos con los filtros seleccionados.
              </p>
              <button
                onClick={() => handleFiltersChange(emptyFilters)}
                className="px-6 py-3 bg-obsidian-900 text-white text-xs uppercase tracking-widest hover:bg-amber-gold-500 transition-colors cursor-pointer"
              >
                Limpiar Filtros
              </button>
            </div>
          ) : (
            <div className={`grid ${gridClass} gap-3 gap-y-6 sm:gap-6 sm:gap-y-10 lg:gap-8`}>
              {visibleProducts.map((product, index) => {
                const isNew = index >= animateFromRef.current;
                // Stagger: 50ms por item dentro del batch, máximo 600ms
                const staggerDelay = isNew
                  ? Math.min((index - animateFromRef.current) * 50, 600)
                  : 0;

                return (
                  <div
                    key={product.product_id}
                    className={isNew ? 'catalog-item-enter' : undefined}
                    style={isNew ? { animationDelay: `${staggerDelay}ms` } as React.CSSProperties : undefined}
                  >
                    <ProductCard product={product} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Infinite Scroll Sentinel + Loading indicator */}
          {hasMore && visibleProducts.length > 0 && (
            <div className="mt-12 sm:mt-16">
              {/* Barra de progreso */}
              <div className="max-w-xs mx-auto mb-4">
                <div className="h-[2px] bg-pearl-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-gold-400 to-amber-gold-600 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <p className="text-center text-[11px] text-platinum-500 tracking-wide mb-6">
                {Math.min(visibleCount, filteredAndSorted.length)} de {filteredAndSorted.length} productos
              </p>

              {/* Loading indicator */}
              {isLoadingMore && (
                <div className="flex items-center justify-center gap-2.5 py-6">
                  <span className="catalog-dot w-1.5 h-1.5 bg-amber-gold-500/80 rounded-full" />
                  <span className="catalog-dot w-1.5 h-1.5 bg-amber-gold-500/80 rounded-full" style={{ animationDelay: '160ms' }} />
                  <span className="catalog-dot w-1.5 h-1.5 bg-amber-gold-500/80 rounded-full" style={{ animationDelay: '320ms' }} />
                </div>
              )}

              {/* Sentinel invisible - IntersectionObserver lo detecta */}
              <div ref={sentinelRef} className="h-px" aria-hidden="true" />
            </div>
          )}

          {/* Mensaje final cuando se muestran todos */}
          {!hasMore && filteredAndSorted.length > PRODUCTS_PER_BATCH && (
            <div className="mt-12 sm:mt-16 text-center">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pearl-300 to-transparent" />
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-gold-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-platinum-500 font-medium">
                    Has visto todos los productos
                  </span>
                  <svg className="w-4 h-4 text-amber-gold-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pearl-300 to-transparent" />
              </div>
              <p className="text-sm text-platinum-600">
                {filteredAndSorted.length} producto{filteredAndSorted.length !== 1 ? 's' : ''} en total
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pearl-100 border border-pearl-200 text-xs text-obsidian-700 capitalize">
      {label}
      <button
        onClick={onRemove}
        className="text-platinum-500 hover:text-red-500 transition-colors cursor-pointer"
        aria-label={`Quitar filtro ${label}`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}
