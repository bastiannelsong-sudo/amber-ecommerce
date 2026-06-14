/**
 * CHKUI-HOOK-2, CHK-A5, ADR-5 (sanitizePhone boundary), LOCKED #1 and #2
 *
 * Deferred hook — extracted from app/checkout/page.tsx inline logic.
 * Handles order creation and MP redirect.
 *
 * Rules:
 * - No JSX.
 * - sanitizePhone applied HERE at payload boundary (NOT inside toOrderPayload — LOCKED #1).
 * - apiClient.post('/orders', payload) called DIRECTLY — NOT via ecommerceService (LOCKED #2).
 * - submitGuard ref prevents double-submit.
 */
import { useRef, useState } from 'react';
import { apiClient, ApiError } from '@/app/lib/api-client';
import { useCartStore } from '@/app/lib/stores/cart.store';
import { sanitizePhone } from '@/features/checkout/domain/checkout.rules';
import { toCartSnapshot, toOrderPayload } from '@/features/checkout/application/checkout.mapper';
import toast from 'react-hot-toast';
import type { CheckoutFormData } from '@/features/checkout/domain/checkout.types';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCheckoutSubmit = (formData: CheckoutFormData) => {
  const items = useCartStore((state) => state.items);
  const appliedCoupon = useCartStore((state) => state.appliedCoupon);
  const discountAmount = useCartStore((state) => state.discountAmount);

  const submitGuard = useRef(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitGuard.current) return;
    submitGuard.current = true;
    setIsProcessingPayment(true);

    try {
      const snapshot = toCartSnapshot(items, discountAmount);

      // sanitizePhone at payload boundary (ADR-5 — LOCKED #1)
      const formDataWithCleanPhone: CheckoutFormData = {
        ...formData,
        phone: sanitizePhone(formData.phone),
      };

      const payload = toOrderPayload(snapshot, formDataWithCleanPhone, appliedCoupon);

      // Direct apiClient.post — NOT ecommerceService (LOCKED #2)
      const res = await apiClient.post<{
        order: { order_number: string };
        init_point: string;
      }>('/orders', payload);

      if (!res.data?.init_point) {
        throw new Error(
          'MercadoPago no respondió a tiempo. Intentá de nuevo en unos segundos.',
        );
      }

      toast.success('Redirigiendo a MercadoPago...');
      window.location.href = res.data.init_point;
    } catch (err) {
      const backendMessage =
        err instanceof ApiError &&
        typeof err.data === 'object' &&
        err.data &&
        'error' in err.data
          ? String((err.data as { error?: string }).error)
          : err instanceof Error
            ? err.message
            : null;

      toast.error(
        backendMessage ||
          'No pudimos iniciar el pago. Revisá tu conexión y volvé a intentar — tu carrito sigue intacto.',
      );
      submitGuard.current = false;
      setIsProcessingPayment(false);
    }
  };

  return {
    isProcessingPayment,
    handleSubmitPayment,
  };
};
