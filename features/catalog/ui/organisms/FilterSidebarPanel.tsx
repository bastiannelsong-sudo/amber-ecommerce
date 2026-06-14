'use client';

/**
 * CATUI-ORG-1 — FilterSidebarPanel organism.
 * Pure presentational sidebar: composes FilterSection + FilterPriceRange + ActiveFilterChips.
 * Zero store/hook imports — all state via props.
 */

import { FilterSection } from '@/features/catalog/ui/molecules/FilterSection';
import { FilterPriceRange } from '@/features/catalog/ui/molecules/FilterPriceRange';
import { ActiveFilterChips } from '@/features/catalog/ui/molecules/ActiveFilterChips';
import type { ActiveFilters } from '@/features/catalog/domain/catalog.types';
import { emptyFilters } from '@/features/catalog/domain/catalog.types';

interface CollectionOption {
  label: string;
  value: string;
}

interface FilterSidebarPanelProps {
  filters: ActiveFilters;
  materialOptions: string[];
  styleOptions: string[];
  collectionOptions: CollectionOption[];
  minPrice: number;
  maxPrice: number;
  onFiltersChange: (filters: ActiveFilters) => void;
}

export function FilterSidebarPanel({
  filters,
  materialOptions,
  styleOptions,
  collectionOptions,
  minPrice,
  maxPrice,
  onFiltersChange,
}: FilterSidebarPanelProps) {
  const handleToggle = (
    key: 'collections' | 'materials' | 'styles',
    value: string
  ) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: updated });
  };

  const handleRemoveFilter = (
    key: keyof Pick<ActiveFilters, 'collections' | 'materials' | 'styles'>,
    value: string
  ) => {
    handleToggle(key, value);
  };

  const handleClearAll = () => {
    onFiltersChange({ ...emptyFilters });
  };

  const handlePriceChange = (min: number, max: number) => {
    onFiltersChange({ ...filters, priceMin: min, priceMax: max });
  };

  const activeCount =
    filters.collections.length +
    filters.materials.length +
    filters.styles.length +
    (filters.priceMin > 0 || (filters.priceMax > 0 && filters.priceMax < Infinity) ? 1 : 0);

  return (
    <aside className="w-full lg:w-72 space-y-8">
      {/* Filter header */}
      <div className="flex items-center justify-between pb-4 border-b border-pearl-200">
        <h2
          className="text-2xl font-light text-obsidian-900"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          Filtros
          {activeCount > 0 && (
            <span className="ml-2 text-sm font-medium text-amber-gold-500">({activeCount})</span>
          )}
        </h2>
        {activeCount > 0 && (
          <button
            onClick={handleClearAll}
            className="text-sm text-platinum-600 hover:text-amber-gold-500 transition-colors uppercase tracking-wide cursor-pointer"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Active filter chips */}
      <ActiveFilterChips
        filters={filters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAll}
      />

      {/* Price Range */}
      <FilterPriceRange
        min={minPrice}
        max={maxPrice}
        priceMin={filters.priceMin}
        priceMax={filters.priceMax}
        onPriceChange={handlePriceChange}
      />

      {/* Collection section */}
      {collectionOptions.length > 0 && (
        <FilterSection
          title="Coleccion"
          filterKey="collections"
          options={collectionOptions}
          activeValues={filters.collections}
          onChange={handleToggle}
          defaultOpen
        />
      )}

      {/* Material section */}
      {materialOptions.length > 0 && (
        <FilterSection
          title="Material"
          filterKey="materials"
          options={materialOptions.map((v) => ({ label: v, value: v }))}
          activeValues={filters.materials}
          onChange={handleToggle}
          defaultOpen
        />
      )}

      {/* Style section */}
      {styleOptions.length > 0 && (
        <FilterSection
          title="Estilo"
          filterKey="styles"
          options={styleOptions.map((v) => ({ label: v, value: v }))}
          activeValues={filters.styles}
          onChange={handleToggle}
        />
      )}
    </aside>
  );
}
