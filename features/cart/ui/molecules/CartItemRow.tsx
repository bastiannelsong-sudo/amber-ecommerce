/**
 * CARTUI-MOL-1 — Cart item row molecule.
 * Composes CartItemImage + name + SKU + CartLinePrice + QuantityStepper.
 * Zero store/hook imports: pure presentational molecule.
 */
import { CartItemImage } from '../atoms/CartItemImage';
import { CartLinePrice } from '../atoms/CartLinePrice';
import { QuantityStepper } from '../atoms/QuantityStepper';
import type { CartItem } from '@/features/cart/domain/cart.types';

export interface CartItemRowProps {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

export function CartItemRow({ item, onIncrement, onDecrement, onRemove }: CartItemRowProps) {
  return (
    <div className="flex gap-4">
      <div className="w-24 h-24 bg-pearl-100 flex-shrink-0 rounded overflow-hidden flex items-center justify-center p-1">
        <CartItemImage
          src={item.product.image_url}
          alt={item.product.name}
          width={96}
          height={96}
          className="w-full h-full object-contain"
        />
      </div>

      <div className="flex-1 flex flex-col">
        <h3 className="text-sm font-medium text-obsidian-900 mb-1">
          {item.product.name}
        </h3>
        <p className="text-sm text-platinum-600 mb-1">
          {item.product.internal_sku}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <QuantityStepper
            quantity={item.quantity}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            onRemove={onRemove}
          />
          <CartLinePrice item={item} className="text-sm font-medium text-obsidian-900" />
        </div>
      </div>
    </div>
  );
}
