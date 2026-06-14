/**
 * CATUI-ATOM-6 + CATUI-T4
 * RTL test for PaginationProgress atom.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaginationProgress } from './PaginationProgress';

describe('PaginationProgress', () => {
  it('renders visible / total count', () => {
    render(<PaginationProgress visible={20} total={60} onLoadMore={vi.fn()} />);
    expect(screen.getByText(/20/)).toBeInTheDocument();
    expect(screen.getByText(/60/)).toBeInTheDocument();
  });

  it('calls onLoadMore when the load-more button is clicked', () => {
    const onLoadMore = vi.fn();
    render(<PaginationProgress visible={20} total={60} onLoadMore={onLoadMore} />);
    fireEvent.click(screen.getByRole('button', { name: /cargar|load more|ver más/i }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});
