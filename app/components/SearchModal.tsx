'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { productsService } from '../lib/services/products.service';
import type { SearchSuggestions } from '../lib/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RECENT_SEARCHES_KEY = 'amber_recent_searches';
const MAX_RECENT = 5;
const DEBOUNCE_MS = 300;

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const recent = getRecentSearches().filter((s) => s !== query);
  recent.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Total interactive items for keyboard nav
  const totalItems =
    (suggestions?.products.length || 0) +
    (suggestions?.collections.length || 0);

  // Load recent searches on open
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      // Focus input after animation
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery('');
      setSuggestions(null);
      setActiveIndex(-1);
    }
  }, [isOpen]);

  // Keyboard shortcut: Cmd/Ctrl+K to open
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // Parent controls open state, but we can still handle close
        }
      }
    }
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen]);

  // Debounced suggestions fetch
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions(null);
      setActiveIndex(-1);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      const result = await productsService.getSuggestions(query.trim());
      setSuggestions(result);
      setActiveIndex(-1);
      setIsLoading(false);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  // Navigate to full results page
  const goToResults = useCallback(
    (searchQuery: string) => {
      if (searchQuery.trim().length < 2) return;
      saveRecentSearch(searchQuery.trim());
      router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
      onClose();
    },
    [router, onClose],
  );

  // Navigate to product
  const goToProduct = useCallback(
    (slug: string) => {
      saveRecentSearch(query.trim());
      router.push(`/producto/${slug}`);
      onClose();
    },
    [router, onClose, query],
  );

  // Navigate to collection
  const goToCollection = useCallback(
    (slug: string) => {
      router.push(`/catalogo?col=${slug}`);
      onClose();
    },
    [router, onClose],
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && suggestions) {
          const productCount = suggestions.products.length;
          if (activeIndex < productCount) {
            goToProduct(suggestions.products[activeIndex].slug);
          } else {
            goToCollection(suggestions.collections[activeIndex - productCount].slug);
          }
        } else {
          goToResults(query);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-search-item]');
      items[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  if (!isOpen) return null;

  const hasQuery = query.trim().length >= 2;
  const hasResults = suggestions && (suggestions.products.length > 0 || suggestions.collections.length > 0);
  const noResults = hasQuery && !isLoading && suggestions && !hasResults;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-0 sm:pt-20"
        onClick={onClose}
        role="presentation"
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          className="bg-white w-full sm:max-w-2xl sm:mx-4 sm:rounded-xl shadow-2xl overflow-hidden h-full sm:h-auto sm:max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Buscar productos"
        >
          {/* Search Input */}
          <div className="p-4 sm:p-5 border-b border-pearl-200">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-platinum-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={inputRef}
                type="search"
                inputMode="search"
                spellCheck={false}
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar joyas, collares, anillos..."
                aria-label="Buscar productos"
                className="w-full pl-12 pr-20 py-3.5 border border-pearl-300 focus:border-amber-gold-500 focus-visible:ring-2 focus-visible:ring-amber-gold-500/30 focus:outline-none text-base rounded-lg transition-colors"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {query && (
                  <button
                    onClick={() => {
                      setQuery('');
                      inputRef.current?.focus();
                    }}
                    className="p-1 text-platinum-500 hover:text-obsidian-900 transition-colors"
                    aria-label="Limpiar busqueda"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-platinum-500 bg-pearl-100 border border-pearl-300 rounded font-mono">
                  ESC
                </kbd>
              </div>
            </div>
          </div>

          {/* Results area */}
          <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain" role="listbox" aria-label="Resultados de busqueda">

            {/* State: Empty query → show recent searches */}
            {!hasQuery && recentSearches.length > 0 && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-platinum-500 uppercase tracking-wider">Busquedas recientes</span>
                  <button
                    onClick={handleClearRecent}
                    className="text-xs text-platinum-500 hover:text-amber-gold-600 transition-colors"
                  >
                    Limpiar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setQuery(term);
                        goToResults(term);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pearl-50 hover:bg-pearl-100 border border-pearl-200 rounded-full text-sm text-obsidian-800 transition-colors"
                    >
                      <svg className="w-3 h-3 text-platinum-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* State: Empty query, no recent → prompt */}
            {!hasQuery && recentSearches.length === 0 && (
              <div className="p-10 text-center">
                <svg
                  className="w-12 h-12 text-pearl-300 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm text-platinum-500">
                  Escribe para buscar productos, materiales o colecciones
                </p>
              </div>
            )}

            {/* State: Loading */}
            {hasQuery && isLoading && (
              <div className="p-8 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-platinum-500">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Buscando...
                </div>
              </div>
            )}

            {/* State: Has results */}
            {hasQuery && !isLoading && hasResults && (
              <div className="py-2">
                {/* Product suggestions */}
                {suggestions!.products.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-medium text-platinum-500 uppercase tracking-wider">
                      Productos
                    </p>
                    {suggestions!.products.map((product, i) => (
                      <button
                        key={product.slug}
                        data-search-item
                        onClick={() => goToProduct(product.slug)}
                        className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                          activeIndex === i
                            ? 'bg-amber-gold-50'
                            : 'hover:bg-pearl-50'
                        }`}
                        role="option"
                        aria-selected={activeIndex === i}
                      >
                        <div className="w-10 h-10 bg-pearl-100 flex-shrink-0 rounded overflow-hidden">
                          {product.image_url && (
                            <Image
                              src={product.image_url}
                              alt=""
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          )}
                        </div>
                        <span className="flex-1 text-sm text-obsidian-900 truncate">
                          {product.name}
                        </span>
                        <span className="text-sm font-medium text-obsidian-800 tabular-nums">
                          ${product.price.toLocaleString('es-CL')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Collection suggestions */}
                {suggestions!.collections.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-medium text-platinum-500 uppercase tracking-wider">
                      Colecciones
                    </p>
                    {suggestions!.collections.map((col, i) => {
                      const itemIndex = (suggestions!.products.length) + i;
                      return (
                        <button
                          key={col.slug}
                          data-search-item
                          onClick={() => goToCollection(col.slug)}
                          className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                            activeIndex === itemIndex
                              ? 'bg-amber-gold-50'
                              : 'hover:bg-pearl-50'
                          }`}
                          role="option"
                          aria-selected={activeIndex === itemIndex}
                        >
                          <div className="w-10 h-10 bg-pearl-100 flex-shrink-0 rounded flex items-center justify-center">
                            <svg className="w-5 h-5 text-platinum-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <span className="flex-1 text-sm text-obsidian-900">
                            {col.name}
                          </span>
                          <svg className="w-4 h-4 text-platinum-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* See all results link */}
                <div className="px-4 py-3 border-t border-pearl-100">
                  <button
                    onClick={() => goToResults(query)}
                    className="w-full text-center text-sm text-amber-gold-600 hover:text-amber-gold-700 font-medium transition-colors"
                  >
                    Ver todos los resultados para &ldquo;{query.trim()}&rdquo;
                  </button>
                </div>
              </div>
            )}

            {/* State: No results */}
            {noResults && (
              <div className="p-8 text-center">
                <svg
                  className="w-12 h-12 text-pearl-300 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-platinum-600 mb-1">
                  No encontramos resultados para &ldquo;{query.trim()}&rdquo;
                </p>
                <p className="text-xs text-platinum-400">
                  Intenta con otras palabras o revisa la ortografia
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="hidden sm:flex items-center justify-between px-4 py-2.5 border-t border-pearl-200 bg-pearl-50 text-[11px] text-platinum-500">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white border border-pearl-300 rounded text-[10px] font-mono">↑</kbd>
                <kbd className="px-1 py-0.5 bg-white border border-pearl-300 rounded text-[10px] font-mono">↓</kbd>
                navegar
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-pearl-300 rounded text-[10px] font-mono">↵</kbd>
                seleccionar
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-pearl-300 rounded text-[10px] font-mono">esc</kbd>
                cerrar
              </span>
            </div>
          </div>

          {/* Mobile close */}
          <div className="sm:hidden p-3 border-t border-pearl-200 bg-pearl-50">
            <button
              onClick={onClose}
              className="w-full py-2.5 text-center text-sm text-platinum-600 uppercase tracking-wide"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
