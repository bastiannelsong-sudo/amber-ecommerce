/**
 * CHKUI-MOL-7, CHKUI-T2
 * RTL test for CheckoutOrderSummary — item rows + totals.
 * MUST NOT import from features/cart/ui/ (ADR-1, CHKUI-ARCH).
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckoutOrderSummary } from './CheckoutOrderSummary';
import type { CartSnapshot } from '@/features/checkout/domain/checkout.types';

type SnapshotItem = CartSnapshot['items'][number];

const MOCK_ITEMS: SnapshotItem[] = [
  {
    product_id: 1,
    name: 'Collar de plata',
    internal_sku: 'SKU-001',
    quantity: 1,
    unit_price: 30000,
  },
  {
    product_id: 2,
    name: 'Pulsera dorada',
    internal_sku: 'SKU-002',
    quantity: 2,
    unit_price: 25000,
  },
];

describe('CheckoutOrderSummary', () => {
  it('renders all item names', () => {
    render(
      <CheckoutOrderSummary
        items={MOCK_ITEMS}
        subtotal={80000}
        discount={0}
        shipping={0}
        total={80000}
      />,
    );

    expect(screen.getByText('Collar de plata')).toBeInTheDocument();
    expect(screen.getByText('Pulsera dorada')).toBeInTheDocument();
  });

  it('renders subtotal value', () => {
    render(
      <CheckoutOrderSummary
        items={MOCK_ITEMS}
        subtotal={80000}
        discount={0}
        shipping={0}
        total={80000}
      />,
    );

    // Accept formatted or raw price
    expect(screen.getAllByText(/80[\.,]?000/).length).toBeGreaterThan(0);
  });

  it('renders discount when non-zero', () => {
    render(
      <CheckoutOrderSummary
        items={MOCK_ITEMS}
        subtotal={80000}
        discount={5000}
        shipping={0}
        total={75000}
      />,
    );

    // The discount row should show -$5.000 (or similar)
    expect(screen.getByText(/-.*5[\.,]?000/)).toBeInTheDocument();
  });

  it('renders total value', () => {
    render(
      <CheckoutOrderSummary
        items={MOCK_ITEMS}
        subtotal={80000}
        discount={0}
        shipping={3000}
        total={83000}
      />,
    );

    expect(screen.getByText(/83[\.,]?000/)).toBeInTheDocument();
  });
});
