/**
 * Tests for POST /api/addresses — BFF-NAV-05, BFF-NAV-07, BFF-NAV-08, BFF-NAV-09, BFF-NAV-T2
 *
 * Pattern: hoisted vi.mock, vi.resetModules() + dynamic import() per test.
 * GET handler untouched — not tested here.
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

describe('POST /api/addresses', () => {
  let proxyToBackend: ReturnType<typeof vi.fn>;
  let POST: (req: NextRequest) => Promise<Response>;

  const validBody = {
    street: 'Main St 123',
    city: 'Lima',
    region: 'Lima',
  };

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const proxyMod = await import('../../lib/bff-proxy');
    const sessionMod = await import('../../lib/session');
    const routeMod = await import('./route');

    proxyToBackend = vi.mocked(proxyMod.proxyToBackend);
    const getSession = vi.mocked(sessionMod.getSession);
    POST = routeMod.POST;

    // Authenticated session mock (BFF-NAV-T2)
    getSession.mockResolvedValue({
      access_token: 'test-token',
      refresh_token: 'refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user_id: 1,
      email: 'user@example.com',
      first_name: 'Test',
      last_name: 'User',
    });

    proxyToBackend.mockResolvedValue(
      new Response(JSON.stringify({ id: 1, street: 'Main St 123' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }) as unknown as import('next/server').NextResponse,
    );
  });

  const makeRequest = (body: unknown) =>
    new NextRequest('http://localhost/api/addresses', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  // BFF-NAV-05: valid body → proxyToBackend called once with { authenticated: true, body: v.data }
  it('valid address — proxyToBackend called once with authenticated:true and v.data', async () => {
    const req = makeRequest(validBody);
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(proxyToBackend).toHaveBeenCalledOnce();
    const [, , options] = proxyToBackend.mock.calls[0] as [unknown, unknown, { authenticated: boolean; body: unknown }];
    expect(options?.authenticated).toBe(true);
    expect(options?.body).toEqual(validBody);
  });

  // BFF-NAV-05: street < 5 chars → 400, backend not called
  it('street below min length — returns 400, backend not called', async () => {
    const req = makeRequest({ ...validBody, street: 'Hi' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // BFF-NAV-05: city < 2 chars → 400
  it('city below min length — returns 400', async () => {
    const req = makeRequest({ ...validBody, city: 'X' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // BFF-NAV-09: unknown field stripped before forward
  it('unknown field injected — stripped before forward', async () => {
    const req = makeRequest({ ...validBody, injected: true });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(proxyToBackend).toHaveBeenCalledOnce();
    const [, , options] = proxyToBackend.mock.calls[0] as [unknown, unknown, { body: unknown }];
    const forwarded = options?.body as Record<string, unknown>;
    expect(forwarded).not.toHaveProperty('injected');
    expect(forwarded).toEqual(validBody);
  });

  // Missing required field → 400
  it('missing region — returns 400', async () => {
    const { region: _, ...withoutRegion } = validBody;
    const req = makeRequest(withoutRegion);
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // BFF-NAV-08: 400 response has structured error body
  it('400 response has { error, issues } structure', async () => {
    const req = makeRequest({ ...validBody, street: 'Hi' });
    const res = await POST(req);
    const body = await res.json() as Record<string, unknown>;
    expect(typeof body.error).toBe('string');
    expect(Array.isArray(body.issues)).toBe(true);
  });
});
