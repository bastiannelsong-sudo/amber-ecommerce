/**
 * CATUI-MOL-2 + CATUI-T4
 * RTL test for AllProductsShown molecule.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AllProductsShown } from './AllProductsShown';

describe('AllProductsShown', () => {
  it('renders without crash', () => {
    const { container } = render(<AllProductsShown total={48} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders the total product count', () => {
    render(<AllProductsShown total={48} />);
    expect(screen.getByText(/48/)).toBeInTheDocument();
  });

  it('renders "has visto todos" message', () => {
    render(<AllProductsShown total={48} />);
    expect(screen.getByText(/has visto todos|todos los productos/i)).toBeInTheDocument();
  });
});
