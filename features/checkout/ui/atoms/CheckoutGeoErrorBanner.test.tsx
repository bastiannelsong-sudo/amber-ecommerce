/**
 * CHKUI-ATOM-4, CHKUI-T2
 * RTL test for CheckoutGeoErrorBanner — error message + retry trigger.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CheckoutGeoErrorBanner } from './CheckoutGeoErrorBanner';

describe('CheckoutGeoErrorBanner', () => {
  it('renders the error message', () => {
    render(
      <CheckoutGeoErrorBanner
        message="No se pudo cargar el listado de regiones."
        onRetry={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/No se pudo cargar el listado de regiones/i),
    ).toBeInTheDocument();
  });

  it('renders a retry button', () => {
    render(
      <CheckoutGeoErrorBanner
        message="Error al cargar regiones"
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(
      <CheckoutGeoErrorBanner message="Error" onRetry={onRetry} />,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
