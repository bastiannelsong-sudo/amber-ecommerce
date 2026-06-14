/**
 * CATUI-ATOM-1 + CATUI-T4
 * RTL test for ProductCardImage atom.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductCardImage } from './ProductCardImage';

describe('ProductCardImage', () => {
  it('renders an img element with the correct alt text', () => {
    render(<ProductCardImage src="https://cdn.example.com/img.jpg" alt="Anillo de jade" />);
    const img = screen.getByRole('img', { name: 'Anillo de jade' });
    expect(img).toBeInTheDocument();
  });

  it('renders with a fallback when src is empty', () => {
    render(<ProductCardImage src="" alt="Product" fallback="/placeholder-product.svg" />);
    const img = screen.getByRole('img', { name: 'Product' });
    expect(img).toBeInTheDocument();
  });
});
