'use client';

/**
 * CARTUI-SWAP — Pure thin shell. No hook calls.
 * Wraps CartPageContainer with page chrome (Header/Footer).
 * CartPageContainer owns all rendering including the page header and item-count subtitle.
 * One-line rollback: replace this file with the pre-strangle version.
 */
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CartPageContainer } from '@/features/cart/ui/containers/CartPageContainer';

function CartPageShell() {
  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />

      <div className="container mx-auto px-4 lg:px-8 py-12">
        <CartPageContainer />
      </div>

      <Footer />
    </div>
  );
}

export default CartPageShell;
