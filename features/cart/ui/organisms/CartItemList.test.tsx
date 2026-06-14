/**
 * CARTUI-ORG-1
 * RTL test for CartItemList — empty state or one CartItemRow per item.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartItemList } from './CartItemList';
import type { CartItem } from '@/features/cart/domain/cart.types';

const makeItem = (id: number, name: string): CartItem => ({
  product: {
    product_id: id,
    internal_sku: `SKU-00${id}`,
    name,
    price: 10000,
    image_url: '',
  },
  quantity: 1,
});

describe('CartItemList', () => {
  it('renders CartEmptyState when items is empty (drawer variant)', () => {
    render(
      <CartItemList
        items={[]}
        variant="drawer"
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText(/vacío|vacio|empty/i)).toBeInTheDocument();
  });

  it('renders CartEmptyState when items is empty (page variant)', () => {
    render(
      <CartItemList
        items={[]}
        variant="page"
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText(/vacío|vacio|empty/i)).toBeInTheDocument();
  });

  it('renders one row per item when items is non-empty', () => {
    const items = [makeItem(1, 'Anillo Jade'), makeItem(2, 'Collar Plata')];

    render(
      <CartItemList
        items={items}
        variant="drawer"
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText('Anillo Jade')).toBeInTheDocument();
    expect(screen.getByText('Collar Plata')).toBeInTheDocument();
  });

  it('does not render empty state when items is non-empty', () => {
    render(
      <CartItemList
        items={[makeItem(1, 'Product')]}
        variant="drawer"
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.queryByText(/vacío|vacio|empty/i)).not.toBeInTheDocument();
  });
});
