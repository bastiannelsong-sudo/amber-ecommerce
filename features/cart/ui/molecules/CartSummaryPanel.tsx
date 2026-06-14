/**
 * CARTUI-MOL-2 — Cart summary panel molecule.
 * All amounts displayed via formatPrice; conditional discount row.
 * Zero store/hook imports: pure presentational molecule.
 *
 * checkoutHref: when provided, the "Finalizar Compra" CTA renders as a next/link
 * (navigates to /checkout). onCheckout is still called on click (e.g. to close
 * the drawer). When absent, CTA renders as a plain button.
 */
import Link from 'next/link';
import { formatPrice } from '@/features/catalog/domain/catalog.rules';

export interface CartSummaryPanelProps {
  subtotal: number;
  shipping: number;
  discountAmount: number;
  finalTotal: number;
  /** When set, the checkout CTA renders as a navigable Link to this href. */
  checkoutHref?: string;
  onCheckout: () => void;
  onContinueShopping: () => void;
}

export function CartSummaryPanel({
  subtotal,
  shipping,
  discountAmount,
  finalTotal,
  checkoutHref,
  onCheckout,
  onContinueShopping,
}: CartSummaryPanelProps) {
  return (
    <div className="bg-white p-6 shadow-luxury sticky top-24">
      <h2
        className="text-2xl font-light text-obsidian-900 mb-6 pb-4 border-b border-pearl-200"
        style={{ fontFamily: 'var(--font-cormorant)' }}
      >
        Resumen del Pedido
      </h2>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-platinum-600">Subtotal</span>
          <span className="text-obsidian-900">${formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-platinum-600">Envío</span>
          <span className="text-obsidian-900">
            {shipping === 0 ? 'Gratis' : `$${formatPrice(shipping)}`}
          </span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-700">
            <span>Descuento</span>
            <span>-${formatPrice(discountAmount)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-pearl-200 pt-4 mb-6">
        <div className="flex justify-between text-lg font-medium">
          <span className="text-obsidian-900">Total</span>
          <span className="text-obsidian-900">${formatPrice(finalTotal)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {checkoutHref ? (
          <Link
            href={checkoutHref}
            onClick={onCheckout}
            className="flex items-center justify-center gap-2 w-full py-4 bg-obsidian-900 text-white text-center text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors"
          >
            Finalizar Compra
          </Link>
        ) : (
          <button
            type="button"
            onClick={onCheckout}
            className="w-full py-4 bg-obsidian-900 text-white text-center text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors"
          >
            Finalizar Compra
          </button>
        )}

        <button
          type="button"
          onClick={onContinueShopping}
          className="w-full py-4 border-2 border-obsidian-900 text-obsidian-900 text-center text-sm uppercase tracking-widest font-medium hover:bg-obsidian-900 hover:text-white transition-colors"
        >
          Continuar Comprando
        </button>
      </div>
    </div>
  );
}
