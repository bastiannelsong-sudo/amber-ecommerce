/**
 * CHKUI-ORG-1
 * Shipping step organism — composes SavedAddressPicker (existing app component),
 * ContactInfoForm, ShippingAddressForm, and CheckoutSubmitButton.
 * Pure props + callbacks. No store/hook/infrastructure imports.
 */
import React from 'react';
import SavedAddressPicker from '@/app/components/SavedAddressPicker';
import { ContactInfoForm } from '../molecules/ContactInfoForm';
import { ShippingAddressForm } from '../molecules/ShippingAddressForm';
import { CheckoutSubmitButton } from '../atoms/CheckoutSubmitButton';
import type { CheckoutFormData } from '@/features/checkout/domain/checkout.types';
import type { ChileGeoResponse, ChileCommune, CustomerAddress } from '@/app/lib/types';

export interface ShippingStepFormProps {
  formData: CheckoutFormData;
  selectedAddressId: number | null;
  geo: ChileGeoResponse | null;
  geoError: string | null;
  communesOfRegion: ChileCommune[];
  isLoading: boolean;
  onSelectSavedAddress: (address: CustomerAddress | null) => void;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onRetryGeo: () => void;
}

export const ShippingStepForm = ({
  formData,
  selectedAddressId,
  geo,
  geoError,
  communesOfRegion,
  isLoading,
  onSelectSavedAddress,
  onChange,
  onSubmit,
  onRetryGeo,
}: ShippingStepFormProps) => {
  return (
    <form
      onSubmit={onSubmit}
      aria-label="Información de Envío"
      className="bg-white p-5 sm:p-8 shadow-luxury"
    >
      <h2
        className="text-2xl sm:text-3xl font-light text-obsidian-900 mb-5 sm:mb-8 pb-4 border-b border-pearl-200"
        style={{ fontFamily: 'var(--font-cormorant)' }}
      >
        Información de Envío
      </h2>

      <SavedAddressPicker
        selectedId={selectedAddressId}
        onSelect={onSelectSavedAddress}
      />

      <div className="space-y-6 mt-4">
        <ContactInfoForm
          email={formData.email}
          firstName={formData.firstName}
          lastName={formData.lastName}
          phone={formData.phone}
          onChange={onChange}
        />

        <ShippingAddressForm
          formData={formData}
          geo={geo}
          geoError={geoError}
          communesOfRegion={communesOfRegion}
          onChange={onChange}
          onRetryGeo={onRetryGeo}
        />

        <CheckoutSubmitButton
          label="Continuar al Pago"
          isLoading={isLoading}
        />
      </div>
    </form>
  );
};
