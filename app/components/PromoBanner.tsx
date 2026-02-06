'use client';

import { useState } from 'react';

export default function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-amber-gold-600 via-amber-gold-500 to-amber-gold-600 text-white py-2 overflow-hidden">
      {/* Animated background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex items-center justify-center gap-4 text-sm font-medium">
          <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
          </svg>
          <span className="uppercase tracking-wider">
            ✨ Envío Gratis en Compras sobre $50.000 • Paga en 3 Cuotas sin Interés ✨
          </span>
          <button
            onClick={() => setIsVisible(false)}
            className="ml-auto hover:opacity-75 transition-opacity"
            aria-label="Cerrar banner"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
