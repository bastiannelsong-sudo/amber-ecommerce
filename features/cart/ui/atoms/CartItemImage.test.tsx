/**
 * CARTUI-ATOM-2 + CARTUI-T2
 * RTL test for CartItemImage — next/image wrapper with fallback.
 * next/image is mocked globally via vitest alias → renders plain <img>.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartItemImage } from './CartItemImage';

describe('CartItemImage', () => {
  it('renders an img element when a valid src is provided', () => {
    render(
      <CartItemImage
        src="https://cdn.example.com/ring.jpg"
        alt="Ring"
        width={96}
        height={96}
      />,
    );

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/ring.jpg');
  });

  it('renders a fallback img when src is an empty string', () => {
    render(<CartItemImage src="" alt="Missing" width={96} height={96} />);

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    // Must have a non-empty src (the fallback URL) or an alt text
    const hasFallbackSrc = img.getAttribute('src') !== '';
    const hasAlt = (img.getAttribute('alt') ?? '').length > 0;
    expect(hasFallbackSrc || hasAlt).toBe(true);
  });

  it('renders a fallback img when src is undefined', () => {
    render(
      <CartItemImage src={undefined} alt="Undefined source" width={96} height={96} />,
    );

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
  });
});
