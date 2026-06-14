/**
 * CARTUI-ORG-1 — Cart item list organism.
 * When empty: renders CartEmptyState with matching variant.
 * When non-empty: renders one CartItemRow per item.
 * Zero store/hook imports: pure presentational organism.
 */
import { CartEmptyState } from '../atoms/CartEmptyState';
import { CartItemRow } from '../molecules/CartItemRow';
import type { CartItem } from '@/features/cart/domain/cart.types';

export interface CartItemListProps {
  items: CartItem[];
  variant: 'drawer' | 'page';
  onIncrement: (productId: number) => void;
  onDecrement: (productId: number) => void;
  onRemove: (productId: number) => void;
  onClose?: () => void;
}

export function CartItemList({
  items,
  variant,
  onIncrement,
  onDecrement,
  onRemove,
  onClose,
}: CartItemListProps) {
  if (items.length === 0) {
    return <CartEmptyState variant={variant} onClose={onClose} />;
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <CartItemRow
          key={item.product.product_id}
          item={item}
          onIncrement={() => onIncrement(item.product.product_id)}
          onDecrement={() => onDecrement(item.product.product_id)}
          onRemove={() => onRemove(item.product.product_id)}
        />
      ))}
    </div>
  );
}
