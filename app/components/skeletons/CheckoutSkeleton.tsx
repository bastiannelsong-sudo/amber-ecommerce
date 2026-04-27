/**
 * Skeleton del checkout (form de envio + summary lateral) mientras
 * hidrata zustand persist.
 */
export default function CheckoutSkeleton() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-6 sm:py-12 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex gap-2 mb-8">
        <div className="h-3 bg-pearl-200 rounded w-12" />
        <div className="h-3 bg-pearl-100 rounded w-12" />
        <div className="h-3 bg-pearl-200 rounded w-16" />
      </div>

      {/* Progress bar skeleton */}
      <div className="flex gap-4 mb-12 max-w-md">
        <div className="h-2 bg-pearl-300 rounded flex-1" />
        <div className="h-2 bg-pearl-200 rounded flex-1" />
        <div className="h-2 bg-pearl-100 rounded flex-1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form skeleton */}
        <div className="lg:col-span-2">
          <div className="bg-white p-5 sm:p-8 shadow-luxury space-y-6">
            <div className="h-7 bg-pearl-200 rounded w-2/3 pb-4 border-b border-pearl-100" />
            {/* 6 fields */}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <div className="h-3 bg-pearl-100 rounded w-1/4 mb-2" />
                <div className="h-12 bg-pearl-100 rounded" />
              </div>
            ))}
            <div className="h-12 bg-pearl-300 rounded mt-8" />
          </div>
        </div>

        {/* Summary skeleton */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 shadow-luxury space-y-3">
            <div className="h-5 bg-pearl-200 rounded w-1/2 mb-4" />
            <div className="h-3 bg-pearl-100 rounded" />
            <div className="h-3 bg-pearl-100 rounded w-3/4" />
            <div className="border-t border-pearl-100 pt-3 mt-4 space-y-2">
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
          </div>
        </div>
      </div>
    </div>
  );
}
