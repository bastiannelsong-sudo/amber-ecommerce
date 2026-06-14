/**
 * CATUI-MOL-1 + CATUI-T3
 * RTL tests for ProductCard molecule.
 * Covers: renders name+price, default onAddToCart invokes store, explicit spy overrides, no badge when no discount.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// --- Mock useCartStore ---
const mockAddItem = vi.fn();
vi.mock('@/app/lib/stores/cart.store', () => ({
  useCartStore: (selector: (s: { addItem: typeof mockAddItem }) => unknown) =>
    selector({ addItem: mockAddItem }),
}));

// --- Mock react-hot-toast ---
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import ProductCard from './ProductCard';
import type { Product } from '@/app/lib/types';
import { formatPrice } from '@/features/catalog/domain/catalog.rules';

const baseProduct: Product = {
  product_id: 1,
  name: 'Anillo Jade',
  display_name: 'Anillo Jade Display',
  price: 15990,
  compare_at_price: null,
  image_url: 'https://cdn.example.com/ring.jpg',
  slug: 'anillo-jade',
  stock: 10,
  category: { name: 'Anillos' },
} as unknown as Product;

const discountedProduct: Product = {
  ...baseProduct,
  product_id: 2,
  price: 10000,
  compare_at_price: 20000,
} as unknown as Product;

beforeEach(() => {
  mockAddItem.mockClear();
});

describe('ProductCard', () => {
  it('renders the product name', () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText('Anillo Jade Display')).toBeInTheDocument();
  });

  it('renders the price formatted via domain formatPrice', () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText(`$${formatPrice(15990)}`)).toBeInTheDocument();
  });

  it('does NOT render a discount badge when no compare_at_price', () => {
    render(<ProductCard product={baseProduct} />);
    // No percentage badge should appear
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('renders a discount badge when compare_at_price is provided', () => {
    render(<ProductCard product={discountedProduct} />);
    expect(screen.getByText(/-\d+%/)).toBeInTheDocument();
  });

  it('default onAddToCart invokes useCartStore().addItem when button clicked', () => {
    render(<ProductCard product={baseProduct} />);
    // The add-to-cart button is desktop-only (hidden on mobile via CSS), but still in DOM
    const btn = screen.getByRole('button', { name: /agregar al carrito/i });
    fireEvent.click(btn);
    expect(mockAddItem).toHaveBeenCalledTimes(1);
    expect(mockAddItem).toHaveBeenCalledWith(baseProduct, 1);
  });

  it('explicit onAddToCart spy overrides default and store is NOT called', () => {
    const spy = vi.fn();
    render(<ProductCard product={baseProduct} onAddToCart={spy} />);
    const btn = screen.getByRole('button', { name: /agregar al carrito/i });
    fireEvent.click(btn);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(mockAddItem).not.toHaveBeenCalled();
  });
});
