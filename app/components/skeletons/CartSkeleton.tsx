/**
 * Skeleton del carrito + summary mientras hidrata zustand persist.
 * Reduce perceived load time vs spinner generico - el usuario "ve" la
 * estructura de la pagina, no un loader vacio.
 */
export default function CartSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
      {/* Items column (3 placeholders) */}
      <div className="lg:col-span-2 space-y-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white p-4 sm:p-6 shadow-luxury flex gap-4"
          >
            <div className="w-24 h-24 bg-pearl-200 rounded flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-pearl-200 rounded w-3/4" />
              <div className="h-3 bg-pearl-100 rounded w-1/4" />
              <div className="flex gap-2 mt-4">
                <div className="h-8 w-24 bg-pearl-200 rounded" />
                <div className="h-8 w-16 bg-pearl-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary column */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 shadow-luxury space-y-4">
          <div className="h-6 bg-pearl-200 rounded w-2/3" />
          <div className="border-t border-pearl-100 pt-4 space-y-3">
            <div className="flex justify-between">
              <div className="h-3 bg-pearl-100 rounded w-1/3" />
              <div className="h-3 bg-pearl-200 rounded w-1/4" />
            </div>
            <div className="flex justify-between">
              <div className="h-3 bg-pearl-100 rounded w-1/3" />
              <div className="h-3 bg-pearl-200 rounded w-1/4" />
            </div>
            <div className="border-t border-pearl-200 pt-3 flex justify-between">
              <div className="h-5 bg-pearl-200 rounded w-1/3" />
              <div className="h-5 bg-pearl-300 rounded w-1/3" />
            </div>
          </div>
          <div className="h-12 bg-pearl-300 rounded mt-6" />
          <div className="h-12 bg-pearl-100 rounded" />
        </div>
      </div>
    </div>
  );
}
