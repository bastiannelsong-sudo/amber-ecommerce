import 'server-only';
import { cache } from 'react';
import type { EcommerceOrderDetail } from '../types';
import { internalFetch } from './internal-fetch';

/**
 * Fetcher server-only para una orden por order_number.
 * No-cache: el comprobante refleja el estado actual de la orden y puede
 * cambiar (pending -> paid) en pocos segundos despues del checkout.
 */
export const getOrderByNumber = cache(
  async (orderNumber: string): Promise<EcommerceOrderDetail | null> => {
    const res = await internalFetch(
      `/ecommerce/orders/${encodeURIComponent(orderNumber)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    return res.json();
  },
);
