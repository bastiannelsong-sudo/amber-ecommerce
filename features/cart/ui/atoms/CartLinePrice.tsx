/**
 * CARTUI-ATOM-4 — Line price display using domain lineTotal + catalog formatPrice.
 * No inline arithmetic: calls lineTotal(item) then formatPrice(result).
 * Zero store/hook imports: pure presentational atom.
 */
import { lineTotal } from '@/features/cart/domain/cart.rules';
import { formatPrice } from '@/features/catalog/domain/catalog.rules';
import type { CartItem } from '@/features/cart/domain/cart.types';

export interface CartLinePriceProps {
  item: CartItem;
  className?: string;
}

export function CartLinePrice({ item, className }: CartLinePriceProps) {
  const price = formatPrice(lineTotal(item));

  return <span className={className}>${price}</span>;
}
