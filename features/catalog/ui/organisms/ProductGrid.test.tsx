/**
 * CATUI-ORG-1 — ProductGrid RTL tests
 * RED phase: written before implementation.
 * Mock IntersectionObserver per design ADR #8.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ─── Mock IntersectionObserver ────────────────────────────────────────────────
const observeMock = vi.fn();
const unobserveMock = vi.fn();
const disconnectMock = vi.fn();

vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe = observeMock;
    unobserve = unobserveMock;
    disconnect = disconnectMock;
    constructor() {}
  }
);

// ─── Mock ProductCard so tests don't pull in next/image etc. ──────────────────
vi.mock('@/features/catalog/ui/molecules/ProductCard', () => ({
  default: ({ product }: { product: { name: string } }) => (
    <div data-testid="product-card">{product.name}</div>
  ),
}));

import { ProductGrid } from './ProductGrid';
import type { Product } from '@/app/lib/types';

const makeProduct = (id: number): Product =>
  ({
    product_id: id,
    name: `Product ${id}`,
    price: 10000,
    image_url: '',
    slug: `product-${id}`,
    stock: 5,
    category: { name: 'Joyeria' },
  } as unknown as Product);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProductGrid', () => {
  it('renders emptyState when products is empty', () => {
    render(
      <ProductGrid
        products={[]}
        onAddToCart={vi.fn()}
        emptyState={<div data-testid="empty-state">No products</div>}
        onReachEnd={vi.fn()}
        viewMode="grid-3"
      />
    );

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('product-card')).not.toBeInTheDocument();
  });

  it('renders product cards when products are present', () => {
    const products = [makeProduct(1), makeProduct(2)];

    render(
      <ProductGrid
        products={products}
        onAddToCart={vi.fn()}
        emptyState={<div data-testid="empty-state">No products</div>}
        onReachEnd={vi.fn()}
        viewMode="grid-3"
      />
    );

    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('product-card')).toHaveLength(2);
  });

  it('mounts IntersectionObserver on the sentinel', () => {
    render(
      <ProductGrid
        products={[makeProduct(1)]}
        onAddToCart={vi.fn()}
        emptyState={<div>No products</div>}
        onReachEnd={vi.fn()}
        viewMode="grid-3"
      />
    );

    expect(observeMock).toHaveBeenCalled();
  });

  it('does not mount IntersectionObserver when products is empty', () => {
    render(
      <ProductGrid
        products={[]}
        onAddToCart={vi.fn()}
        emptyState={<div>No products</div>}
        onReachEnd={vi.fn()}
        viewMode="grid-3"
      />
    );

    // sentinel not rendered when empty, observer not called
    expect(observeMock).not.toHaveBeenCalled();
  });
});
