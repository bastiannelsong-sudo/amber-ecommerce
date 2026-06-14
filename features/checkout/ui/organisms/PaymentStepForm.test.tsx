/**
 * CHKUI-ORG-2, CHKUI-T2
 * RTL test for PaymentStepForm — payment step organism.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentStepForm } from './PaymentStepForm';
import type { CheckoutFormData } from '@/features/checkout/domain/checkout.types';

const DEFAULT_FORM_DATA: CheckoutFormData = {
  email: 'test@test.com',
  firstName: 'Juan',
  lastName: 'Pérez',
  phone: '+56912345678',
  address: 'Av. Principal 123',
  apartment: '',
  region: 'RM',
  commune: 'Santiago',
  postalCode: '',
};

const SUMMARY = {
  subtotal: 29990,
  discount: 0,
  shipping: 4990,
  total: 34980,
};

describe('PaymentStepForm', () => {
  it('renders shipping summary info from formData', () => {
    render(
      <PaymentStepForm
        formData={DEFAULT_FORM_DATA}
        summary={SUMMARY}
        isProcessing={false}
        onBack={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText('test@test.com')).toBeInTheDocument();
    expect(screen.getByText(/Juan/i)).toBeInTheDocument();
  });

  it('renders MercadoPago info card', () => {
    render(
      <PaymentStepForm
        formData={DEFAULT_FORM_DATA}
        summary={SUMMARY}
        isProcessing={false}
        onBack={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    // MercadoPagoInfoCard contains multiple elements with "MercadoPago" text
    const mpElements = screen.getAllByText(/MercadoPago/i);
    expect(mpElements.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();

    render(
      <PaymentStepForm
        formData={DEFAULT_FORM_DATA}
        summary={SUMMARY}
        isProcessing={false}
        onBack={onBack}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /volver/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders submit button with idle label when not processing', () => {
    render(
      <PaymentStepForm
        formData={DEFAULT_FORM_DATA}
        summary={SUMMARY}
        isProcessing={false}
        onBack={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /pagar/i })).toBeInTheDocument();
  });

  it('shows loading state on submit button when isProcessing is true', () => {
    render(
      <PaymentStepForm
        formData={DEFAULT_FORM_DATA}
        summary={SUMMARY}
        isProcessing={true}
        onBack={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders PaymentTrustSignals list items', () => {
    render(
      <PaymentStepForm
        formData={DEFAULT_FORM_DATA}
        summary={SUMMARY}
        isProcessing={false}
        onBack={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBeGreaterThanOrEqual(3);
  });
});
