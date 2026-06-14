import type { SortOption } from '@/features/catalog/domain/catalog.types';

interface SortDropdownOption {
  value: SortOption;
  label: string;
}

interface SortDropdownProps {
  value: SortOption;
  options: SortDropdownOption[];
  onChange: (value: SortOption) => void;
}

export function SortDropdown({ value, options, onChange }: SortDropdownProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <label htmlFor="sort-products" className="text-sm text-platinum-600 uppercase tracking-wide whitespace-nowrap hidden sm:block">
        Ordenar por:
      </label>
      <select
        id="sort-products"
        aria-label="Ordenar por"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="px-3 sm:px-4 py-2.5 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none text-sm bg-white rounded-lg min-w-0 sm:min-w-[200px] cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
