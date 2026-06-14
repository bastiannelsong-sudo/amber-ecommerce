/**
 * CATUI-MOL-2 + CATUI-T4
 * RTL test for CatalogControlsBar molecule.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CatalogControlsBar } from './CatalogControlsBar';

const sortOptions = [
  { value: 'newest' as const, label: 'Mas reciente' },
  { value: 'price-asc' as const, label: 'Menor precio' },
];

describe('CatalogControlsBar', () => {
  it('renders the product count', () => {
    render(
      <CatalogControlsBar
        count={42}
        viewMode="grid-3"
        sortValue="newest"
        sortOptions={sortOptions}
        onViewModeChange={vi.fn()}
        onSortChange={vi.fn()}
        onFilterOpen={vi.fn()}
        activeFilterCount={0}
      />
    );
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it('renders the sort dropdown', () => {
    render(
      <CatalogControlsBar
        count={10}
        viewMode="grid-3"
        sortValue="newest"
        sortOptions={sortOptions}
        onViewModeChange={vi.fn()}
        onSortChange={vi.fn()}
        onFilterOpen={vi.fn()}
        activeFilterCount={0}
      />
    );
    expect(screen.getByDisplayValue('Mas reciente')).toBeInTheDocument();
  });
});
