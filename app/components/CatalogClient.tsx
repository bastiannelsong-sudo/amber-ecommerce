'use client';

import { useState } from 'react';
import FilterSidebar from './FilterSidebar';
import ProductCard from './ProductCard';
import type { Product } from '../lib/types';

type ViewMode = 'grid-3' | 'grid-4' | 'list';
type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

interface CatalogClientProps {
  products: Product[];
}

export default function CatalogClient({ products }: CatalogClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid-3');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const sortedProducts = [...products].sort((a, b) => {
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

  const gridClass = {
    'grid-3': 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3',
    'grid-4': 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
    'list': 'grid-cols-1',
  }[viewMode];

  return (
    <>
      {/* Controls Bar */}
      <div className="bg-white shadow-luxury rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 flex items-center justify-between gap-4">
        {/* Left: Product count + filter toggle (mobile) + view options */}
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap flex-1">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 border border-pearl-300 rounded-lg text-sm text-obsidian-700 hover:border-amber-gold-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            <span>Filtros</span>
          </button>

          <div className="hidden sm:block">
            <h2 className="text-xl sm:text-2xl font-light text-obsidian-900" style={{ fontFamily: 'var(--font-cormorant)' }}>
              {sortedProducts.length} Productos
            </h2>
          </div>

          {/* View Mode Toggle - hidden on very small screens */}
          <div className="hidden sm:flex items-center gap-2 border border-pearl-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid-3')}
              className={`p-2 rounded transition-colors ${
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
              className={`p-2 rounded transition-colors ${
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
              className={`p-2 rounded transition-colors ${
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
          <label className="text-sm text-platinum-600 uppercase tracking-wide whitespace-nowrap hidden sm:block">
            Ordenar por:
          </label>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="px-3 sm:px-4 py-2.5 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none text-sm bg-white rounded-lg min-w-0 sm:min-w-[200px]"
          >
            <option value="newest">Mas reciente</option>
            <option value="price-asc">Menor precio</option>
            <option value="price-desc">Mayor precio</option>
            <option value="name-asc">A-Z</option>
            <option value="name-desc">Z-A</option>
          </select>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
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
                className="w-10 h-10 flex items-center justify-center text-obsidian-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <FilterSidebar />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-pearl-200 p-4">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="w-full py-3.5 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors"
              >
                Ver {sortedProducts.length} Productos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Filters Sidebar - Desktop only */}
        <div className="hidden lg:block lg:sticky lg:top-24 self-start">
          <FilterSidebar />
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          <div className={`grid ${gridClass} gap-3 gap-y-6 sm:gap-6 sm:gap-y-10 lg:gap-8`}>
            {sortedProducts.map((product, index) => (
              <div
                key={product.product_id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ProductCard product={product} isNew={index < 3} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-10 sm:mt-16 gap-4 sm:gap-6">
            <div className="text-sm text-platinum-600">
              Mostrando {sortedProducts.length} de {sortedProducts.length} productos
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button className="px-3 sm:px-4 py-2 border border-pearl-300 hover:border-amber-gold-500 transition-colors text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed">
                Anterior
              </button>
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  className={`w-10 h-10 border transition-colors text-sm rounded ${
                    page === 1
                      ? 'bg-amber-gold-500 text-white border-amber-gold-500'
                      : 'border-pearl-300 hover:border-amber-gold-500'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button className="px-3 sm:px-4 py-2 border border-pearl-300 hover:border-amber-gold-500 transition-colors text-sm rounded">
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
