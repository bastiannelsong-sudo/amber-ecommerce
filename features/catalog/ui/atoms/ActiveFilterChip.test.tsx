/**
 * CATUI-ATOM-2 + CATUI-T4
 * RTL test for ActiveFilterChip atom.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActiveFilterChip } from './ActiveFilterChip';

describe('ActiveFilterChip', () => {
  it('renders the label text', () => {
    render(<ActiveFilterChip label="plata" onRemove={vi.fn()} />);
    expect(screen.getByText('plata')).toBeInTheDocument();
  });

  it('calls onRemove when the remove button is clicked', () => {
    const onRemove = vi.fn();
    render(<ActiveFilterChip label="plata" onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: /quitar|remove/i }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
