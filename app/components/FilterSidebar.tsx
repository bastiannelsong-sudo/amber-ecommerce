'use client';

import { useState, useMemo } from 'react';
import type { Collection, Product } from '../lib/types';

export interface ActiveFilters {
  collections: string[];
  materials: string[];
  styles: string[];
  priceMin: number;
  priceMax: number;
}

export const emptyFilters: ActiveFilters = {
  collections: [],
  materials: [],
  styles: [],
  priceMin: 0,
  priceMax: 0,
};

interface FilterSidebarProps {
  collections?: Collection[];
  products?: Product[];
  activeFilters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
}

export default function FilterSidebar({
  collections,
  products,
  activeFilters,
  onFiltersChange,
}: FilterSidebarProps) {
  const [openSections, setOpenSections] = useState<string[]>(['Coleccion', 'Material']);

  // Derive available filter options and price range from actual product data
  const { materialOptions, styleOptions, minPrice, maxPrice } = useMemo(() => {
    if (!products || products.length === 0) {
      return { materialOptions: [], styleOptions: [], minPrice: 0, maxPrice: 100000 };
    }

    const materialMap = new Map<string, number>();
    const styleMap = new Map<string, number>();
    let min = Infinity;
    let max = 0;

    for (const p of products) {
      if (p.material) {
        materialMap.set(p.material, (materialMap.get(p.material) || 0) + 1);
      }
      if (p.style) {
        styleMap.set(p.style, (styleMap.get(p.style) || 0) + 1);
      }
      const price = p.price || 0;
      if (price > 0) {
        if (price < min) min = price;
        if (price > max) max = price;
      }
    }

    // Round to clean numbers: min down to nearest 1000, max up to nearest 1000
    const cleanMin = Math.floor((min === Infinity ? 0 : min) / 1000) * 1000;
    const cleanMax = Math.ceil(max / 1000) * 1000 || 100000;

    return {
      materialOptions: Array.from(materialMap.entries())
        .map(([value, count]) => ({ label: value, value, count }))
        .sort((a, b) => b.count - a.count),
      styleOptions: Array.from(styleMap.entries())
        .map(([value, count]) => ({ label: value, value, count }))
        .sort((a, b) => b.count - a.count),
      minPrice: cleanMin,
      maxPrice: cleanMax,
    };
  }, [products]);

  // Build collection options from tree
  const collectionOptions = useMemo(() => {
    if (!collections || collections.length === 0) return [];
    const opts: { label: string; value: string; count?: number }[] = [];
    for (const universe of collections) {
      // Add universe-level collections
      opts.push({ label: universe.name, value: universe.slug });
      // Add child categories
      if (universe.children) {
        for (const cat of universe.children) {
          opts.push({ label: `  ${cat.name}`, value: cat.slug });
        }
      }
    }
    return opts;
  }, [collections]);

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const toggleCheckbox = (key: 'collections' | 'materials' | 'styles', value: string) => {
    const current = activeFilters[key];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...activeFilters, [key]: updated });
  };

  const setPriceRange = (min: number, max: number) => {
    onFiltersChange({ ...activeFilters, priceMin: min, priceMax: max });
  };

  const clearAll = () => {
    onFiltersChange({ ...emptyFilters, priceMax: 0 });
  };

  const activeCount =
    activeFilters.collections.length +
    activeFilters.materials.length +
    activeFilters.styles.length +
    (activeFilters.priceMin > 0 || (activeFilters.priceMax > 0 && activeFilters.priceMax < maxPrice) ? 1 : 0);

  const sections: {
    title: string;
    key: 'collections' | 'materials' | 'styles';
    options: { label: string; value: string; count?: number }[];
  }[] = [];

  if (collectionOptions.length > 0) {
    sections.push({ title: 'Coleccion', key: 'collections', options: collectionOptions });
  }
  if (materialOptions.length > 0) {
    sections.push({ title: 'Material', key: 'materials', options: materialOptions });
  }
  if (styleOptions.length > 0) {
    sections.push({ title: 'Estilo', key: 'styles', options: styleOptions });
  }

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
            onClick={clearAll}
            className="text-sm text-platinum-600 hover:text-amber-gold-500 transition-colors uppercase tracking-wide cursor-pointer"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <h3 className="text-sm uppercase tracking-widest font-medium text-obsidian-900">
          Rango de Precio
        </h3>
        <p className="text-[10px] text-platinum-500">
          Productos entre ${minPrice.toLocaleString('es-CL')} y ${maxPrice.toLocaleString('es-CL')}
        </p>
        <div className="space-y-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label htmlFor="price-min" className="text-xs text-platinum-600 mb-1 block">Desde</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-platinum-500">$</span>
                <input
                  id="price-min"
                  type="number"
                  value={activeFilters.priceMin || ''}
                  placeholder={minPrice.toLocaleString('es-CL')}
                  onChange={(e) => setPriceRange(Number(e.target.value) || 0, activeFilters.priceMax)}
                  className="w-full pl-7 pr-3 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none text-sm rounded"
                />
              </div>
            </div>
            <span className="text-platinum-400 pb-3">—</span>
            <div className="flex-1">
              <label htmlFor="price-max" className="text-xs text-platinum-600 mb-1 block">Hasta</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-platinum-500">$</span>
                <input
                  id="price-max"
                  type="number"
                  value={activeFilters.priceMax || ''}
                  placeholder={maxPrice.toLocaleString('es-CL')}
                  onChange={(e) => setPriceRange(activeFilters.priceMin, Number(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none text-sm rounded"
                />
              </div>
            </div>
          </div>
          <input
            type="range"
            aria-label="Precio máximo"
            min={minPrice}
            max={maxPrice}
            step={Math.max(500, Math.round((maxPrice - minPrice) / 50 / 500) * 500)}
            value={activeFilters.priceMax || maxPrice}
            onChange={(e) => setPriceRange(activeFilters.priceMin, Number(e.target.value))}
            className="w-full h-1 bg-pearl-200 rounded-lg appearance-none cursor-pointer accent-amber-gold-500"
          />
          <div className="flex justify-between text-[10px] text-platinum-500">
            <span>${minPrice.toLocaleString('es-CL')}</span>
            <span>${maxPrice.toLocaleString('es-CL')}</span>
          </div>
        </div>
      </div>

      {/* Dynamic filter sections */}
      {sections.map((section) => (
        <div key={section.title} className="border-t border-pearl-200 pt-6">
          <button
            onClick={() => toggleSection(section.title)}
            className="flex items-center justify-between w-full text-left mb-4 group cursor-pointer"
          >
            <h3 className="text-sm uppercase tracking-widest font-medium text-obsidian-900">
              {section.title}
              {activeFilters[section.key].length > 0 && (
                <span className="ml-1.5 text-amber-gold-500">({activeFilters[section.key].length})</span>
              )}
            </h3>
            <svg
              className={`w-4 h-4 text-platinum-600 group-hover:text-amber-gold-500 transition-all duration-300 ${
                openSections.includes(section.title) ? 'rotate-180' : ''
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
              openSections.includes(section.title) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {section.options.map((option) => {
              const isChecked = activeFilters[section.key].includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex items-center gap-3 cursor-pointer group/option py-1"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCheckbox(section.key, option.value)}
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
      ))}
    </aside>
  );
}
