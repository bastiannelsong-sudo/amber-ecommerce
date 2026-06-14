/**
 * CHKUI-ORG-2
 * Payment step organism — composes ShippingSummaryCard, MercadoPagoInfoCard,
 * back button, CheckoutSubmitButton, and PaymentTrustSignals.
 * Pure props + callbacks. No store/hook/infrastructure imports.
 */
import React from 'react';
import { ShippingSummaryCard } from '../molecules/ShippingSummaryCard';
import { MercadoPagoInfoCard } from '../molecules/MercadoPagoInfoCard';
import { PaymentTrustSignals } from '../molecules/PaymentTrustSignals';
import { CheckoutSubmitButton } from '../atoms/CheckoutSubmitButton';
import type { CheckoutFormData } from '@/features/checkout/domain/checkout.types';

export interface PaymentSummary {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

export interface PaymentStepFormProps {
  formData: CheckoutFormData;
  summary: PaymentSummary;
  isProcessing: boolean;
  onBack: () => void;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}

export const PaymentStepForm = ({
  formData,
  summary,
  isProcessing,
  onBack,
  onSubmit,
}: PaymentStepFormProps) => {
  return (
    <form
      onSubmit={onSubmit}
      aria-label="Confirmar y Pagar"
      className="bg-white p-5 sm:p-8 shadow-luxury"
    >
      <h2
        className="text-2xl sm:text-3xl font-light text-obsidian-900 mb-5 sm:mb-8 pb-4 border-b border-pearl-200"
        style={{ fontFamily: 'var(--font-cormorant)' }}
      >
        Confirmar y Pagar
      </h2>

      <div className="space-y-6">
        <ShippingSummaryCard formData={formData} />

        <MercadoPagoInfoCard />

        <div className="flex flex-col-reverse sm:flex-row gap-4">
          <button
            type="button"
            onClick={onBack}
            disabled={isProcessing}
            className="flex-1 py-4 border-2 border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Volver
          </button>

          <div className="flex-1">
            <CheckoutSubmitButton
              label="Pagar con MercadoPago"
              isLoading={isProcessing}
            />
          </div>
        </div>

        <PaymentTrustSignals />

        {summary.total > 0 && (
          <div className="text-sm text-platinum-600 text-right">
            Total: ${summary.total.toLocaleString('es-CL')}
          </div>
        )}
      </div>
    </form>
  );
};
