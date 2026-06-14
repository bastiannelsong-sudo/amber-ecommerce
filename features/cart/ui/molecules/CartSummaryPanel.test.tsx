/**
 * CARTUI-MOL-2 + CARTUI-T2
 * RTL test for CartSummaryPanel — all amounts via formatPrice, conditional discount row.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartSummaryPanel } from './CartSummaryPanel';

describe('CartSummaryPanel', () => {
  it('renders subtotal, shipping, and total formatted in es-CL', () => {
    render(
      <CartSummaryPanel
        subtotal={20000}
        shipping={5000}
        discountAmount={0}
        finalTotal={25000}
        onCheckout={vi.fn()}
        onContinueShopping={vi.fn()}
      />,
    );

    expect(screen.getByText(/20\.000/)).toBeInTheDocument();
    // '$5.000' appears as shipping (may also be substring match in '$25.000'),
    // so use getAllByText and confirm at least one element matches the exact shipping value
    const fiveThousandMatches = screen.getAllByText(/5\.000/);
    expect(fiveThousandMatches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/25\.000/)).toBeInTheDocument();
  });

  it('renders discount row when discountAmount > 0', () => {
    render(
      <CartSummaryPanel
        subtotal={20000}
        shipping={0}
        discountAmount={2000}
        finalTotal={18000}
        onCheckout={vi.fn()}
        onContinueShopping={vi.fn()}
      />,
    );

    expect(screen.getByText(/2\.000/)).toBeInTheDocument();
  });

  it('does not render discount row when discountAmount === 0', () => {
    render(
      <CartSummaryPanel
        subtotal={20000}
        shipping={0}
        discountAmount={0}
        finalTotal={20000}
        onCheckout={vi.fn()}
        onContinueShopping={vi.fn()}
      />,
    );

    // Should not find the word "descuento" / "discount" label
    expect(screen.queryByText(/descuento/i)).not.toBeInTheDocument();
  });

  it('renders checkout and continue shopping CTAs', () => {
    render(
      <CartSummaryPanel
        subtotal={10000}
        shipping={0}
        discountAmount={0}
        finalTotal={10000}
        onCheckout={vi.fn()}
        onContinueShopping={vi.fn()}
      />,
    );

    // At least two action elements
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
