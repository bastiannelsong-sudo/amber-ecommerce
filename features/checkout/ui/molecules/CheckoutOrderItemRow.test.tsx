/**
 * CHKUI-MOL-6, CHKUI-T2
 * RTL test for CheckoutOrderItemRow — renders from CartSnapshot item shape.
 * MUST NOT import from features/cart/ui/ (ADR-1, CHKUI-ARCH).
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckoutOrderItemRow } from './CheckoutOrderItemRow';
import type { CartSnapshot } from '@/features/checkout/domain/checkout.types';

type SnapshotItem = CartSnapshot['items'][number];

const MOCK_ITEM: SnapshotItem = {
  product_id: 1,
  name: 'Anillo de Oro',
  internal_sku: 'SKU-001',
  quantity: 2,
  unit_price: 49990,
  image_url: undefined,
};

describe('CheckoutOrderItemRow', () => {
  it('renders item name', () => {
    render(<CheckoutOrderItemRow item={MOCK_ITEM} />);
    expect(screen.getByText('Anillo de Oro')).toBeInTheDocument();
  });

  it('renders item quantity', () => {
    render(<CheckoutOrderItemRow item={MOCK_ITEM} />);
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('renders unit_price (formatted or raw)', () => {
    render(<CheckoutOrderItemRow item={MOCK_ITEM} />);
    // Accept either "$49.990", "49990", "49,990" etc.
    expect(screen.getByText(/49[\.,]?990/)).toBeInTheDocument();
  });

  it('renders item with image when image_url provided', () => {
    render(
      <CheckoutOrderItemRow
        item={{ ...MOCK_ITEM, image_url: 'https://example.com/ring.jpg' }}
      />,
    );
    // img should be present
    const img = screen.queryByRole('img');
    expect(img).toBeInTheDocument();
  });
});
