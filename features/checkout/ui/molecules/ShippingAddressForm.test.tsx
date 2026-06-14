/**
 * CHKUI-MOL-2, CHKUI-T2
 * RTL test for ShippingAddressForm — geo error banner + commune options.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShippingAddressForm } from './ShippingAddressForm';
import type { ChileGeoResponse } from '@/app/lib/types';

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

const DEFAULT_FORM_DATA = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  apartment: '',
  region: 'RM',
  commune: '',
  postalCode: '',
};

const COMMUNES_RM = [{ name: 'Santiago' }, { name: 'Providencia' }];

describe('ShippingAddressForm', () => {
  it('does not render GEO error banner when geoError is null', () => {
    render(
      <ShippingAddressForm
        formData={DEFAULT_FORM_DATA}
        geo={mockGeo}
        geoError={null}
        communesOfRegion={COMMUNES_RM}
        onChange={vi.fn()}
        onRetryGeo={vi.fn()}
      />,
    );

    // No error banner text
    expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument();
  });

  it('renders GEO error banner when geoError is set', () => {
    render(
      <ShippingAddressForm
        formData={DEFAULT_FORM_DATA}
        geo={null}
        geoError="No se pudo cargar regiones."
        communesOfRegion={[]}
        onChange={vi.fn()}
        onRetryGeo={vi.fn()}
      />,
    );

    expect(screen.getByText(/No se pudo cargar regiones/i)).toBeInTheDocument();
  });

  it('renders commune options from communesOfRegion', () => {
    render(
      <ShippingAddressForm
        formData={DEFAULT_FORM_DATA}
        geo={mockGeo}
        geoError={null}
        communesOfRegion={COMMUNES_RM}
        onChange={vi.fn()}
        onRetryGeo={vi.fn()}
      />,
    );

    expect(screen.getByRole('option', { name: 'Santiago' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Providencia' })).toBeInTheDocument();
  });

  it('renders address input field', () => {
    render(
      <ShippingAddressForm
        formData={{ ...DEFAULT_FORM_DATA, address: 'Av. Principal 123' }}
        geo={mockGeo}
        geoError={null}
        communesOfRegion={COMMUNES_RM}
        onChange={vi.fn()}
        onRetryGeo={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue('Av. Principal 123')).toBeInTheDocument();
  });
});
