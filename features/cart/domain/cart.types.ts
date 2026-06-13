/**
 * Lean domain representation of a product stored in the cart.
 * Contains only the fields the cart domain and its UI consumers need.
 * The application layer is responsible for mapping app/Product → CartProduct at the boundary.
 */
export interface CartProduct {
  product_id: number;
  internal_sku: string;
  name: string;
  price: number;
  image_url: string;
  slug?: string;
  product_type?: string;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
  selectedVariant?: {
    color: string;
    size?: string;
  };
}
