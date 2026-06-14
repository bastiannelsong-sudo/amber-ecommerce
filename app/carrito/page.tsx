'use client';

/**
 * CARTUI-SWAP — Thin shell. Wraps CartPageContainer with page chrome (Header/Footer/title).
 * CartPageContainer handles hydration, trackViewCart, toasts, and CartPageLayout.
 * One-line rollback: replace this file with the pre-strangle version.
 */
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CartPageContainer } from '@/features/cart/ui/containers/CartPageContainer';
import { useCart } from '@/features/cart/application/use-cart';

function CartPageShell() {
  const { items } = useCart();

  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      <div className="container mx-auto px-4 lg:px-8 py-12">
        {/* Page header */}
        <div className="mb-12">
          <h1
            className="text-4xl lg:text-5xl font-light text-obsidian-900 mb-2"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Carrito de Compras
          </h1>
          <p className="text-platinum-600">
            {items.length} {items.length === 1 ? 'producto' : 'productos'}
          </p>
        </div>

        <CartPageContainer />
      </div>

      <Footer />
    </div>
  );
}

export default CartPageShell;
