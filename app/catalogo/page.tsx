'use client';

import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FilterSidebar from '../components/FilterSidebar';
import ProductCard from '../components/ProductCard';
import { dummyProducts } from '../lib/data/dummy-products';
import type { Product } from '../lib/types';

const allProducts = dummyProducts;

type ViewMode = 'grid-3' | 'grid-4' | 'list';
type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

export default function CatalogoPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid-3');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [products] = useState<Product[]>(allProducts);

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
    'grid-3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    'grid-4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    'list': 'grid-cols-1',
  }[viewMode];

  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      {/* Hero Banner */}
      <section className="relative h-[40vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian-950/60 via-obsidian-900/30 to-obsidian-950/50 z-10" />
        <img
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&h=800&fit=crop"
          alt="Catalogo Completo"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center text-white space-y-6 px-4 animate-fade-in">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-gold-400 font-medium">
              Toda la Coleccion
            </p>
            <h1
              className="text-5xl lg:text-7xl font-light tracking-wider"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Catalogo Completo
            </h1>
            <p className="text-base lg:text-lg tracking-wide font-light max-w-2xl mx-auto text-pearl-200">
              Explora nuestra coleccion completa de joyeria artesanal
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-platinum-600 mb-8">
          <a href="/" className="hover:text-amber-gold-500 transition-colors">
            Inicio
          </a>
          <span>/</span>
          <span className="text-obsidian-900">Catálogo</span>
        </div>

        {/* Controls Bar */}
        <div className="bg-white shadow-luxury rounded-lg p-6 mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Product count and view options */}
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <h2 className="text-2xl font-light text-obsidian-900" style={{ fontFamily: 'var(--font-cormorant)' }}>
                {sortedProducts.length} Productos
              </h2>
              <p className="text-sm text-platinum-600">
                Mostrando toda la colección
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 border border-pearl-300 rounded-lg p-1">
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
          <div className="flex items-center gap-4">
            <label className="text-sm text-platinum-600 uppercase tracking-wide whitespace-nowrap">
              Ordenar por:
            </label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="px-4 py-2 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none text-sm bg-white rounded-lg min-w-[200px]"
            >
              <option value="newest">Más reciente</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name-asc">Nombre: A-Z</option>
              <option value="name-desc">Nombre: Z-A</option>
            </select>
          </div>
        </div>

        {/* Main Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:sticky lg:top-24 self-start">
            <FilterSidebar />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className={`grid ${gridClass} gap-8`}>
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
            <div className="flex flex-col sm:flex-row items-center justify-between mt-16 gap-6">
              <div className="text-sm text-platinum-600">
                Mostrando {sortedProducts.length} de {sortedProducts.length} productos
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 border border-pearl-300 hover:border-amber-gold-500 transition-colors text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed">
                  Anterior
                </button>
                {[1, 2, 3, 4, 5].map((page) => (
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
                <button className="px-4 py-2 border border-pearl-300 hover:border-amber-gold-500 transition-colors text-sm rounded">
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
