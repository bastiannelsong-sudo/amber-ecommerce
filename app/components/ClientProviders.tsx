'use client';

import CartDrawer from './CartDrawer';
import AbandonedCartModal from './marketing/AbandonedCartModal';

export default function ClientProviders() {
  return (
    <>
      <CartDrawer />
      <AbandonedCartModal />
    </>
  );
}
