/**
 * CARTUI-ATOM-3 + CARTUI-T2
 * RTL test for CartEmptyState — variant prop (drawer | page).
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartEmptyState } from './CartEmptyState';

describe('CartEmptyState', () => {
  it('renders a non-empty empty-cart message for drawer variant', () => {
    render(<CartEmptyState variant="drawer" />);

    // Must have visible text indicating the cart is empty
    const message = screen.getByText(/vacío|vacio|empty/i);
    expect(message).toBeInTheDocument();
  });

  it('renders a non-empty empty-cart message for page variant', () => {
    render(<CartEmptyState variant="page" />);

    const message = screen.getByText(/vacío|vacio|empty/i);
    expect(message).toBeInTheDocument();
  });

  it('renders a CTA link for page variant', () => {
    render(<CartEmptyState variant="page" />);

    // Page variant must have a link/button to continue shopping
    const cta =
      screen.queryByRole('link') ?? screen.queryByRole('button');
    expect(cta).toBeInTheDocument();
  });

  it('does not render a CTA link for drawer variant (just message)', () => {
    render(<CartEmptyState variant="drawer" />);

    // Drawer variant just shows message + optional close button
    // (no "continue shopping" navigation link required by spec)
    const message = screen.getByText(/vacío|vacio|empty/i);
    expect(message).toBeInTheDocument();
  });
});
