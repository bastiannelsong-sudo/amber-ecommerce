/**
 * Tests for POST /api/coupons/validate — BFF-NAV-03, BFF-NAV-07, BFF-NAV-08
 *
 * Pattern: hoisted vi.mock, vi.resetModules() + dynamic import() per test.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('../../../lib/bff-proxy', () => ({
  backendFetch: vi.fn(),
  proxyToBackend: vi.fn(),
}));

describe('POST /api/coupons/validate', () => {
  let proxyToBackend: ReturnType<typeof vi.fn>;
  let POST: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const proxyMod = await import('../../../lib/bff-proxy');
    const routeMod = await import('./route');

    proxyToBackend = vi.mocked(proxyMod.proxyToBackend);
    POST = routeMod.POST;

    proxyToBackend.mockResolvedValue(
      new Response(JSON.stringify({ discount: 10 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }) as unknown as import('next/server').NextResponse,
    );
  });

  const makeRequest = (body: unknown) =>
    new NextRequest('http://localhost/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  // BFF-NAV-03: valid body → proxyToBackend called once with v.data
  it('valid { code, cart_total } — proxyToBackend called once', async () => {
    const req = makeRequest({ code: 'SAVE10', cart_total: 99.9 });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(proxyToBackend).toHaveBeenCalledOnce();
    const [, , options] = proxyToBackend.mock.calls[0] as [unknown, unknown, { body: unknown }];
    expect(options?.body).toEqual({ code: 'SAVE10', cart_total: 99.9 });
  });

  // BFF-NAV-03: string cart_total → 400, backend not called
  it('cart_total as string — returns 400, backend not called', async () => {
    const req = makeRequest({ code: 'SAVE10', cart_total: 'ninety' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // BFF-NAV-03: missing code → 400
  it('missing code — returns 400', async () => {
    const req = makeRequest({ cart_total: 50 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // BFF-NAV-03: missing cart_total → 400
  it('missing cart_total — returns 400', async () => {
    const req = makeRequest({ code: 'SAVE10' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // BFF-NAV-08: 400 response has structured error body
  it('400 response has { error, issues } structure', async () => {
    const req = makeRequest({ cart_total: 'bad' });
    const res = await POST(req);
    const body = await res.json() as Record<string, unknown>;
    expect(typeof body.error).toBe('string');
    expect(Array.isArray(body.issues)).toBe(true);
  });
});
