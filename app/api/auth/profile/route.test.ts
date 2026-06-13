/**
 * Tests for /api/auth/profile — BFF-SEC-05/T2
 *
 * PUT: all fields optional, empty {} is valid (BFF-SEC-05).
 * GET: passes through untouched (no validation).
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

describe('/api/auth/profile', () => {
  let proxyToBackend: ReturnType<typeof vi.fn>;
  let GET: (req: NextRequest) => Promise<Response>;
  let PUT: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const proxyMod = await import('../../../lib/bff-proxy');
    const routeMod = await import('./route');

    proxyToBackend = vi.mocked(proxyMod.proxyToBackend);
    GET = routeMod.GET;
    PUT = routeMod.PUT;

    proxyToBackend.mockResolvedValue(
      new Response(JSON.stringify({ first_name: 'Marco' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }) as unknown as import('next/server').NextResponse,
    );
  });

  const makePutRequest = (body: unknown) =>
    new NextRequest('http://localhost/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  const makeGetRequest = () =>
    new NextRequest('http://localhost/api/auth/profile', {
      method: 'GET',
    });

  // BFF-SEC-05: empty body {} → PUT proxy called once
  it('PUT with empty body {} — proxyToBackend called once (BFF-SEC-05)', async () => {
    const req = makePutRequest({});
    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(proxyToBackend).toHaveBeenCalledOnce();
  });

  // BFF-SEC-05: partial update with only first_name
  it('PUT { first_name: "Marco" } — proxyToBackend called with { first_name: "Marco" }', async () => {
    const req = makePutRequest({ first_name: 'Marco' });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(proxyToBackend).toHaveBeenCalledOnce();
    const [, , options] = proxyToBackend.mock.calls[0] as [unknown, unknown, { body: unknown }];
    expect(options?.body).toEqual({ first_name: 'Marco' });
  });

  // BFF-SEC-05: invalid email → 400
  it('PUT { email: "not-email" } — returns 400', async () => {
    const req = makePutRequest({ email: 'not-email' });
    const res = await PUT(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // GET handler must pass through untouched (no validation on GET)
  it('GET — proxyToBackend called once without body validation', async () => {
    const req = makeGetRequest();
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(proxyToBackend).toHaveBeenCalledOnce();
  });

  it('PUT with unknown field — field is stripped, proxy called with clean body', async () => {
    const req = makePutRequest({ first_name: 'Marco', __proto__: 'evil' });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    const [, , options] = proxyToBackend.mock.calls[0] as [unknown, unknown, { body: unknown }];
    const forwarded = options?.body as Record<string, unknown>;
    expect(forwarded).not.toHaveProperty('__proto__');
    expect(forwarded).toEqual({ first_name: 'Marco' });
  });

  it('PUT with valid full profile — proxyToBackend called once', async () => {
    const req = makePutRequest({
      first_name: 'Marco',
      last_name: 'Polo',
      email: 'marco@example.com',
      phone: '+56912345678',
      avatar_url: 'https://example.com/avatar.jpg',
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(proxyToBackend).toHaveBeenCalledOnce();
  });
});
