/**
 * Tests for POST /api/orders — BFF-NAV-02, BFF-NAV-07, BFF-NAV-08, BFF-NAV-09, BFF-NAV-T3
 *
 * Pattern: hoisted vi.mock, vi.resetModules() + dynamic import() per test.
 * Orders route uses backendFetch (not proxyToBackend) + setOrderAccessCookie.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('../../lib/bff-proxy', () => ({
  backendFetch: vi.fn(),
  proxyToBackend: vi.fn(),
}));

vi.mock('../../lib/session', () => ({
  getSession: vi.fn(),
  setSession: vi.fn(),
  clearSession: vi.fn(),
}));

vi.mock('../../lib/order-access', () => ({
  setOrderAccessCookie: vi.fn(),
}));

describe('POST /api/orders', () => {
  let backendFetch: ReturnType<typeof vi.fn>;
  let setOrderAccessCookie: ReturnType<typeof vi.fn>;
  let POST: (req: NextRequest) => Promise<Response>;

  const validItem = {
    product_id: 1,
    name: 'Widget',
    internal_sku: 'WGT-001',
    quantity: 2,
    unit_price: 19.99,
  };

  const validOrderBody = {
    customer_email: 'buyer@example.com',
    customer_name: 'John Doe',
    shipping_address: '123 Main St',
    shipping_city: 'Lima',
    shipping_region: 'Lima',
    items: [validItem],
  };

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const proxyMod = await import('../../lib/bff-proxy');
    const orderAccessMod = await import('../../lib/order-access');
    const routeMod = await import('./route');

    backendFetch = vi.mocked(proxyMod.backendFetch);
    setOrderAccessCookie = vi.mocked(orderAccessMod.setOrderAccessCookie);
    POST = routeMod.POST;

    backendFetch.mockResolvedValue({
      ok: true,
      status: 201,
      data: { order_number: 'ORD-001', init_point: 'https://mp.com/pay' },
    });
    setOrderAccessCookie.mockResolvedValue(undefined);
  });

  const makeRequest = (body: unknown) =>
    new NextRequest('http://localhost/api/orders', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  // BFF-NAV-T3 item 4: valid full order → backendFetch called once with v.data; cookie set
  it('valid order — backendFetch called once with v.data; setOrderAccessCookie fires', async () => {
    const req = makeRequest(validOrderBody);
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(backendFetch).toHaveBeenCalledOnce();
    const [, init] = backendFetch.mock.calls[0] as [string, { body: string }];
    const forwarded = JSON.parse(init.body as string);
    expect(forwarded).toEqual(validOrderBody);
    expect(setOrderAccessCookie).toHaveBeenCalledWith('ORD-001');
  });

  // BFF-NAV-T3 item 1: wrong-type quantity → 400, backendFetch not called
  it('quantity as string — returns 400, backendFetch not called', async () => {
    const req = makeRequest({
      ...validOrderBody,
      items: [{ ...validItem, quantity: 'two' }],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  // BFF-NAV-T3 item 2: missing internal_sku → 400, backendFetch not called
  it('missing internal_sku — returns 400, backendFetch not called', async () => {
    const { internal_sku: _, ...itemWithoutSku } = validItem;
    const req = makeRequest({ ...validOrderBody, items: [itemWithoutSku] });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  // BFF-NAV-T3 item 3: empty items array → 400, backendFetch not called
  it('empty items array — returns 400, backendFetch not called', async () => {
    const req = makeRequest({ ...validOrderBody, items: [] });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  // BFF-NAV-09: unknown top-level field stripped
  it('unknown top-level field stripped before forward', async () => {
    const req = makeRequest({ ...validOrderBody, __proto__: 'evil' });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(backendFetch).toHaveBeenCalledOnce();
    const [, init] = backendFetch.mock.calls[0] as [string, { body: string }];
    const forwarded = JSON.parse(init.body as string);
    expect(forwarded).not.toHaveProperty('__proto__');
  });

  // BFF-NAV-08: 400 response has structured error body
  it('400 response has { error, issues } structure', async () => {
    const req = makeRequest({ ...validOrderBody, items: [] });
    const res = await POST(req);
    const body = await res.json() as Record<string, unknown>;
    expect(typeof body.error).toBe('string');
    expect(Array.isArray(body.issues)).toBe(true);
  });

  // Cookie is NOT set when backend returns failure
  it('setOrderAccessCookie not called when backendFetch returns not ok', async () => {
    backendFetch.mockResolvedValue({ ok: false, status: 500, data: null });
    const req = makeRequest(validOrderBody);
    await POST(req);
    expect(setOrderAccessCookie).not.toHaveBeenCalled();
  });
});
