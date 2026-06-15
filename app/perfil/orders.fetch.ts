import type { MyOrder } from './types';

/**
 * Fetches the authenticated user's orders from /api/orders/me.
 *
 * Accepts an AbortSignal so callers (useEffect cleanup) can cancel
 * the in-flight request on component unmount. AbortError is re-thrown
 * and must be caught and ignored by the caller.
 */
export async function fetchOrders(signal: AbortSignal): Promise<MyOrder[]> {
  const res = await fetch('/api/orders/me', { credentials: 'include', signal });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  const data = (await res.json()) as { orders?: MyOrder[] };
  return data.orders ?? [];
}
