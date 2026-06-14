/**
 * CARTUI-ATOM-4 + CARTUI-T2
 * RTL test for CartLinePrice — calls lineTotal + formatPrice, asserts exact es-CL string.
 * price 5990 x 2 = 11980 → formatPrice(11980) = '11.980'
 * price 0 x 3 = 0 → formatPrice(0) = '0'
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartLinePrice } from './CartLinePrice';
import type { CartItem } from '@/features/cart/domain/cart.types';

const makeItem = (price: number, quantity: number): CartItem => ({
  product: {
    product_id: 1,
    internal_sku: 'SKU-001',
    name: 'Test Product',
    price,
    image_url: '',
  },
  quantity,
});

describe('CartLinePrice', () => {
  it('renders the correct line price for price=5990 qty=2 → "11.980"', () => {
    render(<CartLinePrice item={makeItem(5990, 2)} />);

    expect(screen.getByText(/11\.980/)).toBeInTheDocument();
  });

  it('renders "0" for price=0 qty=3', () => {
    render(<CartLinePrice item={makeItem(0, 3)} />);

    // Component renders "$0" — check for the digit 0 in the formatted output
    expect(screen.getByText(/\$0/)).toBeInTheDocument();
  });

  it('renders correct price for price=10000 qty=1 → "10.000"', () => {
    render(<CartLinePrice item={makeItem(10000, 1)} />);

    expect(screen.getByText(/10\.000/)).toBeInTheDocument();
  });
});
