/**
 * Tests for POST /api/orders/card-payment — BFF card payment validation
 *
 * Pattern: hoisted vi.mock, vi.resetModules() + dynamic import() per test.
 * Card-payment route uses backendFetch + setOrderAccessCookie + optionalAuth.
 *
 * Backend contract source:
 *   amber-back/src/ecommerce/dto/create-card-payment.dto.ts (CreateCardPaymentDto)
 *   amber-back/src/ecommerce/ecommerce.controller.ts (createCardPayment)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('../../../lib/bff-proxy', () => ({
  backendFetch: vi.fn(),
  proxyToBackend: vi.fn(),
}));

vi.mock('../../../lib/session', () => ({
  getSession: vi.fn(),
  setSession: vi.fn(),
  clearSession: vi.fn(),
}));

vi.mock('../../../lib/order-access', () => ({
  setOrderAccessCookie: vi.fn(),
}));

describe('POST /api/orders/card-payment', () => {
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

  const validOrder = {
    customer_email: 'buyer@example.com',
    customer_name: 'John Doe',
    shipping_address: '123 Main St',
    shipping_city: 'Santiago',
    shipping_region: 'Metropolitana',
    items: [validItem],
  };

  const validBody = {
    order: validOrder,
    card_token: 'TOKEN_ABC123',
    payment_method_id: 'visa',
    installments: 1,
  };

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const proxyMod = await import('../../../lib/bff-proxy');
    const orderAccessMod = await import('../../../lib/order-access');
    const routeMod = await import('./route');

    backendFetch = vi.mocked(proxyMod.backendFetch);
    setOrderAccessCookie = vi.mocked(orderAccessMod.setOrderAccessCookie);
    POST = routeMod.POST;

    backendFetch.mockResolvedValue({
      ok: true,
      status: 201,
      data: { order_number: 'ORD-CP-001' },
    });
    setOrderAccessCookie.mockResolvedValue(undefined);
  });

  const makeRequest = (body: unknown) =>
    new NextRequest('http://localhost/api/orders/card-payment', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  // Happy path
  it('valid body — backendFetch called once with parsed data; setOrderAccessCookie fires', async () => {
    const req = makeRequest(validBody);
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(backendFetch).toHaveBeenCalledOnce();
    const [, init] = backendFetch.mock.calls[0] as [string, { body: string }];
    const forwarded = JSON.parse(init.body as string);
    expect(forwarded).toEqual(validBody);
    expect(setOrderAccessCookie).toHaveBeenCalledWith('ORD-CP-001');
  });

  // card_token missing
  it('missing card_token — returns 400, backendFetch not called', async () => {
    const { card_token: _, ...bodyWithout } = validBody;
    const req = makeRequest(bodyWithout);
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  // payment_method_id missing
  it('missing payment_method_id — returns 400, backendFetch not called', async () => {
    const { payment_method_id: _, ...bodyWithout } = validBody;
    const req = makeRequest(bodyWithout);
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  // installments missing
  it('missing installments — returns 400, backendFetch not called', async () => {
    const { installments: _, ...bodyWithout } = validBody;
    const req = makeRequest(bodyWithout);
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  // installments wrong type
  it('installments as string — returns 400, backendFetch not called', async () => {
    const req = makeRequest({ ...validBody, installments: 'one' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  // installments below minimum
  it('installments = 0 — returns 400, backendFetch not called', async () => {
    const req = makeRequest({ ...validBody, installments: 0 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  // nested order missing required field
  it('missing order.customer_email — returns 400, backendFetch not called', async () => {
    const { customer_email: _, ...orderWithout } = validOrder;
    const req = makeRequest({ ...validBody, order: orderWithout });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  // nested order with invalid items
  it('order.items empty array — returns 400, backendFetch not called', async () => {
    const req = makeRequest({ ...validBody, order: { ...validOrder, items: [] } });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  // 400 response has structured error body
  it('400 response has { error, issues } structure', async () => {
    const req = makeRequest({ ...validBody, card_token: 123 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json() as Record<string, unknown>;
    expect(typeof body.error).toBe('string');
    expect(Array.isArray(body.issues)).toBe(true);
  });

  // Optional fields accepted
  it('valid body with optional fields — backendFetch called, 201 returned', async () => {
    const bodyWithOptionals = {
      ...validBody,
      issuer_id: 310,
      payer_identification_type: 'RUT',
      payer_identification_number: '12345678-9',
    };
    const req = makeRequest(bodyWithOptionals);
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(backendFetch).toHaveBeenCalledOnce();
  });

  // Unknown top-level field stripped
  it('unknown top-level field stripped before forward', async () => {
    const req = makeRequest({ ...validBody, __evil__: true });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const [, init] = backendFetch.mock.calls[0] as [string, { body: string }];
    const forwarded = JSON.parse(init.body as string);
    expect(forwarded).not.toHaveProperty('__evil__');
  });

  // Cookie NOT set when backend fails
  it('setOrderAccessCookie not called when backendFetch returns not ok', async () => {
    backendFetch.mockResolvedValue({ ok: false, status: 500, data: null });
    const req = makeRequest(validBody);
    await POST(req);
    expect(setOrderAccessCookie).not.toHaveBeenCalled();
  });
});
