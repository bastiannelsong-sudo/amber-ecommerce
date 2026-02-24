'use client';

import { motion } from 'motion/react';
import type { SecondarySku } from '../../lib/types';

interface PriceAnchorProps {
  /** Current store price */
  price: number;
  /** Secondary SKUs with platform prices for comparison */
  secondarySkus?: SecondarySku[];
  /** Show inline (product card) vs detailed (product detail) */
  compact?: boolean;
}

/** Formatea precio como entero (en Chile no se usan decimales) */
function fmt(value: number): string {
  return Math.round(Number(value) || 0).toLocaleString('es-CL');
}

export default function PriceAnchor({
  price,
  secondarySkus,
  compact = false,
}: PriceAnchorProps) {
  // Find the highest platform price for anchoring
  const platformPrices = secondarySkus
    ?.filter((sku) => sku.platform_price && sku.platform_price > price && sku.is_active)
    ?.sort((a, b) => (b.platform_price || 0) - (a.platform_price || 0));

  const highestPlatformPrice = platformPrices?.[0];

  if (!highestPlatformPrice?.platform_price) {
    // No comparison available - just show the price
    return (
      <p className={`font-medium text-obsidian-900 ${compact ? 'text-sm tracking-wide' : 'text-3xl mb-6'}`}>
        ${fmt(price)}
      </p>
    );
  }

  const savings = highestPlatformPrice.platform_price - price;
  const savingsPercent = Math.round((savings / highestPlatformPrice.platform_price) * 100);
  const platformName = highestPlatformPrice.platform?.name || 'Marketplace';

  if (compact) {
    return (
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-obsidian-900">
            ${fmt(price)}
          </span>
          <span className="text-xs text-platinum-500 line-through">
            ${fmt(highestPlatformPrice.platform_price)}
          </span>
        </div>
        <p className="text-[10px] text-green-600 font-medium">
          Ahorras ${fmt(savings)} vs {platformName}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {/* Main price */}
      <div className="flex items-baseline gap-3">
        <p className="text-3xl font-medium text-obsidian-900">
          ${fmt(price)}
        </p>
        <p className="text-lg text-platinum-500 line-through">
          ${fmt(highestPlatformPrice.platform_price)}
        </p>
        <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
          -{savingsPercent}%
        </span>
      </div>

      {/* Savings callout */}
      <div className="flex items-center gap-2 text-sm">
        <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-green-700">
          Ahorras <span className="font-semibold">${fmt(savings)}</span> comprando aqui vs {platformName}
        </span>
      </div>

      {/* Platform availability badges */}
      {secondarySkus && secondarySkus.filter((s) => s.is_active).length > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-platinum-600">Tambien en:</span>
          {secondarySkus
            .filter((s) => s.is_active)
            .slice(0, 3)
            .map((sku) => (
              <span
                key={sku.secondary_sku_id}
                className="px-2 py-0.5 bg-pearl-100 text-platinum-700 text-[10px] uppercase tracking-wider font-medium border border-pearl-200"
              >
                {sku.platform?.name || 'Marketplace'}
              </span>
            ))}
        </div>
      )}
    </motion.div>
  );
}
