'use client';

import { motion } from 'framer-motion';

interface ScarcityIndicatorProps {
  stock: number;
  /** Threshold to show urgency (default: 5) */
  threshold?: number;
  /** Compact version for cards */
  compact?: boolean;
}

export default function ScarcityIndicator({
  stock,
  threshold = 5,
  compact = false,
}: ScarcityIndicatorProps) {
  if (stock <= 0) {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-red-600 font-medium uppercase tracking-wide">
          Agotado
        </span>
      </div>
    );
  }

  if (stock > threshold) return null;

  const isLastUnit = stock === 1;
  const isCritical = stock <= 2;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
          isCritical
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-amber-gold-50 text-amber-gold-700 border border-amber-gold-200'
        }`}
      >
        {isCritical && (
          <span className="relative flex h-1.5 w-1.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isLastUnit ? 'bg-red-400' : 'bg-red-400'
            }`} />
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
              isLastUnit ? 'bg-red-500' : 'bg-red-500'
            }`} />
          </span>
        )}
        {isLastUnit ? 'Ultima unidad' : `Quedan ${stock}`}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-sm ${
        isCritical
          ? 'bg-red-50 border border-red-100'
          : 'bg-amber-gold-50 border border-amber-gold-100'
      }`}
    >
      {/* Animated urgency dot */}
      <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isCritical ? 'bg-red-400' : 'bg-amber-gold-400'
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
            isCritical ? 'bg-red-500' : 'bg-amber-gold-500'
          }`}
        />
      </span>

      <div className="flex-1">
        <p className={`text-sm font-semibold ${isCritical ? 'text-red-800' : 'text-amber-gold-800'}`}>
          {isLastUnit
            ? 'Ultima unidad disponible'
            : `Solo quedan ${stock} unidades`}
        </p>
        <p className={`text-xs mt-0.5 ${isCritical ? 'text-red-600' : 'text-amber-gold-600'}`}>
          {isCritical
            ? 'Alta demanda - No esperes mas'
            : 'Este producto se esta agotando rapidamente'}
        </p>
      </div>

      {/* Stock bar visual */}
      <div className="w-16 flex-shrink-0">
        <div className="h-1.5 bg-pearl-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(10, (stock / threshold) * 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              isCritical ? 'bg-red-500' : 'bg-amber-gold-500'
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
}
