/**
 * Price-locked snapshot of the cart at the moment of order submission.
 * Immutable — all fields and item array are readonly.
 */
export interface CartSnapshot {
  readonly items: readonly {
    readonly product_id: number;
    readonly name: string;
    readonly internal_sku: string;
    readonly quantity: number;
    readonly unit_price: number;
  }[];
  readonly subtotal: number;
  readonly shipping: number;
  readonly discount: number;
  readonly total: number;
}

/**
 * Flattened form data collected during the checkout shipping step.
 */
export interface CheckoutFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  apartment: string;
  region: string;
  commune: string;
  postalCode: string;
}

/**
 * Shape used when requesting order creation.
 * Derived from CartSnapshot + CheckoutFormData at submit time.
 */
export interface OrderDraft {
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  shipping_address: string;
  shipping_city: string;
  shipping_region: string;
  shipping_postal_code?: string;
  items: CartSnapshot['items'];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  coupon_code?: string;
}

/** Whether the user is checking out as a guest or authenticated account. */
export type CheckoutMode = 'guest' | 'authenticated';

/** Current step in the checkout funnel. */
export type CheckoutStep = 'shipping' | 'payment' | 'confirmation';
