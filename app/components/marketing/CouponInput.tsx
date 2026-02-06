'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ecommerceService } from '../../lib/services/ecommerce.service';

interface CouponInputProps {
  cartTotal: number;
  onApply: (discount: number, code: string) => void;
  onRemove: () => void;
  appliedCode?: string;
}

export default function CouponInput({
  cartTotal,
  onApply,
  onRemove,
  appliedCode,
}: CouponInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleApply = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await ecommerceService.validateCoupon(code.trim(), cartTotal);
      if (result.valid) {
        setSuccess(result.message);
        onApply(result.discount_amount, code.trim().toUpperCase());
        setCode('');
      } else {
        setError(result.message);
      }
    } catch {
      setError('Error al validar el cupon');
    } finally {
      setLoading(false);
    }
  };

  if (appliedCode) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="flex items-center justify-between py-2.5 px-3 bg-green-50 border border-green-200"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-green-700 font-medium">
            Cupon <span className="uppercase font-bold">{appliedCode}</span> aplicado
          </span>
        </div>
        <button
          onClick={onRemove}
          className="text-xs text-green-600 hover:text-red-500 transition-colors cursor-pointer font-medium"
        >
          Quitar
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError('');
          }}
          placeholder="Codigo de descuento"
          className="flex-1 px-3 py-2 text-xs border border-pearl-300 focus:border-amber-gold-500 focus:outline-none transition-colors uppercase tracking-wider"
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="px-4 py-2 text-xs uppercase tracking-wider font-medium border border-obsidian-900 text-obsidian-900 hover:bg-obsidian-900 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? '...' : 'Aplicar'}
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-600"
          >
            {error}
          </motion.p>
        )}
        {success && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-green-600"
          >
            {success}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
