/**
 * CATUI-ATOM-5 + CATUI-T4
 * RTL test for ViewModeToggle atom.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewModeToggle } from './ViewModeToggle';

describe('ViewModeToggle', () => {
  it('renders toggle buttons', () => {
    render(<ViewModeToggle value="grid-3" onChange={vi.fn()} />);
    // Should have at least one button
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('calls onChange with grid-4 when the 4-column button is clicked', () => {
    const onChange = vi.fn();
    render(<ViewModeToggle value="grid-3" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /4 columnas|grid.4/i }));
    expect(onChange).toHaveBeenCalledWith('grid-4');
  });

  it('calls onChange with list when the list button is clicked', () => {
    const onChange = vi.fn();
    render(<ViewModeToggle value="grid-3" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /lista|list/i }));
    expect(onChange).toHaveBeenCalledWith('list');
  });
});
