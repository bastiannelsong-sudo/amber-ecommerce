/**
 * Tests for fetchOrders — extracted fetch logic from perfil/page.tsx
 *
 * Fix L-3: AbortController cleanup — fetch respects signal, AbortError is
 * re-thrown so callers (useEffect cleanup) can silently ignore it.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchOrders } from './orders.fetch';

const makeResponse = (ok: boolean, status: number, body: unknown): Response =>
  ({
    ok,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as Response;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchOrders', () => {
  it('returns orders array on a successful response', async () => {
    const orders = [
      {
        order_id: 1,
        order_number: 'ORD-001',
        status: 'pending',
        total: 9900,
        items: [{ name: 'Ring', quantity: 1 }],
        created_at: '2024-01-15T10:00:00Z',
      },
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(true, 200, { orders })));

    const result = await fetchOrders(new AbortController().signal);

    expect(result).toHaveLength(1);
    expect(result[0].order_number).toBe('ORD-001');
    expect(result[0].status).toBe('pending');
  });

  it('returns empty array when response has no orders key', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(true, 200, {})));

    const result = await fetchOrders(new AbortController().signal);

    expect(result).toHaveLength(0);
  });

  it('throws an error with HTTP status message on non-OK response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeResponse(false, 401, { error: 'Unauthorized' })),
    );

    await expect(fetchOrders(new AbortController().signal)).rejects.toThrow('Unauthorized');
  });

  it('re-throws AbortError so callers can detect and ignore cancellation', async () => {
    const abortError = new DOMException('The user aborted a request.', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    const controller = new AbortController();
    controller.abort();

    const err = await fetchOrders(controller.signal).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DOMException);
    expect((err as DOMException).name).toBe('AbortError');
  });

  it('passes the signal to fetch so abort cancels the in-flight request', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(makeResponse(true, 200, { orders: [] }));
    vi.stubGlobal('fetch', fetchSpy);

    const controller = new AbortController();
    await fetchOrders(controller.signal);

    const callOptions = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(callOptions.signal).toBe(controller.signal);
  });
});
