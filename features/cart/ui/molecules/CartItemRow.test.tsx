/**
 * CARTUI-MOL-1 + CARTUI-T2
 * RTL test for CartItemRow — molecule composing CartItemImage + name + SKU + CartLinePrice + QuantityStepper.
 * Pure props, no store mocks needed.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartItemRow } from './CartItemRow';
import type { CartItem } from '@/features/cart/domain/cart.types';

const mockItem: CartItem = {
  product: {
    product_id: 42,
    internal_sku: 'SKU-001',
    name: 'Anillo Jade',
    price: 15990,
    image_url: 'https://cdn.example.com/ring.jpg',
  },
  quantity: 2,
};

describe('CartItemRow', () => {
  it('renders the product name from props', () => {
    render(
      <CartItemRow
        item={mockItem}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText('Anillo Jade')).toBeInTheDocument();
  });

  it('renders the product SKU from props', () => {
    render(
      <CartItemRow
        item={mockItem}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText(/SKU-001/)).toBeInTheDocument();
  });

  it('calls onIncrement when increment button clicked', () => {
    const onIncrement = vi.fn();

    render(
      <CartItemRow
        item={mockItem}
        onIncrement={onIncrement}
        onDecrement={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /aumentar|increment|\+/i }));

    expect(onIncrement).toHaveBeenCalledTimes(1);
  });

  it('renders the line price formatted correctly', () => {
    render(
      <CartItemRow
        item={mockItem}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    // 15990 * 2 = 31980 → formatPrice → '31.980'
    expect(screen.getByText(/31\.980/)).toBeInTheDocument();
  });
});
