/**
 * CHKUI-T2
 * RTL test for CheckoutMobileStickyBar — mobile sticky total bar.
 * Pure props, no store/hook imports.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckoutMobileStickyBar } from './CheckoutMobileStickyBar';

describe('CheckoutMobileStickyBar', () => {
  it('renders total amount formatted in CLP', () => {
    render(<CheckoutMobileStickyBar total={34980} step="shipping" />);

    expect(screen.getByText(/34\.980/)).toBeInTheDocument();
  });

  it('renders shipping-step helper text on shipping step', () => {
    render(<CheckoutMobileStickyBar total={34980} step="shipping" />);

    expect(screen.getByText(/completá envío/i)).toBeInTheDocument();
  });

  it('renders payment-step helper text on payment step', () => {
    render(<CheckoutMobileStickyBar total={34980} step="payment" />);

    expect(screen.getByText(/listo para pagar/i)).toBeInTheDocument();
  });

  it('renders total label', () => {
    render(<CheckoutMobileStickyBar total={0} step="shipping" />);

    expect(screen.getByText(/total/i)).toBeInTheDocument();
  });
});
