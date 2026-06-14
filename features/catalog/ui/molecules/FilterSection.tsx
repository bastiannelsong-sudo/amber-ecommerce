import { useState } from 'react';

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface FilterSectionProps {
  title: string;
  filterKey: 'collections' | 'materials' | 'styles';
  options: FilterOption[];
  activeValues: string[];
  onChange: (key: 'collections' | 'materials' | 'styles', value: string) => void;
  defaultOpen?: boolean;
}

export function FilterSection({
  title,
  filterKey,
  options,
  activeValues,
  onChange,
  defaultOpen = false,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-pearl-200 pt-6">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between w-full text-left mb-4 group cursor-pointer"
      >
        <h3 className="text-sm uppercase tracking-widest font-medium text-obsidian-900">
          {title}
          {activeValues.length > 0 && (
            <span className="ml-1.5 text-amber-gold-500">({activeValues.length})</span>
          )}
        </h3>
        <svg
          className={`w-4 h-4 text-platinum-600 group-hover:text-amber-gold-500 transition-all duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`space-y-3 overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {options.map((option) => {
          const isChecked = activeValues.includes(option.value);
          return (
            <label
              key={option.value}
              className="flex items-center gap-3 cursor-pointer group/option py-1"
            >
              <input
                type="checkbox"
                id={`${filterKey}-${option.value}`}
                aria-label={option.label}
                checked={isChecked}
                onChange={() => onChange(filterKey, option.value)}
                className="w-5 h-5 border-2 border-pearl-300 rounded text-amber-gold-500 focus:ring-amber-gold-500 focus:ring-offset-0 cursor-pointer flex-shrink-0"
              />
              <span className={`text-sm flex-1 transition-colors ${
                isChecked
                  ? 'text-amber-gold-600 font-medium'
                  : 'text-obsidian-700 group-hover/option:text-amber-gold-600'
              }`}>
                {option.label}
              </span>
              {option.count != null && (
                <span className="text-xs text-platinum-500">({option.count})</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
