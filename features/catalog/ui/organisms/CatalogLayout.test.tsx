/**
 * CATUI-ORG-1 — CatalogLayout RTL tests
 * RED phase: written before implementation.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { CatalogLayout } from './CatalogLayout';

describe('CatalogLayout', () => {
  it('renders sidebar slot', () => {
    render(
      <CatalogLayout
        sidebar={<div data-testid="sidebar">Sidebar</div>}
        grid={<div data-testid="grid">Grid</div>}
      />
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders grid slot', () => {
    render(
      <CatalogLayout
        sidebar={<div data-testid="sidebar">Sidebar</div>}
        grid={<div data-testid="grid">Grid</div>}
      />
    );

    expect(screen.getByTestId('grid')).toBeInTheDocument();
  });

  it('renders both slots simultaneously', () => {
    render(
      <CatalogLayout
        sidebar={<div data-testid="sidebar">Sidebar</div>}
        grid={<div data-testid="grid">Grid</div>}
      />
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('grid')).toBeInTheDocument();
  });
});
