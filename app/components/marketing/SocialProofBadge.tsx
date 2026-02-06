'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SocialProofBadgeProps {
  productId: number;
  /** Sold count from real API data (e.g., weekly sales) */
  soldThisWeek?: number;
  /** Show simulated "viewing now" count */
  showViewers?: boolean;
  /** Compact mode for ProductCard */
  compact?: boolean;
}

export default function SocialProofBadge({
  productId,
  soldThisWeek = 0,
  showViewers = true,
  compact = false,
}: SocialProofBadgeProps) {
  const [viewerCount, setViewerCount] = useState(0);

  // Simulate realistic viewer count based on productId as seed
  useEffect(() => {
    if (!showViewers) return;

    const baseViewers = ((productId * 7 + 3) % 12) + 2; // 2-13 viewers
    setViewerCount(baseViewers);

    const interval = setInterval(() => {
      setViewerCount((prev) => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const next = prev + delta;
        return Math.max(1, Math.min(next, baseViewers + 5));
      });
    }, 8000 + Math.random() * 7000);

    return () => clearInterval(interval);
  }, [productId, showViewers]);

  if (!showViewers && soldThisWeek === 0) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {showViewers && viewerCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[10px] text-obsidian-700 shadow-sm"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            <span className="font-medium">{viewerCount}</span>
            <span className="text-platinum-600">viendo</span>
          </motion.div>
        )}

        {soldThisWeek > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-1.5 bg-amber-gold-50/90 backdrop-blur-sm px-2.5 py-1 text-[10px] text-amber-gold-700 shadow-sm"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="font-medium">{soldThisWeek}+ vendidos</span>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Viewers */}
      {showViewers && viewerCount > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5 text-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={viewerCount}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="text-obsidian-700"
            >
              <span className="font-semibold text-obsidian-900">{viewerCount} personas</span>
              {' '}viendo este producto ahora
            </motion.span>
          </AnimatePresence>
        </motion.div>
      )}

      {/* Sold this week */}
      {soldThisWeek > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-2.5 text-sm"
        >
          <svg className="w-4 h-4 text-amber-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
          </svg>
          <span className="text-obsidian-700">
            <span className="font-semibold text-amber-gold-600">{soldThisWeek}+ vendidos</span>
            {' '}esta semana
          </span>
        </motion.div>
      )}
    </div>
  );
}
