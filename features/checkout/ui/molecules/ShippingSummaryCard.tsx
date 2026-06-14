/**
 * CHKUI-MOL-3
 * Presentational molecule — read-only shipping summary display.
 * Pure props, no store/hook imports.
 */
import type { CheckoutFormData } from '@/features/checkout/domain/checkout.types';

interface ShippingSummaryCardProps {
  formData: CheckoutFormData;
}

export const ShippingSummaryCard = ({ formData }: ShippingSummaryCardProps) => {
  const fullName = `${formData.firstName} ${formData.lastName}`.trim();
  const addressLine = formData.apartment
    ? `${formData.address}, ${formData.apartment}`
    : formData.address;

  return (
    <div className="bg-white p-5 sm:p-6 shadow-luxury space-y-4">
      <h3
        className="text-lg font-light text-obsidian-900 pb-3 border-b border-pearl-200"
        style={{ fontFamily: 'var(--font-cormorant)' }}
      >
        Información de envío
      </h3>

      <dl className="space-y-2 text-sm text-platinum-700">
        <div className="flex justify-between">
          <dt className="font-medium text-obsidian-900">Nombre</dt>
          <dd>{fullName}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-medium text-obsidian-900">Email</dt>
          <dd>{formData.email}</dd>
        </div>
        {formData.phone && (
          <div className="flex justify-between">
            <dt className="font-medium text-obsidian-900">Teléfono</dt>
            <dd>{formData.phone}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="font-medium text-obsidian-900">Dirección</dt>
          <dd>{addressLine}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-medium text-obsidian-900">Comuna</dt>
          <dd>{formData.commune}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-medium text-obsidian-900">Región</dt>
          <dd>{formData.region}</dd>
        </div>
        {formData.postalCode && (
          <div className="flex justify-between">
            <dt className="font-medium text-obsidian-900">C.P.</dt>
            <dd>{formData.postalCode}</dd>
          </div>
        )}
      </dl>
    </div>
  );
};
