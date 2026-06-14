'use client';

/**
 * CATUI-HOOK — Application hook for catalog filtering, sorting, pagination, and URL sync.
 *
 * Owns all stateful catalog logic so CatalogContainer stays a thin composer.
 * Domain-free of React — filterProducts and sortProducts are pure functions from domain.
 * DOM-free — IntersectionObserver lives in ProductGrid organism (design ADR #4).
 *
 * Key responsibility:
 *   Product.productCollections[].collection.slug -> collectionSlugs projection.
 *   The domain filterProducts uses CatalogProduct.tags (string[]).
 *   This hook builds a CatalogProduct-compatible shape from full Product type
 *   by projecting productCollections into tags, preserving the old
 *   productMatchesCollections logic exactly (collectionSlugs parity).
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { filterProducts, sortProducts } from '@/features/catalog/domain/catalog.rules';
import type { CatalogProduct, ActiveFilters, SortOption } from '@/features/catalog/domain/catalog.types';
import { emptyFilters } from '@/features/catalog/domain/catalog.types';
import { trackViewItemList } from '@/app/lib/analytics';
import type { Product } from '@/app/lib/types';

const PRODUCTS_PER_BATCH = 24;

type ViewMode = 'grid-3' | 'grid-4' | 'list';

// ─── Pure URL utils (no DOM dependency) ──────────────────────────────────────

/** Parse ActiveFilters from URL search params. Mirrors CatalogClient inline logic exactly. */
export const parseFiltersFromParams = (params: URLSearchParams): ActiveFilters => ({
  collections: params.get('col')?.split(',').filter(Boolean) ?? [],
  materials: params.get('mat')?.split(',').filter(Boolean) ?? [],
  styles: params.get('sty')?.split(',').filter(Boolean) ?? [],
  priceMin: Number(params.get('pmin')) || 0,
  priceMax: Number(params.get('pmax')) || Infinity,
});

/** Serialize ActiveFilters + SortOption to URL search params. Mirrors CatalogClient exactly. */
export const filtersToParams = (filters: ActiveFilters, sort: SortOption): URLSearchParams => {
  const params = new URLSearchParams();
  if (filters.collections.length) params.set('col', filters.collections.join(','));
  if (filters.materials.length) params.set('mat', filters.materials.join(','));
  if (filters.styles.length) params.set('sty', filters.styles.join(','));
  if (filters.priceMin > 0) params.set('pmin', String(filters.priceMin));
  if (filters.priceMax > 0 && filters.priceMax < Infinity) params.set('pmax', String(filters.priceMax));
  if (sort !== 'newest') params.set('sort', sort);
  return params;
};

// ─── collectionSlugs projection ──────────────────────────────────────────────

/**
 * Projects a full Product into a CatalogProduct-compatible shape.
 * CRITICAL: merges productCollections[].collection.slug into tags so that
 * domain filterProducts(tags) produces identical results to the old
 * inline productMatchesCollections(product, slugs) check.
 */
const projectToCatalogProduct = (p: Product): CatalogProduct => {
  const collectionSlugs: string[] = (p.productCollections ?? [])
    .map((pc) => pc.collection?.slug)
    .filter((slug): slug is string => Boolean(slug));

  const existingTags = p.tags ?? [];
  const mergedTags = Array.from(new Set([...existingTags, ...collectionSlugs]));

  return {
    product_id: p.product_id,
    name: p.name,
    price: p.price,
    compare_at_price: p.compare_at_price,
    image_url: p.image_url,
    slug: p.slug ?? '',
    stock: p.stock,
    material: p.material,
    style: p.style,
    tags: mergedTags,
    category: p.category ?? { name: '' },
  };
};

// ─── Hook return type ─────────────────────────────────────────────────────────

export interface UseCatalogFiltersResult {
  // State
  filters: ActiveFilters;
  sortOption: SortOption;
  viewMode: ViewMode;
  isFilterOpen: boolean;
  visibleCount: number;
  isLoadingMore: boolean;
  // Derived
  visibleProducts: Product[];
  totalCount: number;
  hasMore: boolean;
  progressPercent: number;
  activeFilterCount: number;
  // Facets
  materialOptions: string[];
  styleOptions: string[];
  minPrice: number;
  maxPrice: number;
  // Handlers
  onFiltersChange: (filters: ActiveFilters) => void;
  onSortChange: (sort: SortOption) => void;
  onViewModeChange: (mode: ViewMode) => void;
  setFilterOpen: (open: boolean) => void;
  loadMore: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCatalogFilters = (
  products: Product[],
): UseCatalogFiltersResult => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] = useState<ActiveFilters>(() =>
    parseFiltersFromParams(searchParams)
  );
  const [sortOption, setSortOption] = useState<SortOption>(
    () => (searchParams.get('sort') as SortOption) || 'newest'
  );
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid-3');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const cooldownRef = useRef(false);

  // ─── URL sync ────────────────────────────────────────────────────────────

  const syncURL = useCallback(
    (f: ActiveFilters, s: SortOption) => {
      const params = filtersToParams(f, s);
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      router.replace(url, { scroll: false });
    },
    [router, pathname]
  );

  // ─── Handlers ────────────────────────────────────────────────────────────

  const onFiltersChange = useCallback(
    (newFilters: ActiveFilters) => {
      setFilters(newFilters);
      setVisibleCount(PRODUCTS_PER_BATCH);
      syncURL(newFilters, sortOption);
    },
    [sortOption, syncURL]
  );

  const onSortChange = useCallback(
    (newSort: SortOption) => {
      setSortOption(newSort);
      setVisibleCount(PRODUCTS_PER_BATCH);
      syncURL(filters, newSort);
    },
    [filters, syncURL]
  );

  const loadMore = useCallback(() => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + PRODUCTS_PER_BATCH);
      setIsLoadingMore(false);
      cooldownRef.current = false;
    }, 300);
  }, []);

  const onViewModeChange = useCallback((mode: ViewMode) => setViewMode(mode), []);

  // ─── GA4 track once per mount ─────────────────────────────────────────────

  const listTracked = useRef(false);
  useEffect(() => {
    if (!listTracked.current && products.length > 0) {
      trackViewItemList('catalogo', products.slice(0, PRODUCTS_PER_BATCH));
      listTracked.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Facet derivation (memoized) ──────────────────────────────────────────

  const { materialOptions, styleOptions, minPrice, maxPrice } = useMemo(() => {
    const materialSet = new Set<string>();
    const styleSet = new Set<string>();
    let min = Infinity;
    let max = 0;

    for (const p of products) {
      if (p.material) materialSet.add(p.material);
      if (p.style) styleSet.add(p.style);
      const price = p.price || 0;
      if (price > 0) {
        if (price < min) min = price;
        if (price > max) max = price;
      }
    }

    return {
      materialOptions: Array.from(materialSet),
      styleOptions: Array.from(styleSet),
      minPrice: min === Infinity ? 0 : min,
      maxPrice: max || 0,
    };
  }, [products]);

  // ─── filteredAndSorted via domain (CATUI-FIX-DOMAIN) ─────────────────────

  const filteredAndSorted = useMemo(() => {
    // Project Product[] to CatalogProduct[] merging collectionSlugs into tags
    const projected = products.map(projectToCatalogProduct);

    // Build domain-compatible CatalogFilter from ActiveFilters
    const domainFilters = {
      collections: filters.collections.length > 0 ? filters.collections : undefined,
      materials: filters.materials.length > 0 ? filters.materials : undefined,
      styles: filters.styles.length > 0 ? filters.styles : undefined,
      priceMin: filters.priceMin > 0 ? filters.priceMin : undefined,
      priceMax: filters.priceMax > 0 && filters.priceMax < Infinity ? filters.priceMax : undefined,
    };

    const filtered = filterProducts(projected, domainFilters);
    const sorted = sortProducts(filtered, sortOption);

    // Map back to Product[] for consumers (preserve original Product shape)
    return sorted.map((cp) => {
      const original = products.find((p) => p.product_id === cp.product_id);
      return original ?? (cp as unknown as Product);
    });
  }, [products, filters, sortOption]);

  // ─── Pagination slice ─────────────────────────────────────────────────────

  const visibleProducts = filteredAndSorted.slice(0, visibleCount);
  const totalCount = filteredAndSorted.length;
  const hasMore = visibleCount < totalCount;
  const progressPercent =
    totalCount > 0 ? Math.min(100, (visibleCount / totalCount) * 100) : 100;

  // ─── Active filter count ──────────────────────────────────────────────────

  const activeFilterCount =
    filters.collections.length +
    filters.materials.length +
    filters.styles.length +
    (filters.priceMin > 0 || (filters.priceMax > 0 && filters.priceMax < Infinity) ? 1 : 0);

  return {
    filters,
    sortOption,
    viewMode,
    isFilterOpen,
    visibleCount,
    isLoadingMore,
    visibleProducts,
    totalCount,
    hasMore,
    progressPercent,
    activeFilterCount,
    materialOptions,
    styleOptions,
    minPrice,
    maxPrice,
    onFiltersChange,
    onSortChange,
    onViewModeChange,
    setFilterOpen: setIsFilterOpen,
    loadMore,
  };
};
