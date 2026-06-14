/**
 * CHKUI-ORG-1, CHKUI-T2
 * RTL test for ShippingStepForm — shipping step organism.
 * SavedAddressPicker mocked to eliminate store/service side effects.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShippingStepForm } from './ShippingStepForm';
import type { ChileGeoResponse } from '@/app/lib/types';
import type { CheckoutFormData } from '@/features/checkout/domain/checkout.types';

vi.mock('@/app/components/SavedAddressPicker', () => ({
  default: () => null,
}));

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

const mockGeo: ChileGeoResponse = {
  regions: [
    {
      id: 1,
      short_name: 'RM',
      full_name: 'Región Metropolitana',
      capital: 'Santiago',
      communes: [{ name: 'Santiago' }, { name: 'Providencia' }],
    },
  ],
  total_regions: 1,
  total_communes: 2,
};

const COMMUNES_RM = [{ name: 'Santiago' }, { name: 'Providencia' }];

describe('ShippingStepForm', () => {
  it('renders email input from formData', () => {
    render(
      <ShippingStepForm
        formData={DEFAULT_FORM_DATA}
        selectedAddressId={null}
        geo={mockGeo}
        geoError={null}
        communesOfRegion={COMMUNES_RM}
        isLoading={false}
        onSelectSavedAddress={vi.fn()}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onRetryGeo={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue('test@test.com')).toBeInTheDocument();
  });

  it('renders address input from formData', () => {
    render(
      <ShippingStepForm
        formData={DEFAULT_FORM_DATA}
        selectedAddressId={null}
        geo={mockGeo}
        geoError={null}
        communesOfRegion={COMMUNES_RM}
        isLoading={false}
        onSelectSavedAddress={vi.fn()}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onRetryGeo={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue('Av. Principal 123')).toBeInTheDocument();
  });

  it('renders submit button in idle state', () => {
    render(
      <ShippingStepForm
        formData={DEFAULT_FORM_DATA}
        selectedAddressId={null}
        geo={mockGeo}
        geoError={null}
        communesOfRegion={COMMUNES_RM}
        isLoading={false}
        onSelectSavedAddress={vi.fn()}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onRetryGeo={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /continuar al pago/i })).toBeInTheDocument();
  });

  it('renders geo error banner when geoError is set', () => {
    render(
      <ShippingStepForm
        formData={DEFAULT_FORM_DATA}
        selectedAddressId={null}
        geo={null}
        geoError="No se pudo cargar regiones."
        communesOfRegion={[]}
        isLoading={false}
        onSelectSavedAddress={vi.fn()}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onRetryGeo={vi.fn()}
      />,
    );

    expect(screen.getByText(/No se pudo cargar regiones/i)).toBeInTheDocument();
  });

  it('calls onSubmit when form is submitted', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());

    render(
      <ShippingStepForm
        formData={DEFAULT_FORM_DATA}
        selectedAddressId={null}
        geo={mockGeo}
        geoError={null}
        communesOfRegion={COMMUNES_RM}
        isLoading={false}
        onSelectSavedAddress={vi.fn()}
        onChange={vi.fn()}
        onSubmit={onSubmit}
        onRetryGeo={vi.fn()}
      />,
    );

    fireEvent.submit(screen.getByRole('form'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on submit button when isLoading is true', () => {
    render(
      <ShippingStepForm
        formData={DEFAULT_FORM_DATA}
        selectedAddressId={null}
        geo={mockGeo}
        geoError={null}
        communesOfRegion={COMMUNES_RM}
        isLoading={true}
        onSelectSavedAddress={vi.fn()}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onRetryGeo={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
