'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ecommerceService } from '../../lib/services/ecommerce.service';
import { useCartStore } from '../../lib/stores/cart.store';

function ResultContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const orderNumber = searchParams.get('order');
  const clearCart = useCartStore((state) => state.clearCart);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderNumber) {
      loadOrder();
    }
    if (status === 'success') {
      clearCart();
    }
  }, [orderNumber, status]);

  const loadOrder = async () => {
    try {
      const data = await ecommerceService.getOrder(orderNumber!);
      setOrder(data);
    } catch {
      // Order not found
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-gold-500 border-t-transparent"></div>
        <p className="mt-4 text-platinum-600">Verificando pago...</p>
      </div>
    );
  }

  const isSuccess = status === 'success';
  const isPending = status === 'pending';

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      {/* Status icon */}
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 ${
          isSuccess ? 'bg-green-500' : isPending ? 'bg-amber-gold-500' : 'bg-red-500'
        }`}
      >
        {isSuccess ? (
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : isPending ? (
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      <h1
        className="text-4xl lg:text-5xl font-light text-obsidian-900 mb-4"
        style={{ fontFamily: 'var(--font-cormorant)' }}
      >
        {isSuccess
          ? 'Pedido Confirmado'
          : isPending
          ? 'Pago Pendiente'
          : 'Pago Rechazado'}
      </h1>

      <p className="text-lg text-platinum-700 mb-8">
        {isSuccess
          ? 'Gracias por tu compra. Recibirás un email de confirmacion.'
          : isPending
          ? 'Tu pago esta siendo procesado. Te notificaremos cuando se confirme.'
          : 'Hubo un problema con tu pago. Intenta nuevamente.'}
      </p>

      {order && (
        <div className="bg-amber-gold-50 border border-amber-gold-200 p-6 rounded-lg mb-8 inline-block">
          <p className="text-sm text-amber-gold-700 mb-1 uppercase tracking-wider">Numero de Orden</p>
          <p
            className="text-3xl font-medium text-obsidian-900"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            #{order.order_number}
          </p>
          {order.total && (
            <p className="text-sm text-amber-gold-700 mt-2">
              Total: ${Number(order.total).toLocaleString('es-CL')}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <Link
          href="/"
          className="px-8 py-4 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors"
        >
          Ir al Inicio
        </Link>
        <Link
          href="/catalogo"
          className="px-8 py-4 border-2 border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors"
        >
          Seguir Comprando
        </Link>
      </div>
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
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-gold-500 border-t-transparent"></div>
          </div>
        }
      >
        <ResultContent />
      </Suspense>
      <Footer />
    </div>
  );
}
