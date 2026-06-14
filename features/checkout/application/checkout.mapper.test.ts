import { describe, it, expect } from 'vitest';
import { toCartSnapshot, toOrderPayload } from './checkout.mapper';
import type { CartItem } from '@/features/cart/domain/cart.types';
import type { CheckoutFormData } from '@/features/checkout/domain/checkout.types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeItem = (price: number, qty = 1): CartItem => ({
  product: {
    product_id: 1,
    internal_sku: 'AMB-COL-001',
    name: 'Collar Punto de Luz',
    price,
    image_url: 'https://images.unsplash.com/test',
  },
  quantity: qty,
});

const formData: CheckoutFormData = {
  email: 'test@example.com',
  firstName: 'Ana',
  lastName: 'García',
  phone: '+56912345678',
  address: 'Av. Principal 123',
  apartment: '',
  region: 'RM',
  commune: 'Las Condes',
  postalCode: '',
};

// ─── toCartSnapshot ───────────────────────────────────────────────────────────

describe('toCartSnapshot', () => {
  it('maps unit_price from item.product.price (LOCKED naming)', () => {
    const items = [makeItem(29990)];
    const snapshot = toCartSnapshot(items, 0);
    expect(snapshot.items[0].unit_price).toBe(29990);
  });

  it('produces correct shape: product_id, name, internal_sku, quantity, unit_price', () => {
    const items = [makeItem(29990, 2)];
    const snapshot = toCartSnapshot(items, 0);
    const item = snapshot.items[0];
    expect(item).toMatchObject({
      product_id: 1,
      internal_sku: 'AMB-COL-001',
      name: 'Collar Punto de Luz',
      quantity: 2,
      unit_price: 29990,
    });
  });

  it('maps image_url from item.product.image_url when present', () => {
    const items = [makeItem(29990)];
    const snapshot = toCartSnapshot(items, 0);
    expect(snapshot.items[0].image_url).toBe('https://images.unsplash.com/test');
  });

  it('omits image_url from snapshot item when product has no image_url', () => {
    const itemWithoutImage: CartItem = {
      product: {
        product_id: 2,
        internal_sku: 'AMB-COL-002',
        name: 'Collar Sin Imagen',
        price: 15000,
        image_url: '',
      },
      quantity: 1,
    };
    const snapshot = toCartSnapshot([itemWithoutImage], 0);
    expect(snapshot.items[0].image_url).toBeUndefined();
  });

  it('snapshot with zero discount: subtotal=29990, shipping=5000, total=34990', () => {
    // 29990 < FREE_SHIPPING_THRESHOLD (30000) → shipping = 5000
    const items = [makeItem(29990)];
    const snapshot = toCartSnapshot(items, 0);
    expect(snapshot.subtotal).toBe(29990);
    expect(snapshot.discount).toBe(0);
    expect(snapshot.shipping).toBe(5000);
    expect(snapshot.total).toBe(34990);
  });

  it('snapshot with active discount: reduces total', () => {
    // subtotal=29990, discount=2000, shipping=5000 → total=32990
    const items = [makeItem(29990)];
    const snapshot = toCartSnapshot(items, 2000);
    expect(snapshot.subtotal).toBe(29990);
    expect(snapshot.discount).toBe(2000);
    expect(snapshot.shipping).toBe(5000);
    expect(snapshot.total).toBe(32990);
  });

  it('free shipping threshold: subtotal ≥ 30000 → shipping 0', () => {
    // 30000 >= FREE_SHIPPING_THRESHOLD → shipping=0, total=30000
    const items = [makeItem(30000)];
    const snapshot = toCartSnapshot(items, 0);
    expect(snapshot.shipping).toBe(0);
    expect(snapshot.total).toBe(30000);
  });
});

// ─── toOrderPayload ───────────────────────────────────────────────────────────

describe('toOrderPayload', () => {
  it('includes coupon_code when couponCode is a non-empty string', () => {
    const items = [makeItem(29990)];
    const snapshot = toCartSnapshot(items, 2000);
    const payload = toOrderPayload(snapshot, formData, 'SAVE10');
    expect(payload.coupon_code).toBe('SAVE10');
  });

  it('omits coupon_code when couponCode is absent', () => {
    const items = [makeItem(29990)];
    const snapshot = toCartSnapshot(items, 0);
    const payload = toOrderPayload(snapshot, formData);
    expect(payload.coupon_code).toBeUndefined();
  });

  it('omits coupon_code when couponCode is null', () => {
    const items = [makeItem(29990)];
    const snapshot = toCartSnapshot(items, 0);
    const payload = toOrderPayload(snapshot, formData, null);
    expect(payload.coupon_code).toBeUndefined();
  });

  it('omits coupon_code when couponCode is empty string', () => {
    const items = [makeItem(29990)];
    const snapshot = toCartSnapshot(items, 0);
    const payload = toOrderPayload(snapshot, formData, '');
    expect(payload.coupon_code).toBeUndefined();
  });

  it('items in payload match snapshot items (price-locked, not live cart)', () => {
    const items = [makeItem(29990)];
    const snapshot = toCartSnapshot(items, 0);
    const payload = toOrderPayload(snapshot, formData, 'PROMO');
    expect(payload.items).toBe(snapshot.items);
  });

  it('payload items include image_url when product has one', () => {
    const items = [makeItem(29990)];
    const snapshot = toCartSnapshot(items, 0);
    const payload = toOrderPayload(snapshot, formData);
    expect(payload.items[0].image_url).toBe('https://images.unsplash.com/test');
  });

  it('assembles full customer fields', () => {
    const items = [makeItem(29990)];
    const snapshot = toCartSnapshot(items, 0);
    const payload = toOrderPayload(snapshot, { ...formData, apartment: 'Depto 4' });
    expect(payload.customer_email).toBe('test@example.com');
    expect(payload.customer_name).toBe('Ana García');
    expect(payload.shipping_address).toContain('Depto 4');
  });
});
