import ProductCard from './ProductCard';
import { getFeaturedProducts } from '../lib/server-api/products';

/**
 * Server Component: consume el catálogo server-side vía /products/catalog
 * (INTERNAL_API_URL) con React.cache() + ISR. Zero JS en cliente salvo el
 * ProductCard (que sigue siendo client por el hover/wishlist).
 *
 * Si se necesita una "loading skeleton" para streaming, envolver en
 * <Suspense fallback={<FeaturedProductsSkeleton />}> desde el caller.
 */
export default async function FeaturedProducts() {
  const products = await getFeaturedProducts(8);

  const withImages = products.filter(
    (p) => p.image_url && p.image_url.trim() !== '',
  );

  if (withImages.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-platinum-600">Los productos se mostraran proximamente</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
      {withImages.slice(0, 8).map((product, index) => (
        <div
          key={product.product_id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <ProductCard product={product} isNew={index < 2} />
        </div>
      ))}
    </div>
  );
}

/** Skeleton de carga — úsalo en <Suspense fallback> si lo necesitas. */
export function FeaturedProductsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[3/4] bg-pearl-200 mb-4"></div>
          <div className="space-y-2 text-center">
            <div className="h-3 bg-pearl-200 rounded w-1/3 mx-auto"></div>
            <div className="h-4 bg-pearl-200 rounded w-2/3 mx-auto"></div>
            <div className="h-4 bg-pearl-200 rounded w-1/4 mx-auto"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
