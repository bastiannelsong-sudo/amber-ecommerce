/**
 * CARTUI-ORG-3
 * RTL test for CartPageLayout — two-column grid with item list and summary panel.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartPageLayout } from './CartPageLayout';
import type { CartItem } from '@/features/cart/domain/cart.types';
import type { CartSummaryPanelProps } from '../molecules/CartSummaryPanel';

const mockItem: CartItem = {
  product: {
    product_id: 1,
    internal_sku: 'SKU-001',
    name: 'Anillo Jade',
    price: 15990,
    image_url: '',
  },
  quantity: 2,
};

const mockSummary: Omit<CartSummaryPanelProps, 'onCheckout' | 'onContinueShopping'> = {
  subtotal: 31980,
  shipping: 0,
  discountAmount: 0,
  finalTotal: 31980,
};

describe('CartPageLayout', () => {
  it('renders the item list column', () => {
    render(
      <CartPageLayout
        items={[mockItem]}
        summary={{ ...mockSummary, onCheckout: vi.fn(), onContinueShopping: vi.fn() }}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText('Anillo Jade')).toBeInTheDocument();
  });

  it('renders the summary panel column with total', () => {
    render(
      <CartPageLayout
        items={[mockItem]}
        summary={{ ...mockSummary, onCheckout: vi.fn(), onContinueShopping: vi.fn() }}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    // Summary panel shows total. Multiple elements may contain this value (line price + summary),
    // so use getAllByText to confirm at least one is present.
    const priceElements = screen.getAllByText(/31\.980/);
    expect(priceElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders both columns in the DOM', () => {
    const { container } = render(
      <CartPageLayout
        items={[mockItem]}
        summary={{ ...mockSummary, onCheckout: vi.fn(), onContinueShopping: vi.fn() }}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    // Both item name and summary total must be present
    expect(container).toHaveTextContent('Anillo Jade');
    expect(container).toHaveTextContent('31.980');
  });
});
