'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-pearl-50 px-4">
      <div className="max-w-md text-center">
        <div className="mb-8 flex items-center justify-center">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-gold-500 to-transparent" />
          <svg
            className="w-8 h-8 text-amber-gold-500 mx-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-gold-500 to-transparent" />
        </div>

        <h2
          className="text-4xl font-light text-obsidian-900 mb-4"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          Algo salio mal
        </h2>
        <p className="text-platinum-600 mb-8">
          Lo sentimos, ocurrio un error inesperado. Por favor intenta nuevamente.
        </p>
        <button
          onClick={reset}
          className="px-8 py-3 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors cursor-pointer"
        >
          Intentar de Nuevo
        </button>
      </div>
    </div>
  );
}
