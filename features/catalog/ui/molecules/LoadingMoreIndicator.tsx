export function LoadingMoreIndicator() {
  return (
    <div className="flex items-center justify-center gap-2.5 py-6">
      <span className="catalog-dot w-1.5 h-1.5 bg-amber-gold-500/80 rounded-full" />
      <span className="catalog-dot w-1.5 h-1.5 bg-amber-gold-500/80 rounded-full" style={{ animationDelay: '160ms' }} />
      <span className="catalog-dot w-1.5 h-1.5 bg-amber-gold-500/80 rounded-full" style={{ animationDelay: '320ms' }} />
    </div>
  );
}
