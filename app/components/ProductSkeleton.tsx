export default function ProductSkeleton() {
  return (
    <div className="group relative animate-pulse">
      {/* Image skeleton */}
      <div className="relative aspect-[3/4] bg-pearl-200 mb-4 rounded-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pearl-200 via-pearl-100 to-pearl-200 animate-shimmer" />
      </div>

      {/* Product info skeleton */}
      <div className="text-center space-y-3">
        {/* Category */}
        <div className="h-3 w-24 bg-pearl-200 mx-auto rounded" />

        {/* Title */}
        <div className="h-5 w-3/4 bg-pearl-200 mx-auto rounded" />

        {/* Price */}
        <div className="h-4 w-20 bg-pearl-200 mx-auto rounded" />

        {/* Color variants */}
        <div className="flex justify-center gap-2 pt-2">
          <div className="w-6 h-6 rounded-full bg-pearl-200" />
          <div className="w-6 h-6 rounded-full bg-pearl-200" />
          <div className="w-6 h-6 rounded-full bg-pearl-200" />
        </div>
      </div>
    </div>
  );
}
