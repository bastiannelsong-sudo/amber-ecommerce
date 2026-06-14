import { formatPrice } from '@/features/catalog/domain/catalog.rules';

interface FilterPriceRangeProps {
  /** Minimum possible price (from product data) */
  min: number;
  /** Maximum possible price (from product data) */
  max: number;
  /** Currently active minimum price filter */
  priceMin: number;
  /** Currently active maximum price filter */
  priceMax: number;
  onPriceChange: (min: number, max: number) => void;
}

export function FilterPriceRange({ min, max, priceMin, priceMax, onPriceChange }: FilterPriceRangeProps) {
  const step = Math.max(500, Math.round((max - min) / 50 / 500) * 500);

  return (
    <div className="space-y-4">
      <h3 className="text-sm uppercase tracking-widest font-medium text-obsidian-900">
        Rango de Precio
      </h3>
      <p className="text-[10px] text-platinum-500">
        Productos entre ${formatPrice(min)} y ${formatPrice(max)}
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
                value={priceMin || ''}
                placeholder={formatPrice(min)}
                onChange={(e) => onPriceChange(Number(e.target.value) || 0, priceMax)}
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
                value={priceMax || ''}
                placeholder={formatPrice(max)}
                onChange={(e) => onPriceChange(priceMin, Number(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-3 border border-pearl-300 focus:border-amber-gold-500 focus:outline-none text-sm rounded"
              />
            </div>
          </div>
        </div>
        <input
          type="range"
          aria-label="Precio máximo"
          min={min}
          max={max}
          step={step}
          value={priceMax || max}
          onChange={(e) => onPriceChange(priceMin, Number(e.target.value))}
          className="w-full h-1 bg-pearl-200 rounded-lg appearance-none cursor-pointer accent-amber-gold-500"
        />
        <div className="flex justify-between text-[10px] text-platinum-500">
          <span>${formatPrice(min)}</span>
          <span>${formatPrice(max)}</span>
        </div>
      </div>
    </div>
  );
}
