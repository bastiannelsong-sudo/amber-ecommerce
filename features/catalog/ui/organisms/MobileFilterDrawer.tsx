'use client';

/**
 * CATUI-ORG-1 — MobileFilterDrawer organism.
 * Pure CSS animation (animate-fade-in), no motion/react.
 * No dedicated unit test per design ADR #8 (CartDrawerPanel precedent).
 * Exercised via CatalogContainer integration test.
 */

import { ReactNode } from 'react';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function MobileFilterDrawer({ isOpen, onClose, children }: MobileFilterDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="absolute left-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-pearl-200">
          <h2
            className="text-xl font-light text-obsidian-900"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Filtros
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-obsidian-700 cursor-pointer"
            aria-label="Cerrar filtros"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
