'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ecommerceService } from '../../lib/services/ecommerce.service';
import { useCartStore } from '../../lib/stores/cart.store';
import { trackPurchase } from '../../lib/analytics';
import type { EcommerceOrderSummary } from '../../lib/types';

type UiStatus = 'loading' | 'paid' | 'pending' | 'failed' | 'error';

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 15; // 30s total

function mapToUiStatus(orderStatus: string | undefined): UiStatus {
  if (
    orderStatus === 'paid' ||
    orderStatus === 'processing' ||
    orderStatus === 'shipped' ||
    orderStatus === 'delivered'
  ) {
    return 'paid';
  }
  if (orderStatus === 'cancelled' || orderStatus === 'refunded') {
    return 'failed';
  }
  // 'pending' o desconocido → pending (esperando webhook).
  return 'pending';
}

function ResultContent() {
  const searchParams = useSearchParams();
  const queryStatus = searchParams.get('status'); // success | failure | pending (de MP)
  const orderNumber = searchParams.get('order');
  const clearCart = useCartStore((state) => state.clearCart);

  // Snapshot del cart ANTES de limpiar - para que GA4 purchase tenga la lista real.
  const itemsBeforeClear = useRef(useCartStore.getState().items);
  const purchaseTracked = useRef(false);
  const cartCleared = useRef(false);

  const [order, setOrder] = useState<EcommerceOrderSummary | null>(null);
  const [uiStatus, setUiStatus] = useState<UiStatus>('loading');

  /**
   * Polling al backend hasta que el status sea terminal o se agoten reintentos.
   * MP redirige al cliente ANTES de procesar el webhook, asi que la orden
   * llega aca probablemente todavia en 'pending'. El polling espera al webhook.
   */
  const pollOrderStatus = useCallback(
    async (attempt: number) => {
      if (!orderNumber) {
        setUiStatus('error');
        return;
      }
      try {
        const fetched = await ecommerceService.getOrder(orderNumber);
        setOrder(fetched);
        const next = mapToUiStatus(fetched.status);

        // Si MP redirigio con failure y el polling sigue dando pending,
        // asumimos failed para no dejar al usuario en limbo.
        if (queryStatus === 'failure' && next === 'pending') {
          setUiStatus('failed');
          return;
        }

        if (next === 'paid') {
          setUiStatus('paid');

          // GA4 purchase: dedupe por orderNumber. Snapshot ANTES de clearCart.
          if (!purchaseTracked.current) {
            trackPurchase({
              transaction_id: orderNumber,
              value: itemsBeforeClear.current.reduce(
                (acc, ci) => acc + Number(ci.product.price) * ci.quantity,
                0,
              ),
              items: itemsBeforeClear.current,
            });
            purchaseTracked.current = true;
          }

          if (!cartCleared.current) {
            clearCart();
            cartCleared.current = true;
          }
          return;
        }

        if (next === 'failed') {
          setUiStatus('failed');
          return;
        }

        // pending: seguir polleando hasta agotar.
        if (attempt + 1 < POLL_MAX_ATTEMPTS) {
          setUiStatus('pending');
          setTimeout(() => pollOrderStatus(attempt + 1), POLL_INTERVAL_MS);
        } else {
          // Timeout: el webhook puede llegar tarde. UI lo refleja.
          setUiStatus('pending');
        }
      } catch {
        if (attempt + 1 < POLL_MAX_ATTEMPTS) {
          setTimeout(() => pollOrderStatus(attempt + 1), POLL_INTERVAL_MS);
        } else {
          setUiStatus('error');
        }
      }
      // clearCart es estable, queryStatus + orderNumber se leen desde closure.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [orderNumber, queryStatus],
  );

  useEffect(() => {
    pollOrderStatus(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  // ── Render ────────────────────────────────────────────────────────

  if (uiStatus === 'loading') {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-gold-500 border-t-transparent" />
        <p className="mt-4 text-platinum-600">Verificando tu pago...</p>
      </div>
    );
  }

  const config = {
    paid: {
      iconBg: 'bg-green-500',
      icon: 'M5 13l4 4L19 7',
      title: 'Pedido confirmado',
      message:
        'Gracias por tu compra. Recibiras un email de confirmacion con los detalles del envio.',
    },
    pending: {
      iconBg: 'bg-amber-gold-500',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'Pago en proceso',
      message:
        'Tu pago esta siendo procesado por MercadoPago. Esto puede tomar unos minutos. Te enviaremos un email cuando se confirme.',
    },
    failed: {
      iconBg: 'bg-red-500',
      icon: 'M6 18L18 6M6 6l12 12',
      title: 'Pago no completado',
      message:
        'Hubo un problema con tu pago. Tu carrito sigue intacto, podes intentar nuevamente.',
    },
    error: {
      iconBg: 'bg-platinum-400',
      icon: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
      title: 'No pudimos verificar el pago',
      message:
        'Ocurrio un error al consultar tu pedido. Si pagaste, contactanos por WhatsApp con tu numero de orden.',
    },
  }[uiStatus];

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 ${config.iconBg}`}
      >
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
        </svg>
      </div>

      <h1
        className="text-4xl lg:text-5xl font-light text-obsidian-900 mb-4"
        style={{ fontFamily: 'var(--font-cormorant)' }}
      >
        {config.title}
      </h1>

      <p className="text-lg text-platinum-700 mb-8">{config.message}</p>

      {order && (
        <div className="bg-amber-gold-50 border border-amber-gold-200 p-6 rounded-lg mb-8 inline-block">
          <p className="text-sm text-amber-gold-700 mb-1 uppercase tracking-wider">
            Numero de Orden
          </p>
          <p
            className="text-3xl font-medium text-obsidian-900"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            #{order.order_number}
          </p>
          {order.total != null && (
            <p className="text-sm text-amber-gold-700 mt-2">
              Total: ${Number(order.total).toLocaleString('es-CL')}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        {uiStatus === 'failed' && (
          <Link
            href="/checkout"
            className="px-8 py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors"
          >
            Reintentar pago
          </Link>
        )}
        <Link
          href="/"
          className="px-8 py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors"
        >
          Ir al inicio
        </Link>
        <Link
          href="/catalogo"
          className="px-8 py-4 border-2 border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors"
        >
          Seguir comprando
        </Link>
      </div>

      {uiStatus === 'pending' && (
        <p className="mt-8 text-xs text-platinum-500">
          Esta pagina se actualiza automaticamente. No es necesario refrescar.
        </p>
      )}
    </div>
  );
}

export default function CheckoutResultPage() {
  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />
      <Suspense
        fallback={
          <div className="py-24 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-gold-500 border-t-transparent" />
          </div>
        }
      >
        <ResultContent />
      </Suspense>
      <Footer />
    </div>
  );
}
