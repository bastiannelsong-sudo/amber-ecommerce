interface AllProductsShownProps {
  total: number;
}

export function AllProductsShown({ total }: AllProductsShownProps) {
  return (
    <div className="mt-12 sm:mt-16 text-center">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pearl-300 to-transparent" />
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-gold-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          <span className="text-[10px] uppercase tracking-[0.25em] text-platinum-500 font-medium">
            Has visto todos los productos
          </span>
          <svg className="w-4 h-4 text-amber-gold-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pearl-300 to-transparent" />
      </div>
      <p className="text-sm text-platinum-600">
        {total} producto{total !== 1 ? 's' : ''} en total
      </p>
    </div>
  );
}
