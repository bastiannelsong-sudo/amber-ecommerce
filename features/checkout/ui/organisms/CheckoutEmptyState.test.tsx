/**
 * CHKUI-ORG-3, CHKUI-T2
 * RTL test for CheckoutEmptyState — empty cart display with CTA.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckoutEmptyState } from './CheckoutEmptyState';

describe('CheckoutEmptyState', () => {
  it('renders empty cart heading', () => {
    render(<CheckoutEmptyState />);

    expect(screen.getByRole('heading', { name: /carrito/i })).toBeInTheDocument();
  });

  it('renders CTA link to catalog', () => {
    render(<CheckoutEmptyState />);

    const cta = screen.getByRole('link', { name: /explorar/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('href', '/catalogo');
  });

  it('renders descriptive copy', () => {
    render(<CheckoutEmptyState />);

    expect(screen.getByText(/agrega/i)).toBeInTheDocument();
  });
});
