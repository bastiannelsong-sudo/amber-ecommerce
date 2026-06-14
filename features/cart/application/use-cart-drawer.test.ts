/**
 * CARTUI-HOOK-1
 * Tests for useCartDrawer — thin selector wrappers over useCartStore.
 * Pattern: renderHook + act; Zustand store directly manipulated via getState().
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCartDrawer } from './use-cart-drawer';
import { useCartStore } from './cart.store';

// Reset store to initial state before each test
beforeEach(() => {
  useCartStore.getState().closeCart();
});

describe('useCartDrawer', () => {
  it('isOpen reflects store initial state (false)', () => {
    const { result } = renderHook(() => useCartDrawer());
    expect(result.current.isOpen).toBe(false);
  });

  it('isOpen is true after openCart is called', () => {
    const { result } = renderHook(() => useCartDrawer());

    act(() => {
      result.current.openCart();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('closeCart sets isOpen to false', () => {
    // Start open
    act(() => {
      useCartStore.getState().openCart();
    });

    const { result } = renderHook(() => useCartDrawer());
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.closeCart();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('toggleCart flips isOpen from false to true', () => {
    const { result } = renderHook(() => useCartDrawer());
    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.toggleCart();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('toggleCart flips isOpen from true to false', () => {
    act(() => {
      useCartStore.getState().openCart();
    });

    const { result } = renderHook(() => useCartDrawer());
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.toggleCart();
    });

    expect(result.current.isOpen).toBe(false);
  });
});
