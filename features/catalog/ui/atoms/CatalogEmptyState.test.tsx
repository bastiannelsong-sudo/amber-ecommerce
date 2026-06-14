/**
 * CATUI-ATOM-3 + CATUI-T4
 * RTL test for CatalogEmptyState atom.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CatalogEmptyState } from './CatalogEmptyState';

describe('CatalogEmptyState', () => {
  it('renders a message indicating no products found', () => {
    render(<CatalogEmptyState onClearFilters={vi.fn()} />);
    // Both heading and description match — just confirm at least one is present
    const matches = screen.getAllByText(/sin resultados|no encontramos|empty/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('calls onClearFilters when the CTA button is clicked', () => {
    const onClearFilters = vi.fn();
    render(<CatalogEmptyState onClearFilters={onClearFilters} />);
    fireEvent.click(screen.getByRole('button', { name: /limpiar|clear/i }));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });
});
