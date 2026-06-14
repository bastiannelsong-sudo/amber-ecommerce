/**
 * CATUI-MOL-2 + CATUI-T4
 * RTL test for ActiveFilterChips molecule.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActiveFilterChips } from './ActiveFilterChips';
import type { ActiveFilters } from '@/features/catalog/domain/catalog.types';

const filtersWithActive: ActiveFilters = {
  collections: [],
  materials: ['plata', 'oro'],
  styles: ['minimalista'],
  priceMin: 0,
  priceMax: Infinity,
};

describe('ActiveFilterChips', () => {
  it('renders chips for each active material', () => {
    render(
      <ActiveFilterChips
        filters={filtersWithActive}
        onRemoveFilter={vi.fn()}
        onClearAll={vi.fn()}
      />
    );
    expect(screen.getByText('plata')).toBeInTheDocument();
    expect(screen.getByText('oro')).toBeInTheDocument();
  });

  it('renders a chip for active style', () => {
    render(
      <ActiveFilterChips
        filters={filtersWithActive}
        onRemoveFilter={vi.fn()}
        onClearAll={vi.fn()}
      />
    );
    expect(screen.getByText('minimalista')).toBeInTheDocument();
  });

  it('calls onClearAll when "clear all" button is clicked', () => {
    const onClearAll = vi.fn();
    render(
      <ActiveFilterChips
        filters={filtersWithActive}
        onRemoveFilter={vi.fn()}
        onClearAll={onClearAll}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /limpiar todo|clear all/i }));
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });
});
