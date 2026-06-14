import { ActiveFilterChip } from '@/features/catalog/ui/atoms/ActiveFilterChip';
import type { ActiveFilters } from '@/features/catalog/domain/catalog.types';

interface ActiveFilterChipsProps {
  filters: ActiveFilters;
  onRemoveFilter: (key: keyof Pick<ActiveFilters, 'collections' | 'materials' | 'styles'>, value: string) => void;
  onClearAll: () => void;
}

export function ActiveFilterChips({ filters, onRemoveFilter, onClearAll }: ActiveFilterChipsProps) {
  const hasActive =
    filters.collections.length > 0 ||
    filters.materials.length > 0 ||
    filters.styles.length > 0 ||
    filters.priceMin > 0 ||
    (filters.priceMax > 0 && filters.priceMax !== Infinity);

  if (!hasActive) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-xs text-platinum-600 uppercase tracking-wide">Filtros activos:</span>

      {filters.collections.map((slug) => (
        <ActiveFilterChip
          key={`col-${slug}`}
          label={slug}
          onRemove={() => onRemoveFilter('collections', slug)}
        />
      ))}

      {filters.materials.map((mat) => (
        <ActiveFilterChip
          key={`mat-${mat}`}
          label={mat}
          onRemove={() => onRemoveFilter('materials', mat)}
        />
      ))}

      {filters.styles.map((sty) => (
        <ActiveFilterChip
          key={`sty-${sty}`}
          label={sty}
          onRemove={() => onRemoveFilter('styles', sty)}
        />
      ))}

      <button
        onClick={onClearAll}
        className="text-xs text-amber-gold-500 hover:text-amber-gold-600 uppercase tracking-wide font-medium ml-2 cursor-pointer"
        aria-label="Limpiar todo"
      >
        Limpiar todo
      </button>
    </div>
  );
}
