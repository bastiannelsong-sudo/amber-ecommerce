/**
 * Tests for PATCH /api/addresses/[id] — BFF-NAV-06, BFF-NAV-07, BFF-NAV-08, BFF-NAV-T2
 *
 * Pattern: hoisted vi.mock, vi.resetModules() + dynamic import() per test.
 * GET and DELETE handlers untouched — not tested here.
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

describe('PATCH /api/addresses/[id]', () => {
  let proxyToBackend: ReturnType<typeof vi.fn>;
  let PATCH: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

  const routeCtx = { params: Promise.resolve({ id: '42' }) };

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const proxyMod = await import('../../../lib/bff-proxy');
    const sessionMod = await import('../../../lib/session');
    const routeMod = await import('./route');

    proxyToBackend = vi.mocked(proxyMod.proxyToBackend);
    const getSession = vi.mocked(sessionMod.getSession);
    PATCH = routeMod.PATCH;

    // Authenticated session mock (BFF-NAV-T2)
    getSession.mockResolvedValue({
      access_token: 'test-token',
      refresh_token: 'refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      customer: { user_id: 1, email: 'user@example.com', first_name: 'Test', last_name: 'User' },
    });

    proxyToBackend.mockResolvedValue(
      new Response(JSON.stringify({ id: 42, city: 'Arequipa' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }) as unknown as import('next/server').NextResponse,
    );
  });

  const makeRequest = (body: unknown) =>
    new NextRequest('http://localhost/api/addresses/42', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  // BFF-NAV-06: empty body {} → proxyToBackend called once with {}
  it('empty body {} — proxyToBackend called once with {}', async () => {
    const req = makeRequest({});
    const res = await PATCH(req, routeCtx);
    expect(res.status).toBe(200);
    expect(proxyToBackend).toHaveBeenCalledOnce();
    const [, , options] = proxyToBackend.mock.calls[0] as [unknown, unknown, { authenticated: boolean; body: unknown }];
    expect(options?.authenticated).toBe(true);
    expect(options?.body).toEqual({});
  });

  // BFF-NAV-06: partial update with one field → proxyToBackend called with that field
  it('partial { city: "Arequipa" } — proxyToBackend called with { city: "Arequipa" }', async () => {
    const req = makeRequest({ city: 'Arequipa' });
    const res = await PATCH(req, routeCtx);
    expect(res.status).toBe(200);
    expect(proxyToBackend).toHaveBeenCalledOnce();
    const [, , options] = proxyToBackend.mock.calls[0] as [unknown, unknown, { body: unknown }];
    expect(options?.body).toEqual({ city: 'Arequipa' });
  });

  // BFF-NAV-06: invalid field value → 400, backend not called
  it('{ street: "Hi" } (below min 5) — returns 400, backend not called', async () => {
    const req = makeRequest({ street: 'Hi' });
    const res = await PATCH(req, routeCtx);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // BFF-NAV-08: 400 response has structured error body
  it('400 response has { error, issues } structure', async () => {
    const req = makeRequest({ street: 'Hi' });
    const res = await PATCH(req, routeCtx);
    const body = await res.json() as Record<string, unknown>;
    expect(typeof body.error).toBe('string');
    expect(Array.isArray(body.issues)).toBe(true);
  });

  // URL uses the correct id param
  it('calls proxyToBackend with the correct path including id', async () => {
    const req = makeRequest({ city: 'Lima' });
    await PATCH(req, routeCtx);
    expect(proxyToBackend).toHaveBeenCalledOnce();
    const [, path] = proxyToBackend.mock.calls[0] as [unknown, string];
    expect(path).toBe('/ecommerce/me/addresses/42');
  });
});
