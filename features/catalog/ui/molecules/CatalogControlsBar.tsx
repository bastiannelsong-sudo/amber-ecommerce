import { SortDropdown } from '@/features/catalog/ui/atoms/SortDropdown';
import { ViewModeToggle } from '@/features/catalog/ui/atoms/ViewModeToggle';
import type { SortOption } from '@/features/catalog/domain/catalog.types';

type ViewMode = 'grid-3' | 'grid-4' | 'list';

interface SortDropdownOption {
  value: SortOption;
  label: string;
}

interface CatalogControlsBarProps {
  count: number;
  viewMode: ViewMode;
  sortValue: SortOption;
  sortOptions: SortDropdownOption[];
  onViewModeChange: (mode: ViewMode) => void;
  onSortChange: (sort: SortOption) => void;
  onFilterOpen: () => void;
  activeFilterCount: number;
}

export function CatalogControlsBar({
  count,
  viewMode,
  sortValue,
  sortOptions,
  onViewModeChange,
  onSortChange,
  onFilterOpen,
  activeFilterCount,
}: CatalogControlsBarProps) {
  return (
    <div className="bg-white shadow-luxury rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 flex items-center justify-between gap-4">
      {/* Left: Product count + filter toggle (mobile) + view options */}
      <div className="flex items-center gap-3 sm:gap-6 flex-wrap flex-1">
        {/* Mobile filter toggle */}
        <button
          onClick={onFilterOpen}
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
            {count} Producto{count !== 1 ? 's' : ''}
          </h2>
        </div>

        <ViewModeToggle value={viewMode} onChange={onViewModeChange} />
      </div>

      {/* Right: Sort dropdown */}
      <SortDropdown value={sortValue} options={sortOptions} onChange={onSortChange} />
    </div>
  );
}
