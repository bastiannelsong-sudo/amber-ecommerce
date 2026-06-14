/**
 * CHKUI-CONT-1, CHKUI-T4, CHKUI-SWAP, CHKUI-FIX-S001, ADR-4
 *
 * Sole hook/store consumer in the checkout UI layer.
 * Owns the step state machine ('shipping' | 'payment').
 * Delegates ALL rendering to presentational organisms.
 *
 * Rules:
 * - Only this container imports hooks and the cart store (CHKUI-ARCH).
 * - Hydration guard: mounted state gates rendering (Zustand persist delay).
 * - trackBeginCheckout: called exactly once via useCheckoutForm (delegation).
 * - step: 'shipping' | 'payment' only ('confirmation' removed — CHKUI-FIX-MATHRANDOM).
 */
'use client';

import { useState } from 'react';
import CheckoutSkeleton from '@/app/components/skeletons/CheckoutSkeleton';
import CheckoutProgressBar from '@/app/components/marketing/CheckoutProgressBar';
import TrustBadges from '@/app/components/marketing/TrustBadges';
import { useCheckoutForm } from '@/features/checkout/application/use-checkout-form';
import { useCheckoutSubmit } from '@/features/checkout/application/use-checkout-submit';
import { useCheckoutSummary } from '@/features/checkout/application/use-checkout-summary';
import { useCartStore } from '@/app/lib/stores/cart.store';
import { ShippingStepForm } from '../organisms/ShippingStepForm';
import { PaymentStepForm } from '../organisms/PaymentStepForm';
import { CheckoutEmptyState } from '../organisms/CheckoutEmptyState';
import { CheckoutMobileStickyBar } from '../organisms/CheckoutMobileStickyBar';
import { CheckoutOrderSummary } from '../molecules/CheckoutOrderSummary';
import type { CheckoutStep } from '@/features/checkout/domain/checkout.types';

export function CheckoutPageContainer() {
  const [step, setStep] = useState<CheckoutStep>('shipping');

  // ─── Hooks (sole consumers per CHKUI-ARCH) ────────────────────────────────

  const {
    formData,
    selectedAddressId,
    geo,
    geoError,
    communesOfRegion,
    mounted,
    handleInputChange,
    handleSelectSavedAddress,
    handleSubmitShipping,
    retryGeo,
  } = useCheckoutForm();

  const { isProcessingPayment, handleSubmitPayment } = useCheckoutSubmit(formData);

  const { subtotal, discount, shipping, total } = useCheckoutSummary();

  // items for empty-state guard and order summary
  const items = useCartStore((state) => state.items);

  // ─── Hydration guard ──────────────────────────────────────────────────────

  if (!mounted) {
    return <CheckoutSkeleton />;
  }

  // ─── Empty cart state ─────────────────────────────────────────────────────

  if (items.length === 0) {
    return <CheckoutEmptyState />;
  }

  // ─── Step handlers ────────────────────────────────────────────────────────

  const onSubmitShipping = (e: React.FormEvent) => {
    handleSubmitShipping(e, setStep);
  };

  const onBack = () => setStep('shipping');

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 lg:px-8 py-6 sm:py-12">
      <CheckoutProgressBar currentStep={step} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
        {/* Main form column */}
        <div className="lg:col-span-2">
          {step === 'shipping' ? (
            <ShippingStepForm
              formData={formData}
              selectedAddressId={selectedAddressId}
              geo={geo}
              geoError={geoError}
              communesOfRegion={communesOfRegion}
              isLoading={false}
              onSelectSavedAddress={handleSelectSavedAddress}
              onChange={handleInputChange}
              onSubmit={onSubmitShipping}
              onRetryGeo={retryGeo}
            />
          ) : (
            <PaymentStepForm
              formData={formData}
              summary={{ subtotal, discount, shipping, total }}
              isProcessing={isProcessingPayment}
              onBack={onBack}
              onSubmit={handleSubmitPayment}
            />
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <CheckoutOrderSummary
            items={items.map((i) => ({
              product_id: i.product.product_id,
              name: i.product.name,
              internal_sku: i.product.internal_sku,
              quantity: i.quantity,
              unit_price: i.product.price,
              image_url: i.product.image_url,
            }))}
            subtotal={subtotal}
            discount={discount}
            shipping={shipping}
            total={total}
          />
          <TrustBadges layout="vertical" />
        </aside>
      </div>

      {/* Mobile sticky total bar */}
      <CheckoutMobileStickyBar total={total} step={step} />
    </div>
  );
}
