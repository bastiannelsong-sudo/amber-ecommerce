'use client';

import { motion } from 'framer-motion';

interface FreeShippingProgressProps {
  /** Current cart total */
  cartTotal: number;
  /** Threshold for free shipping (default: 50000 CLP) */
  threshold?: number;
}

export default function FreeShippingProgress({
  cartTotal,
  threshold = 30000,
}: FreeShippingProgressProps) {
  const remaining = threshold - cartTotal;
  const progress = Math.min((cartTotal / threshold) * 100, 100);
  const qualified = remaining <= 0;

  return (
    <div className="px-1">
      {qualified ? (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 py-3 px-4 bg-green-50 border border-green-100"
        >
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-green-800">Envio gratis incluido</p>
            <p className="text-xs text-green-600">En tu pedido actual</p>
          </div>
          <svg className="w-5 h-5 text-green-500 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </motion.div>
      ) : (
        <div className="py-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-obsidian-700">
              <svg className="w-3.5 h-3.5 text-amber-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              <span>
                Te faltan <span className="font-semibold text-amber-gold-600">${remaining.toLocaleString('es-CL')}</span> para envio gratis
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-pearl-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-amber-gold-400 to-amber-gold-500"
            />
          </div>

          <p className="text-[10px] text-platinum-500 text-center">
            Envio gratis en compras sobre ${threshold.toLocaleString('es-CL')}
          </p>
        </div>
      )}
    </div>
  );
}
