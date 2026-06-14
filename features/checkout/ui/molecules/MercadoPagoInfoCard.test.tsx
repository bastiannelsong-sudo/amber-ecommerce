/**
 * CHKUI-MOL-4, CHKUI-T2
 * RTL test for MercadoPagoInfoCard — static MP content.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MercadoPagoInfoCard } from './MercadoPagoInfoCard';

describe('MercadoPagoInfoCard', () => {
  it('renders MercadoPago static content', () => {
    render(<MercadoPagoInfoCard />);
    // Should render at least one mention of MercadoPago
    const elements = screen.getAllByText(/mercadopago/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('does not require any props', () => {
    // Should render without error
    expect(() => render(<MercadoPagoInfoCard />)).not.toThrow();
  });
});
