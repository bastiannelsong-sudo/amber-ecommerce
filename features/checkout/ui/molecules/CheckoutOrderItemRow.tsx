/**
 * CHKUI-MOL-6
 * Presentational molecule — single order item row using CartSnapshot item shape.
 * Uses CartSnapshot['items'][number] — unit_price (NOT CartItem.product.price).
 * MUST NOT import from features/cart/ui/ (ADR-1, CHKUI-ARCH).
 */
import Image from 'next/image';
import type { CartSnapshot } from '@/features/checkout/domain/checkout.types';

interface CheckoutOrderItemRowProps {
  item: CartSnapshot['items'][number];
}

const formatPrice = (price: number): string =>
  price.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

export const CheckoutOrderItemRow = ({ item }: CheckoutOrderItemRowProps) => {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-pearl-200 last:border-0">
      {item.image_url && (
        <div className="relative w-14 h-14 shrink-0 bg-pearl-100">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-obsidian-900 truncate">{item.name}</p>
        <p className="text-xs text-platinum-600">Cant: {item.quantity}</p>
      </div>

      <p className="text-sm font-medium text-obsidian-900 shrink-0">
        {formatPrice(item.unit_price)}
      </p>
    </div>
  );
};
