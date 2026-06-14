interface CatalogEmptyStateProps {
  onClearFilters: () => void;
}

export function CatalogEmptyState({ onClearFilters }: CatalogEmptyStateProps) {
  return (
    <div className="text-center py-20">
      <svg className="w-16 h-16 text-platinum-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <h3 className="text-xl font-light text-obsidian-900 mb-2" style={{ fontFamily: 'var(--font-cormorant)' }}>
        Sin resultados
      </h3>
      <p className="text-sm text-platinum-600 mb-6">
        No encontramos productos con los filtros seleccionados.
      </p>
      <button
        onClick={onClearFilters}
        className="px-6 py-3 bg-obsidian-900 text-white text-xs uppercase tracking-widest hover:bg-amber-gold-500 transition-colors cursor-pointer"
      >
        Limpiar Filtros
      </button>
    </div>
  );
}
