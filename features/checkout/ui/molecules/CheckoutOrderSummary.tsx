/**
 * CHKUI-MOL-7
 * Presentational molecule — checkout order summary with item list and totals.
 * Composes CheckoutOrderItemRow. No imports from features/cart/ui/ (ADR-1).
 */
import { CheckoutOrderItemRow } from './CheckoutOrderItemRow';
import type { CartSnapshot } from '@/features/checkout/domain/checkout.types';

type SnapshotItem = CartSnapshot['items'][number];

interface CheckoutOrderSummaryProps {
  items: readonly SnapshotItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

const formatPrice = (price: number): string =>
  price.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

export const CheckoutOrderSummary = ({
  items,
  subtotal,
  discount,
  shipping,
  total,
}: CheckoutOrderSummaryProps) => {
  return (
    <div className="bg-white p-5 sm:p-6 shadow-luxury space-y-4">
      <h3
        className="text-lg font-light text-obsidian-900 pb-3 border-b border-pearl-200"
        style={{ fontFamily: 'var(--font-cormorant)' }}
      >
        Resumen del pedido
      </h3>

      {/* Item list */}
      <div>
        {items.map((item) => (
          <CheckoutOrderItemRow key={item.product_id} item={item} />
        ))}
      </div>

      {/* Totals */}
      <dl className="space-y-2 text-sm pt-2 border-t border-pearl-200">
        <div className="flex justify-between text-platinum-700">
          <dt>Subtotal</dt>
          <dd>{formatPrice(subtotal)}</dd>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-green-700">
            <dt>Descuento</dt>
            <dd>-{formatPrice(discount)}</dd>
          </div>
        )}

        <div className="flex justify-between text-platinum-700">
          <dt>Envío</dt>
          <dd>{shipping === 0 ? 'Gratis' : formatPrice(shipping)}</dd>
        </div>

        <div className="flex justify-between font-medium text-obsidian-900 text-base pt-2 border-t border-pearl-200">
          <dt>Total</dt>
          <dd>{formatPrice(total)}</dd>
        </div>
      </dl>
    </div>
  );
};
