/**
 * CARTUI-ATOM-3 — Empty cart state with drawer/page variants.
 * Page variant includes a CTA link to continue shopping.
 * Zero store/hook imports: pure presentational atom.
 */
import Link from 'next/link';

export interface CartEmptyStateProps {
  variant: 'drawer' | 'page';
  onClose?: () => void;
}

export function CartEmptyState({ variant, onClose }: CartEmptyStateProps) {
  if (variant === 'drawer') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <svg
          className="w-16 h-16 text-platinum-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        <p className="text-platinum-600 mb-4">Tu carrito está vacío</p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-amber-gold-500 hover:text-amber-gold-600 transition-colors uppercase tracking-wide text-sm font-medium"
          >
            Continuar Comprando
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <svg
        className="w-24 h-24 text-platinum-400 mb-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
      <h2
        className="text-2xl font-light text-obsidian-900 mb-4"
        style={{ fontFamily: 'var(--font-cormorant)' }}
      >
        Tu carrito está vacío
      </h2>
      <p className="text-platinum-600 mb-8">Agrega productos para continuar comprando</p>
      <Link
        href="/"
        className="px-8 py-3 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors"
      >
        Explorar Productos
      </Link>
    </div>
  );
}
