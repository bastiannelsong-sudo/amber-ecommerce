'use client';

import { useState } from 'react';

interface FilterSection {
  title: string;
  options: { label: string; value: string; count?: number }[];
}

const filterSections: FilterSection[] = [
  {
    title: 'Categoría',
    options: [
      { label: 'Collares', value: 'collares', count: 48 },
      { label: 'Anillos', value: 'anillos', count: 62 },
      { label: 'Aretes', value: 'aretes', count: 34 },
      { label: 'Pulseras', value: 'pulseras', count: 28 },
      { label: 'Broches', value: 'broches', count: 12 },
    ],
  },
  {
    title: 'Material',
    options: [
      { label: 'Plata 925', value: 'plata-925', count: 67 },
      { label: 'Bano de Oro', value: 'bano-oro', count: 32 },
      { label: 'Acero Quirurgico', value: 'acero', count: 25 },
      { label: 'Cristales', value: 'cristales', count: 18 },
    ],
  },
  {
    title: 'Estilo',
    options: [
      { label: 'Circones', value: 'circones', count: 38 },
      { label: 'Moissanita', value: 'moissanita', count: 15 },
      { label: 'Proteccion', value: 'proteccion', count: 22 },
      { label: 'Tendencia', value: 'tendencia', count: 19 },
      { label: 'Minimalista', value: 'minimalista', count: 24 },
    ],
  },
];

export default function FilterSidebar() {
  const [openSections, setOpenSections] = useState<string[]>(['Categoría']);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <aside className="w-full lg:w-72 space-y-8">
      {/* Filter header */}
      <div className="flex items-center justify-between pb-4 border-b border-pearl-200">
        <h2
          className="text-2xl font-light text-obsidian-900"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          Filtros
        </h2>
        <button className="text-sm text-platinum-600 hover:text-amber-gold-500 transition-colors uppercase tracking-wide">
          Limpiar
        </button>
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <h3 className="text-sm uppercase tracking-widest font-medium text-obsidian-900">
          Rango de Precio
        </h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-platinum-600 mb-1 block">Mínimo</label>
              <input
                type="number"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                className="w-full px-3 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none text-sm rounded"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-platinum-600 mb-1 block">Maximo</label>
              <input
                type="number"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                className="w-full px-3 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none text-sm rounded"
              />
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100000"
            step="5000"
            value={priceRange.max}
            onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
            className="w-full h-1 bg-pearl-200 rounded-lg appearance-none cursor-pointer accent-amber-gold-500"
          />
        </div>
      </div>

      {/* Dynamic filter sections */}
      {filterSections.map((section) => (
        <div key={section.title} className="border-t border-pearl-200 pt-6">
          <button
            onClick={() => toggleSection(section.title)}
            className="flex items-center justify-between w-full text-left mb-4 group"
          >
            <h3 className="text-sm uppercase tracking-widest font-medium text-obsidian-900">
              {section.title}
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
            {section.options.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 cursor-pointer group/option py-1"
              >
                <input
                  type="checkbox"
                  className="w-5 h-5 border-2 border-pearl-300 rounded text-amber-gold-500 focus:ring-amber-gold-500 focus:ring-offset-0 cursor-pointer flex-shrink-0"
                />
                <span className="text-sm text-obsidian-700 group-hover/option:text-amber-gold-600 transition-colors flex-1">
                  {option.label}
                </span>
                {option.count && (
                  <span className="text-xs text-platinum-500">({option.count})</span>
                )}
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* Color filter */}
      <div className="border-t border-pearl-200 pt-6">
        <h3 className="text-sm uppercase tracking-widest font-medium text-obsidian-900 mb-4">
          Color
        </h3>
        <div className="flex flex-wrap gap-3">
          {[
            { name: 'Oro', color: '#d4af37' },
            { name: 'Plata', color: '#c0c0c0' },
            { name: 'Oro Rosa', color: '#E5B5A0' },
            { name: 'Negro', color: '#1a1a1a' },
            { name: 'Blanco', color: '#fafafa' },
          ].map((color) => (
            <button
              key={color.name}
              aria-label={`Color ${color.name}`}
              className="w-11 h-11 rounded-full border-2 border-pearl-300 hover:border-amber-gold-500 transition-all hover:scale-110"
              style={{ backgroundColor: color.color }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
