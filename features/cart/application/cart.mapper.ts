import type { Product } from '@/app/lib/types';
import type { CartProduct } from '@/features/cart/domain/cart.types';

/**
 * Maps an app-layer Product to the lean CartProduct domain interface.
 * This is the boundary adapter: only the application layer crosses app/ → domain.
 * Domain never imports Product; the application layer owns the translation.
 */
export const toCartProduct = (product: Product): CartProduct => ({
  product_id: product.product_id,
  internal_sku: product.internal_sku,
  name: product.name,
  price: product.price,
  image_url: product.image_url,
  slug: product.slug,
  product_type: product.product_type,
});
