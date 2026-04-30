import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getOrderByNumber } from '../../lib/server-api/orders';
import { getSession } from '../../lib/session';
import PrintButton from './PrintButton';
import type { EcommerceOrderDetail } from '../../lib/types';

export const metadata: Metadata = {
  title: 'Comprobante de compra | Amber Nelson',
  // Robots: el comprobante contiene PII (email, direccion). No queremos
  // que sea indexable aunque el order_number sea opaco.
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ email?: string }>;
}

/**
 * Verifica que el visitante tiene derecho a ver esta orden.
 *
 * Reglas:
 *   - Si hay sesion logueada y el customer_id de la orden matchea con
 *     el de la sesion → permitido.
 *   - Si NO hay sesion (guest), debe llegar con `?email=` en la URL
 *     (el email se manda en el link de confirmacion por mail) y debe
 *     matchear con order.customer_email (case-insensitive, trimmed).
 *   - Cualquier otro caso → 404 (notFound).
 *
 * Por que 404 en vez de 401/403: no queremos confirmar la existencia
 * del order_number a alguien que no tiene como verlo. Todos los
 * accesos invalidos son indistinguibles de "esta orden no existe".
 *
 * Tradeoff: no bloqueamos enumeracion si tienen el order_number Y
 * el email correcto (los dos vienen en el email de confirmacion al
 * mismo cliente). El email actua como "token compartido". No es
 * cripto-seguro pero es el patron estandar en ecommerce (Shopify,
 * WooCommerce hacen igual) y suficiente para PII de bajo valor.
 */
function canAccessOrder(
  order: { customer_id?: number | null; customer_email: string },
  session: { user_id: number } | null,
  emailParam: string | undefined,
): boolean {
  // Logged user que es el dueño de la orden.
  if (session && order.customer_id != null && order.customer_id === session.user_id) {
    return true;
  }

  // Guest con email en la URL que matchea.
  if (emailParam) {
    const provided = emailParam.trim().toLowerCase();
    const stored = order.customer_email.trim().toLowerCase();
    if (provided && provided === stored) {
      return true;
    }
  }

  return false;
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pendiente de pago', cls: 'bg-amber-gold-100 text-amber-gold-800' },
  paid: { label: 'Pagado', cls: 'bg-green-100 text-green-800' },
  processing: { label: 'En preparación', cls: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'Enviado', cls: 'bg-blue-100 text-blue-800' },
  delivered: { label: 'Entregado', cls: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', cls: 'bg-red-100 text-red-800' },
  refunded: { label: 'Reembolsado', cls: 'bg-platinum-200 text-platinum-700' },
};

/**
 * MP retorna `payment_method_id` con valores como "visa", "master", "amex",
 * "account_money", "webpay", etc. Aca mapeamos los mas comunes a un label
 * amigable. Para los desconocidos retornamos el id capitalizado.
 */
function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return 'MercadoPago';
  const map: Record<string, string> = {
    visa: 'Visa',
    master: 'Mastercard',
    amex: 'American Express',
    diners: 'Diners Club',
    naranja: 'Naranja',
    cabal: 'Cabal',
    magna: 'Magna',
    redcompra: 'RedCompra',
    webpay: 'Webpay',
    account_money: 'Dinero en MercadoPago',
    debin_transfer: 'Transferencia bancaria',
    bank_transfer: 'Transferencia bancaria',
    ticket: 'Pago en efectivo',
  };
  return map[method] ?? method.charAt(0).toUpperCase() + method.slice(1);
}

function formatCLP(value: number | string): string {
  const n = Number(value);
  if (Number.isNaN(n)) return '$0';
  return `$${n.toLocaleString('es-CL')}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default async function OrderReceiptPage({
  params,
  searchParams,
}: PageProps) {
  const { orderNumber } = await params;
  const { email: emailParam } = await searchParams;
  const order = await getOrderByNumber(orderNumber);

  if (!order) {
    notFound();
  }

  const session = await getSession();
  if (!canAccessOrder(order, session, emailParam)) {
    // 404 en vez de 401: no confirmamos la existencia del order_number
    // a alguien que no tiene derecho a verlo.
    notFound();
  }

  return (
    <div className="min-h-screen bg-pearl-50">
      <div className="print-hide">
        <Header />
      </div>

      <main className="container mx-auto px-4 lg:px-8 py-8 lg:py-12 max-w-4xl">
        {/* Breadcrumb (oculto en print) */}
        <div className="flex items-center gap-2 text-sm text-platinum-600 mb-8 print-hide">
          <Link href="/" className="hover:text-amber-gold-500 transition-colors">Inicio</Link>
          <span>/</span>
          <span className="text-obsidian-900">Comprobante</span>
        </div>

        <article className="bg-white shadow-luxury p-6 sm:p-10 lg:p-12">
          {/* Header del comprobante */}
          <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-8 border-b border-pearl-200">
            <div>
              <p className="text-xs uppercase tracking-widest text-platinum-500 mb-2">
                Comprobante de compra
              </p>
              <h1
                className="text-3xl lg:text-4xl font-light text-obsidian-900 mb-2"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Orden #{order.order_number}
              </h1>
              <p className="text-sm text-platinum-600">
                {formatDate(order.created_at)}
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2">
              <span
                className={`inline-block px-3 py-1 text-xs uppercase tracking-wider font-medium rounded ${
                  STATUS_LABEL[order.status]?.cls ?? 'bg-platinum-200 text-platinum-700'
                }`}
              >
                {STATUS_LABEL[order.status]?.label ?? order.status}
              </span>
              <p
                className="text-2xl font-light text-obsidian-900"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                {formatCLP(order.total)}
              </p>
            </div>
          </header>

          {/* Datos del cliente y envío */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-pearl-200">
            <div>
              <h2 className="text-xs uppercase tracking-widest text-platinum-500 mb-3">
                Cliente
              </h2>
              <p className="text-sm text-obsidian-900 font-medium">{order.customer_name}</p>
              <p className="text-sm text-platinum-700">{order.customer_email}</p>
              {order.customer_phone && (
                <p className="text-sm text-platinum-700">{order.customer_phone}</p>
              )}
            </div>
            <div>
              <h2 className="text-xs uppercase tracking-widest text-platinum-500 mb-3">
                Dirección de envío
              </h2>
              <p className="text-sm text-obsidian-900">{order.shipping_address}</p>
              <p className="text-sm text-platinum-700">
                {order.shipping_city}, {order.shipping_region}
                {order.shipping_postal_code ? ` — ${order.shipping_postal_code}` : ''}
              </p>
            </div>
          </section>

          {/* Items */}
          <section className="py-8 border-b border-pearl-200">
            <h2 className="text-xs uppercase tracking-widest text-platinum-500 mb-4">
              Productos
            </h2>
            <ul className="divide-y divide-pearl-100">
              {order.items.map((item, idx) => (
                <li
                  key={`${item.product_id}-${idx}`}
                  className="flex gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="w-16 h-16 bg-pearl-100 rounded flex items-center justify-center p-1 flex-shrink-0 print-hide">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <svg
                        className="w-8 h-8 text-platinum-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16v12H4V6z"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-obsidian-900">{item.name}</p>
                    <p className="text-xs text-platinum-600 mt-0.5">
                      SKU: {item.internal_sku} · Cantidad: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-obsidian-900">
                      {formatCLP(Number(item.unit_price) * item.quantity)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-platinum-600 mt-0.5">
                        {formatCLP(item.unit_price)} c/u
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Totales */}
          <section className="py-8 border-b border-pearl-200">
            <dl className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-sm">
                <dt className="text-platinum-700">Subtotal</dt>
                <dd className="text-obsidian-900">{formatCLP(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-platinum-700">Envío</dt>
                <dd className="text-obsidian-900">
                  {Number(order.shipping_cost) === 0
                    ? 'Gratis'
                    : formatCLP(order.shipping_cost)}
                </dd>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-sm">
                  <dt className="text-platinum-700">
                    Descuento{order.coupon_code ? ` (${order.coupon_code})` : ''}
                  </dt>
                  <dd className="text-green-700">
                    −{formatCLP(order.discount_amount)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between text-base font-medium pt-2 border-t border-pearl-200">
                <dt className="text-obsidian-900">Total</dt>
                <dd className="text-obsidian-900">{formatCLP(order.total)}</dd>
              </div>
            </dl>
          </section>

          {/* Pago */}
          <section className="py-8">
            <h2 className="text-xs uppercase tracking-widest text-platinum-500 mb-3">
              Método de pago
            </h2>
            <p className="text-sm text-obsidian-900">
              {paymentMethodLabel(order.mp_payment_method)}
              {order.mp_card_last_four && (
                <span className="text-platinum-700">
                  {' '}
                  terminada en •••• {order.mp_card_last_four}
                </span>
              )}
            </p>
            {order.mp_payment_id && (
              <p className="text-xs text-platinum-500 mt-1">
                ID de transacción MercadoPago: {order.mp_payment_id}
              </p>
            )}
          </section>

          {/* Footer del comprobante (visible en print) */}
          <footer className="pt-8 border-t border-pearl-200 text-xs text-platinum-500 text-center">
            <p>Inversiones Amber Nelson — ambernelson.cl</p>
            <p className="mt-1">
              Gracias por tu compra. Para consultas escríbenos por WhatsApp con
              el número de orden.
            </p>
          </footer>
        </article>

        {/* Acciones (ocultas en print) */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8 print-hide">
          <PrintButton />
          <Link
            href="/catalogo"
            className="px-6 py-3 border-2 border-obsidian-900 text-obsidian-900 text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors text-center"
          >
            Seguir comprando
          </Link>
        </div>
      </main>

      <div className="print-hide">
        <Footer />
      </div>
    </div>
  );
}
