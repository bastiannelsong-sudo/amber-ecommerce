/**
 * CHKUI-ATOM-3, CHKUI-T2
 * RTL test for CheckoutSubmitButton — loading/idle states.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckoutSubmitButton } from './CheckoutSubmitButton';

describe('CheckoutSubmitButton', () => {
  describe('idle state', () => {
    it('renders label text when not loading', () => {
      render(<CheckoutSubmitButton label="Continuar" isLoading={false} />);
      expect(screen.getByRole('button', { name: /Continuar/i })).toBeInTheDocument();
    });

    it('button is not disabled when isLoading=false and disabled not set', () => {
      render(<CheckoutSubmitButton label="Pagar" isLoading={false} />);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('button is disabled when disabled prop is true', () => {
      render(<CheckoutSubmitButton label="Pagar" isLoading={false} disabled />);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('loading state', () => {
    it('button is disabled when isLoading=true', () => {
      render(<CheckoutSubmitButton label="Pagar" isLoading={true} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('loading indicator is visible when isLoading=true', () => {
      render(<CheckoutSubmitButton label="Pagar" isLoading={true} />);
      // loading indicator has role="status" or data-testid or aria label
      const indicator =
        screen.queryByRole('status') ??
        screen.queryByTestId('loading-indicator') ??
        document.querySelector('[aria-label*="ando"], [aria-label*="loading"], [class*="spin"]');
      expect(indicator).not.toBeNull();
    });

    it('calls onClick when provided and not loading', () => {
      const onClick = vi.fn();
      render(<CheckoutSubmitButton label="Continuar" isLoading={false} onClick={onClick} />);
      screen.getByRole('button').click();
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
