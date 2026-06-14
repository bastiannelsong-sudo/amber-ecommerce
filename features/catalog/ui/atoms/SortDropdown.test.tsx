/**
 * CATUI-ATOM-4 + CATUI-T4
 * RTL test for SortDropdown atom.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SortDropdown } from './SortDropdown';
import type { SortOption } from '@/features/catalog/domain/catalog.types';

const options = [
  { value: 'newest' as SortOption, label: 'Mas reciente' },
  { value: 'price-asc' as SortOption, label: 'Menor precio' },
];

describe('SortDropdown', () => {
  it('renders the current selected value', () => {
    render(<SortDropdown value="newest" options={options} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('Mas reciente')).toBeInTheDocument();
  });

  it('calls onChange with the new value when selection changes', () => {
    const onChange = vi.fn();
    render(<SortDropdown value="newest" options={options} onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'price-asc' } });
    expect(onChange).toHaveBeenCalledWith('price-asc');
  });
});
