/**
 * CARTUI-ORG-2 — Cart drawer panel organism.
 * Outermost shell: AnimatePresence + motion.div only.
 * Inner content: plain HTML elements (testable without animation concerns).
 * ADR-3: tests must NOT render this organism directly; test inner panels instead.
 */
'use client';

import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import type { CartItem } from '@/features/cart/domain/cart.types';
import type { CartSummaryPanelProps } from '../molecules/CartSummaryPanel';
import { CartItemList } from './CartItemList';
import { CartSummaryPanel } from '../molecules/CartSummaryPanel';

export interface CartDrawerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  summary: CartSummaryPanelProps;
  onIncrement: (productId: number) => void;
  onDecrement: (productId: number) => void;
  onRemove: (productId: number) => void;
  children?: ReactNode;
}

export function CartDrawerPanel({
  isOpen,
  onClose,
  items,
  summary,
  onIncrement,
  onDecrement,
  onRemove,
  children,
}: CartDrawerPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[60]"
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[92%] max-w-md bg-white shadow-2xl z-[60] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-pearl-200 p-4 sm:p-6">
              <h2
                className="text-2xl font-light text-obsidian-900"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Carrito
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar carrito"
                className="flex items-center justify-center w-11 h-11 -mr-2 text-obsidian-700 hover:text-amber-gold-500 hover:bg-pearl-100 rounded-full transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <CartItemList
                items={items}
                variant="drawer"
                onIncrement={onIncrement}
                onDecrement={onDecrement}
                onRemove={onRemove}
                onClose={onClose}
              />
            </div>

            {/* Extra content slot (cross-sell, coupons, progress, etc.) */}
            {children}

            {/* Footer summary */}
            {items.length > 0 && (
              <div className="border-t border-pearl-200 p-4 sm:p-6">
                <CartSummaryPanel {...summary} />
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
