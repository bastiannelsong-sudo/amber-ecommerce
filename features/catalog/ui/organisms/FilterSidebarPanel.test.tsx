/**
 * CATUI-ORG-1 — FilterSidebarPanel RTL tests
 * RED phase: written before implementation.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { FilterSidebarPanel } from './FilterSidebarPanel';
import { emptyFilters } from '@/features/catalog/domain/catalog.types';

describe('FilterSidebarPanel', () => {
  it('renders without crash when given minimal required props', () => {
    render(
      <FilterSidebarPanel
        filters={emptyFilters}
        materialOptions={[]}
        styleOptions={[]}
        collectionOptions={[]}
        minPrice={0}
        maxPrice={100000}
        onFiltersChange={vi.fn()}
      />
    );

    // The sidebar panel should render an aside or container
    expect(document.body.firstChild).toBeTruthy();
  });

  it('renders material filter section when materialOptions provided', () => {
    render(
      <FilterSidebarPanel
        filters={emptyFilters}
        materialOptions={['plata', 'oro']}
        styleOptions={[]}
        collectionOptions={[]}
        minPrice={0}
        maxPrice={100000}
        onFiltersChange={vi.fn()}
      />
    );

    expect(screen.getByText('Material')).toBeInTheDocument();
  });

  it('renders collection filter section when collectionOptions provided', () => {
    render(
      <FilterSidebarPanel
        filters={emptyFilters}
        materialOptions={[]}
        styleOptions={[]}
        collectionOptions={[{ label: 'Anillos', value: 'anillos' }]}
        minPrice={0}
        maxPrice={100000}
        onFiltersChange={vi.fn()}
      />
    );

    expect(screen.getByText('Coleccion')).toBeInTheDocument();
  });
});
