import type { CheckoutFormData } from './checkout.types';

// ─── Required shipping fields for readiness check ────────────────────────────

const REQUIRED_FIELDS: (keyof CheckoutFormData)[] = [
  'email',
  'firstName',
  'lastName',
  'address',
  'region',
  'commune',
];

// ─── Order total ──────────────────────────────────────────────────────────────

/**
 * Computes the final order total: subtotal minus discount plus shipping,
 * clamped to zero (discount can never make total negative).
 */
export const orderTotal = (
  subtotal: number,
  discount: number,
  shipping: number,
): number => Math.max(0, subtotal - discount + shipping);

// ─── Form validation ──────────────────────────────────────────────────────────

/**
 * Returns true only when all required shipping fields are present and non-empty.
 */
export const isCheckoutReady = (formData: CheckoutFormData): boolean =>
  REQUIRED_FIELDS.every((field) => Boolean(formData[field]));

/**
 * Returns the names of every required field that is absent or empty.
 * An empty array means the form is ready.
 */
export const missingShippingFields = (formData: CheckoutFormData): string[] =>
  REQUIRED_FIELDS.filter((field) => !formData[field]);

// ─── Phone sanitization ───────────────────────────────────────────────────────

/**
 * Removes all non-digit characters except a single leading '+'.
 * '+56 9 1234 5678' → '+56912345678'
 * '912345678'       → '912345678'
 */
export const sanitizePhone = (value: string): string => {
  const hasLeadingPlus = value.startsWith('+');
  const digits = value.replace(/\D/g, '');
  return hasLeadingPlus ? `+${digits}` : digits;
};
