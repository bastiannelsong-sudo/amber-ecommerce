/**
 * CARTUI-ORG-3 — Cart page layout organism.
 * Two-column grid: left=CartItemList, right=CartSummaryPanel (sticky).
 * Zero store/hook imports: pure presentational organism.
 */
import type { ReactNode } from 'react';
import type { CartItem } from '@/features/cart/domain/cart.types';
import type { CartSummaryPanelProps } from '../molecules/CartSummaryPanel';
import { CartItemList } from './CartItemList';
import { CartSummaryPanel } from '../molecules/CartSummaryPanel';

export interface CartPageLayoutProps {
  items: CartItem[];
  summary: CartSummaryPanelProps;
  onIncrement: (productId: number) => void;
  onDecrement: (productId: number) => void;
  onRemove: (productId: number) => void;
  breadcrumb?: ReactNode;
}

export function CartPageLayout({
  items,
  summary,
  onIncrement,
  onDecrement,
  onRemove,
  breadcrumb,
}: CartPageLayoutProps) {
  return (
    <div>
      {breadcrumb}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left column: item list */}
        <div className="lg:col-span-2">
          <CartItemList
            items={items}
            variant="page"
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            onRemove={onRemove}
          />
        </div>

        {/* Right column: sticky summary */}
        <div className="lg:col-span-1">
          <CartSummaryPanel {...summary} />
        </div>
      </div>
    </div>
  );
}
