'use client';

/**
 * CATUI-ARCH + CATUI-SWAP — CatalogContainer.
 * SOLE consumer of useCatalogFilters + useCartStore within catalog/ui.
 * Receives products + collections from RSC page, delegates all UI to organisms.
 * Never imports from cart/ui or checkout/ui — only reads cart store for addItem.
 */

import { useCatalogFilters } from '@/features/catalog/application/use-catalog-filters';
import { useCartStore } from '@/app/lib/stores/cart.store';
import { CatalogLayout } from '@/features/catalog/ui/organisms/CatalogLayout';
import { ProductGrid } from '@/features/catalog/ui/organisms/ProductGrid';
import { FilterSidebarPanel } from '@/features/catalog/ui/organisms/FilterSidebarPanel';
import { MobileFilterDrawer } from '@/features/catalog/ui/organisms/MobileFilterDrawer';
import { CatalogControlsBar } from '@/features/catalog/ui/molecules/CatalogControlsBar';
import { LoadingMoreIndicator } from '@/features/catalog/ui/molecules/LoadingMoreIndicator';
import { AllProductsShown } from '@/features/catalog/ui/molecules/AllProductsShown';
import { ActiveFilterChips } from '@/features/catalog/ui/molecules/ActiveFilterChips';
import { PaginationProgress } from '@/features/catalog/ui/atoms/PaginationProgress';
import { CatalogEmptyState } from '@/features/catalog/ui/atoms/CatalogEmptyState';
import { emptyFilters } from '@/features/catalog/domain/catalog.types';
import type { SortOption } from '@/features/catalog/domain/catalog.types';
import type { Product, Collection } from '@/app/lib/types';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Mas reciente' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
  { value: 'name-asc', label: 'A-Z' },
  { value: 'name-desc', label: 'Z-A' },
];

interface CatalogContainerProps {
  products: Product[];
  collections?: Collection[];
}

export function CatalogContainer({ products, collections = [] }: CatalogContainerProps) {
  const hook = useCatalogFilters(products);
  const addItem = useCartStore((state) => state.addItem);

  // Build collection options from tree
  const collectionOptions = collections.flatMap((universe) => [
    { label: universe.name, value: universe.slug },
    ...(universe.children ?? []).map((cat) => ({
      label: `  ${cat.name}`,
      value: cat.slug,
    })),
  ]);

  const handleAddToCart = (product: Product, qty: number) => {
    addItem(product, qty);
  };

  const handleRemoveFilter = (
    key: keyof Pick<typeof emptyFilters, 'collections' | 'materials' | 'styles'>,
    value: string
  ) => {
    const current = hook.filters[key];
    hook.onFiltersChange({
      ...hook.filters,
      [key]: current.filter((v) => v !== value),
    });
  };

  const sidebar = (
    <FilterSidebarPanel
      filters={hook.filters}
      materialOptions={hook.materialOptions}
      styleOptions={hook.styleOptions}
      collectionOptions={collectionOptions}
      minPrice={hook.minPrice}
      maxPrice={hook.maxPrice}
      onFiltersChange={hook.onFiltersChange}
    />
  );

  const grid = (
    <>
      {/* Controls bar */}
      <CatalogControlsBar
        count={hook.totalCount}
        viewMode={hook.viewMode}
        sortValue={hook.sortOption}
        sortOptions={SORT_OPTIONS}
        onViewModeChange={hook.onViewModeChange}
        onSortChange={hook.onSortChange}
        onFilterOpen={() => hook.setFilterOpen(true)}
        activeFilterCount={hook.activeFilterCount}
      />

      {/* Active filter chips */}
      <ActiveFilterChips
        filters={hook.filters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={() => hook.onFiltersChange({ ...emptyFilters })}
      />

      {/* Product grid */}
      <ProductGrid
        products={hook.visibleProducts}
        onAddToCart={handleAddToCart}
        emptyState={
          <CatalogEmptyState
            onClearFilters={() => hook.onFiltersChange({ ...emptyFilters })}
          />
        }
        onReachEnd={hook.loadMore}
        viewMode={hook.viewMode}
      />

      {/* Progress + loading indicators */}
      {hook.hasMore && hook.visibleProducts.length > 0 && (
        <div className="mt-12 sm:mt-16">
          <PaginationProgress
            visible={hook.visibleCount}
            total={hook.totalCount}
            onLoadMore={hook.loadMore}
          />
          {hook.isLoadingMore && <LoadingMoreIndicator />}
        </div>
      )}

      {!hook.hasMore && hook.totalCount > 24 && <AllProductsShown />}
    </>
  );

  return (
    <>
      <CatalogLayout sidebar={sidebar} grid={grid} />

      {/* Mobile filter drawer — outside layout so it overlays correctly */}
      <MobileFilterDrawer
        isOpen={hook.isFilterOpen}
        onClose={() => hook.setFilterOpen(false)}
      >
        <FilterSidebarPanel
          filters={hook.filters}
          materialOptions={hook.materialOptions}
          styleOptions={hook.styleOptions}
          collectionOptions={collectionOptions}
          minPrice={hook.minPrice}
          maxPrice={hook.maxPrice}
          onFiltersChange={hook.onFiltersChange}
        />
      </MobileFilterDrawer>
    </>
  );
}
