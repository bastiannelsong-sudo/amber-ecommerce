import { describe, it, expect } from 'vitest';
import { toCartProduct } from './cart.mapper';
import type { Product } from '@/app/lib/types';
import type { CartProduct } from '@/features/cart/domain/cart.types';

const fullProduct: Product = {
  product_id: 42,
  internal_sku: 'AMB-COL-042',
  name: 'Collar Estrella',
  stock: 10,
  stock_bodega: 5,
  cost: 15000,
  price: 49990,
  image_url: 'https://cdn.example.com/collar.jpg',
  slug: 'collar-estrella',
  product_type: 'necklace',
  material: 'silver',
  display_name: 'Collar Estrella Display',
  description: 'Beautiful necklace',
  compare_at_price: 59990,
};

const minimalProduct: Product = {
  product_id: 1,
  internal_sku: 'AMB-001',
  name: 'Minimal',
  stock: 5,
  stock_bodega: 0,
  cost: 0,
  price: 9990,
  image_url: 'https://cdn.example.com/minimal.jpg',
};

describe('toCartProduct', () => {
  it('maps required fields from Product to CartProduct', () => {
    const result = toCartProduct(fullProduct);

    expect(result.product_id).toBe(42);
    expect(result.internal_sku).toBe('AMB-COL-042');
    expect(result.name).toBe('Collar Estrella');
    expect(result.price).toBe(49990);
    expect(result.image_url).toBe('https://cdn.example.com/collar.jpg');
  });

  it('maps optional slug when present', () => {
    const result = toCartProduct(fullProduct);
    expect(result.slug).toBe('collar-estrella');
  });

  it('maps optional product_type when present', () => {
    const result = toCartProduct(fullProduct);
    expect(result.product_type).toBe('necklace');
  });

  it('omits fields not present in CartProduct (strip-down behavior)', () => {
    const result = toCartProduct(fullProduct);
    const r = result as unknown as Record<string, unknown>;
    expect(r.stock).toBeUndefined();
    expect(r.cost).toBeUndefined();
    expect(r.material).toBeUndefined();
    expect(r.description).toBeUndefined();
  });

  it('maps product without optional fields correctly', () => {
    const result = toCartProduct(minimalProduct);
    expect(result.product_id).toBe(1);
    expect(result.slug).toBeUndefined();
    expect(result.product_type).toBeUndefined();
  });

  it('returns a CartProduct-shaped object (type guard)', () => {
    const result: CartProduct = toCartProduct(fullProduct);
    // TypeScript assignment above validates structural type at compile time
    expect(result).toBeDefined();
  });
});
