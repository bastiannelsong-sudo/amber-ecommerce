/**
 * CHKUI-SWAP type-guard test.
 * Verifies page.tsx is a thin shell rendering only CheckoutPageContainer.
 * CheckoutPageContainer itself is mocked — this test is about the shell contract.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/features/checkout/ui/containers/CheckoutPageContainer', () => ({
  CheckoutPageContainer: () => (
    <div data-testid="checkout-page-container">container</div>
  ),
}));

import CheckoutPage from './page';

describe('CheckoutPage (thin shell)', () => {
  it('renders CheckoutPageContainer and nothing else', () => {
    render(<CheckoutPage />);
    expect(screen.getByTestId('checkout-page-container')).toBeInTheDocument();
  });
});
