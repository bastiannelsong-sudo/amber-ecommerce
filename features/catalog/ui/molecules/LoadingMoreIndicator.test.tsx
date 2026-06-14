/**
 * CATUI-MOL-2 + CATUI-T4
 * RTL test for LoadingMoreIndicator molecule.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { LoadingMoreIndicator } from './LoadingMoreIndicator';

describe('LoadingMoreIndicator', () => {
  it('renders without crash', () => {
    const { container } = render(<LoadingMoreIndicator />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders 3 dot spans', () => {
    const { container } = render(<LoadingMoreIndicator />);
    // 3 animated dots + containing div = query for spans with catalog-dot class
    const dots = container.querySelectorAll('span.catalog-dot');
    expect(dots.length).toBe(3);
  });
});
