// Product types
export interface Product {
  product_id: number;
  internal_sku: string;
  name: string;
  stock: number;
  stock_bodega: number;
  cost: number;
  price: number;
  image_url: string;
  images?: string[];
  category?: Category;
  secondarySkus?: SecondarySku[];
}

export interface Category {
  category_id: number;
  name: string;
  description?: string;
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
  name: string;
  phone?: string;
  address?: Address;
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
  user: User;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  created_at: string;
  helpful_count: number;
}

// Wishlist types
export interface WishlistItem {
  product: Product;
  added_at: string;
}
