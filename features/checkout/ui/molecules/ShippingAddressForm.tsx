/**
 * CHKUI-MOL-2
 * Presentational molecule — shipping address form group.
 * Composes CheckoutFormField, CheckoutSelectField, CheckoutGeoErrorBanner atoms.
 * Pure props, no store/hook imports.
 */
import React from 'react';
import { CheckoutFormField } from '../atoms/CheckoutFormField';
import { CheckoutSelectField } from '../atoms/CheckoutSelectField';
import { CheckoutGeoErrorBanner } from '../atoms/CheckoutGeoErrorBanner';
import type { ChileGeoResponse, ChileRegion, ChileCommune } from '@/app/lib/types';
import type { CheckoutFormData } from '@/features/checkout/domain/checkout.types';

interface ShippingAddressFormProps {
  formData: CheckoutFormData;
  geo: ChileGeoResponse | null;
  geoError: string | null;
  communesOfRegion: ChileCommune[];
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
  onRetryGeo: () => void;
}

export const ShippingAddressForm = ({
  formData,
  geo,
  geoError,
  communesOfRegion,
  onChange,
  onRetryGeo,
}: ShippingAddressFormProps) => {
  const regionOptions = (geo?.regions ?? []).map((r: ChileRegion) => ({
    value: r.short_name,
    label: r.full_name,
  }));

  const communeOptions = communesOfRegion.map((c: ChileCommune) => ({
    value: c.name,
    label: c.name,
  }));

  return (
    <div className="space-y-4">
      {geoError && (
        <CheckoutGeoErrorBanner message={geoError} onRetry={onRetryGeo} />
      )}

      <CheckoutFormField
        label="Dirección"
        name="address"
        value={formData.address}
        onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
        placeholder="Av. Ejemplo 1234"
        required
      />

      <CheckoutFormField
        label="Departamento / Piso (opcional)"
        name="apartment"
        value={formData.apartment}
        onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
        placeholder="Depto 5B"
      />

      <CheckoutSelectField
        label="Región"
        name="region"
        value={formData.region}
        onChange={onChange as React.ChangeEventHandler<HTMLSelectElement>}
        options={regionOptions}
        disabled={!geo && !geoError}
        placeholder="Seleccioná una región"
      />

      <CheckoutSelectField
        label="Comuna"
        name="commune"
        value={formData.commune}
        onChange={onChange as React.ChangeEventHandler<HTMLSelectElement>}
        options={communeOptions}
        disabled={communeOptions.length === 0}
        placeholder="Seleccioná una comuna"
      />

      <CheckoutFormField
        label="Código Postal (opcional)"
        name="postalCode"
        value={formData.postalCode}
        onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
        placeholder="1234567"
      />
    </div>
  );
};
