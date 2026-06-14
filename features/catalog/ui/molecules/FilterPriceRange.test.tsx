/**
 * CATUI-MOL-2 + CATUI-T4
 * RTL test for FilterPriceRange molecule.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FilterPriceRange } from './FilterPriceRange';
import { formatPrice } from '@/features/catalog/domain/catalog.rules';

describe('FilterPriceRange', () => {
  it('renders formatPrice(min) in the DOM', () => {
    render(
      <FilterPriceRange
        min={5000}
        max={25000}
        priceMin={0}
        priceMax={0}
        onPriceChange={vi.fn()}
      />
    );
    const formatted = formatPrice(5000);
    // May appear in multiple elements (range label + input placeholder)
    const matches = screen.getAllByText(new RegExp(formatted));
    expect(matches.length).toBeGreaterThan(0);
  });

  it('renders formatPrice(max) in the DOM', () => {
    render(
      <FilterPriceRange
        min={5000}
        max={25000}
        priceMin={0}
        priceMax={0}
        onPriceChange={vi.fn()}
      />
    );
    const formatted = formatPrice(25000);
    const matches = screen.getAllByText(new RegExp(formatted));
    expect(matches.length).toBeGreaterThan(0);
  });
});
