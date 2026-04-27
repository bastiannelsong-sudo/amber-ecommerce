// Product types
export interface Product {
  product_id: number;
  internal_sku: string;
  name: string;
  display_name?: string;
  description?: string;
  slug?: string;
  stock: number;
  stock_bodega: number;
  cost: number;
  price: number;
  compare_at_price?: number;
  image_url: string;
  images?: string[];
  material?: string;
  style?: string;
  product_type?: string;
  audience?: string;
  tags?: string[];
  is_published?: boolean;
  display_order?: number;
  category?: Category;
  secondarySkus?: SecondarySku[];
  productCollections?: ProductCollectionRelation[];
}

export interface Category {
  category_id: number;
  name: string;
  description?: string;
}

// Collection types (e-commerce categories)
export interface Collection {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: number;
  parent?: Collection;
  children?: Collection[];
  display_order: number;
  is_active: boolean;
}

export interface ProductCollectionRelation {
  id: number;
  collection_id: number;
  is_primary: boolean;
  display_order: number;
  collection?: Collection;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface SearchResponse extends PaginatedResponse<Product> {
  query: string;
}

export interface SearchSuggestions {
  products: { name: string; slug: string; image_url: string; price: number }[];
  collections: { name: string; slug: string }[];
}

export interface SecondarySku {
  secondary_sku_id: number;
  platform: Platform;
  platform_sku: string;
  platform_title?: string;
  platform_price?: number;
  is_active: boolean;
}

export interface Platform {
  platform_id: number;
  name: string;
  code: string;
}

// Cart types
export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: {
    color: string;
    size?: string;
  };
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

// User types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  auth_providers: string[];
  google_id?: string;
  is_verified: boolean;
  addresses?: CustomerAddress[];
  created_at?: string;
}

/**
 * Direccion guardada del cliente. Matchea backend CustomerAddress entity.
 * FEAT-005: address book.
 */
export interface CustomerAddress {
  id: number;
  customer_id?: number;
  street: string;
  apartment?: string | null;
  city: string;
  region: string;
  zip_code?: string | null;
  is_default: boolean;
  created_at?: string;
}

export interface ChileCommune {
  name: string;
}

export interface ChileRegion {
  id: number;
  short_name: string;
  full_name: string;
  capital: string;
  communes: ChileCommune[];
}

export interface ChileGeoResponse {
  regions: ChileRegion[];
  total_regions: number;
  total_communes: number;
}

/** Estado del lifecycle de una orden B2C, igual al backend. */
export type EcommerceOrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

/** Shape del response de GET /api/orders/:orderNumber (subset relevante para UI). */
export interface EcommerceOrderSummary {
  order_id?: number;
  order_number: string;
  status: EcommerceOrderStatus;
  total: number | string;
  customer_email?: string;
  mp_payment_status?: string | null;
  mp_payment_method?: string | null;
}

/** Item dentro de items[] de una orden (JSONB en backend). */
export interface EcommerceOrderItem {
  product_id: number;
  name: string;
  internal_sku: string;
  quantity: number;
  unit_price: number | string;
  image_url?: string;
}

/** Shape completo de GET /api/orders/:orderNumber para el comprobante. */
export interface EcommerceOrderDetail {
  order_id: number;
  order_number: string;
  status: EcommerceOrderStatus;

  customer_email: string;
  customer_name: string;
  customer_phone?: string | null;

  shipping_address: string;
  shipping_city: string;
  shipping_region: string;
  shipping_postal_code?: string | null;

  items: EcommerceOrderItem[];

  subtotal: number | string;
  shipping_cost: number | string;
  discount_amount: number | string;
  coupon_code?: string | null;
  total: number | string;

  mp_payment_id?: string | null;
  mp_payment_status?: string | null;
  mp_payment_method?: string | null;
  mp_card_last_four?: string | null;

  created_at: string;
  updated_at: string;
}

export interface Address {
  street: string;
  number: string;
  apartment?: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
}

/**
 * Respuesta de auth hacia el cliente.
 * access_token / refresh_token NO vienen aquí — viven en cookie httpOnly
 * seteada por los Route Handlers /api/auth/*.
 */
export interface AuthResponse {
  customer: User;
  is_new_account?: boolean;
  was_linked?: boolean;
}

export interface ForgotPasswordResponse {
  sent: boolean;
  provider?: string;
  message?: string;
}

// Order types
export interface Order {
  order_id: number;
  user: User;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  payment: Payment;
  shipping_address: Address;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  order_item_id: number;
  product: Product;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Payment {
  payment_id: number;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transaction_id?: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  TRANSFER = 'transfer',
  MERCADOPAGO = 'mercadopago',
}

export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
}

// Review types
export interface Review {
  review_id: number;
  product_id: number;
  customer_name: string;
  customer_email: string;
  rating: number;
  title: string;
  comment: string;
  verified_purchase: boolean;
  order_number?: string;
  helpful_count: number;
  is_approved: boolean;
  created_at: string;
}

export interface ReviewSummary {
  reviews: Review[];
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<number, number>;
}

// Wishlist types
export interface WishlistItem {
  product: Product;
  added_at: string;
}
