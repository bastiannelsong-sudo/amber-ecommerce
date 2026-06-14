/**
 * CARTUI-ATOM-1 + CARTUI-T2
 * RTL test for QuantityStepper — pure-props atom, no store involved.
 * Canonical pattern: render with explicit props, assert DOM + callbacks.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuantityStepper } from './QuantityStepper';

describe('QuantityStepper', () => {
  it('calls onIncrement when increment button clicked', () => {
    const onIncrement = vi.fn();
    const onDecrement = vi.fn();
    const onRemove = vi.fn();

    render(
      <QuantityStepper
        quantity={2}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onRemove={onRemove}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /increment|aumentar|\+/i }));

    expect(onIncrement).toHaveBeenCalledTimes(1);
    expect(onDecrement).not.toHaveBeenCalled();
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('calls onDecrement when decrement button clicked and quantity > 1', () => {
    const onIncrement = vi.fn();
    const onDecrement = vi.fn();
    const onRemove = vi.fn();

    render(
      <QuantityStepper
        quantity={3}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onRemove={onRemove}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /decrement|disminuir|-/i }));

    expect(onDecrement).toHaveBeenCalledTimes(1);
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('calls onRemove (not onDecrement) when decrement clicked at quantity === 1', () => {
    const onIncrement = vi.fn();
    const onDecrement = vi.fn();
    const onRemove = vi.fn();

    render(
      <QuantityStepper
        quantity={1}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onRemove={onRemove}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /decrement|disminuir|-/i }));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onDecrement).not.toHaveBeenCalled();
  });

  it('displays the current quantity', () => {
    render(
      <QuantityStepper
        quantity={5}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
