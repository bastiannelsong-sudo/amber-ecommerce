interface PaginationProgressProps {
  visible: number;
  total: number;
  onLoadMore: () => void;
}

export function PaginationProgress({ visible, total, onLoadMore }: PaginationProgressProps) {
  const progressPercent = total > 0 ? Math.min(100, (visible / total) * 100) : 100;

  return (
    <div className="mt-12 sm:mt-16">
      {/* Progress bar */}
      <div className="max-w-xs mx-auto mb-4">
        <div className="h-[2px] bg-pearl-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-gold-400 to-amber-gold-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      <p className="text-center text-[11px] text-platinum-500 tracking-wide mb-6">
        {Math.min(visible, total)} de {total} productos
      </p>
      <div className="flex justify-center">
        <button
          onClick={onLoadMore}
          className="px-8 py-3 border border-pearl-300 text-sm text-obsidian-700 uppercase tracking-widest hover:border-amber-gold-500 hover:text-amber-gold-600 transition-colors cursor-pointer"
          aria-label="Cargar más productos"
        >
          Ver más
        </button>
      </div>
    </div>
  );
}
