/**
 * Tests for POST /api/auth/login — BFF-SEC-01/02/03/T1/T2 + BFF-RL-02/05/06/07/T3/T4
 *
 * Pattern: hoisted vi.mock, vi.resetModules() + dynamic import() per test.
 * Follows route.test.ts from app/api/orders/[orderNumber]/route.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('../../../lib/bff-proxy', () => ({
  backendFetch: vi.fn(),
  proxyToBackend: vi.fn(),
}));

vi.mock('../../../lib/session', () => ({
  getSession: vi.fn(),
  setSession: vi.fn(),
  clearSession: vi.fn(),
}));

vi.mock('../../../lib/rate-limit/enforce', () => ({
  enforceRateLimit: vi.fn(),
}));

describe('POST /api/auth/login', () => {
  let backendFetch: ReturnType<typeof vi.fn>;
  let setSession: ReturnType<typeof vi.fn>;
  let enforceRateLimit: ReturnType<typeof vi.fn>;
  let POST: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const proxyMod = await import('../../../lib/bff-proxy');
    const sessionMod = await import('../../../lib/session');
    const enforceMod = await import('../../../lib/rate-limit/enforce');
    const routeMod = await import('./route');

    backendFetch = vi.mocked(proxyMod.backendFetch);
    setSession = vi.mocked(sessionMod.setSession);
    enforceRateLimit = vi.mocked(enforceMod.enforceRateLimit);
    POST = routeMod.POST;

    backendFetch.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        access_token: 'tok',
        refresh_token: 'ref',
        customer: { user_id: 1, email: 'a@b.com', first_name: 'A', last_name: 'B' },
      },
    });
    setSession.mockResolvedValue(undefined);
    enforceRateLimit.mockResolvedValue(null); // default: under limit, proceed
  });

  const makeRequest = (body: unknown) =>
    new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  // BFF-SEC-T2: valid body forwards parsed object once
  it('valid body — backendFetch called once with parsed object', async () => {
    const req = makeRequest({ email: 'a@b.com', password: 'secret' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledOnce();
    const [, init] = backendFetch.mock.calls[0] as [string, { body: string }];
    const forwarded = JSON.parse(init.body as string);
    expect(forwarded).toEqual({ email: 'a@b.com', password: 'secret' });
  });

  // BFF-SEC-T2: missing email → 400, no proxy call
  it('missing email — returns 400, backendFetch not called', async () => {
    const req = makeRequest({ password: 'secret' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  // BFF-SEC-T2: missing password → 400, no proxy call
  it('missing password — returns 400, backendFetch not called', async () => {
    const req = makeRequest({ email: 'a@b.com' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  // BFF-SEC-T2: wrong type on email → 400
  it('wrong type for email (number) — returns 400', async () => {
    const req = makeRequest({ email: 12345, password: 'secret' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  // BFF-SEC-T2: invalid email format → 400
  it('invalid email format — returns 400', async () => {
    const req = makeRequest({ email: 'not-an-email', password: 'secret' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  // BFF-SEC-T2: unknown field stripped before forward
  it('unknown field stripped — backendFetch called without __proto__', async () => {
    const req = makeRequest({ email: 'a@b.com', password: 'secret', __proto__: 'evil' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledOnce();
    const [, init] = backendFetch.mock.calls[0] as [string, { body: string }];
    const forwarded = JSON.parse(init.body as string);
    expect(forwarded).not.toHaveProperty('__proto__');
    expect(forwarded).toEqual({ email: 'a@b.com', password: 'secret' });
  });

  // BFF-SEC-02: 400 response has structured error body
  it('400 response has { error, issues } structure', async () => {
    const req = makeRequest({ email: 'bad' });
    const res = await POST(req);
    const body = await res.json() as Record<string, unknown>;
    expect(typeof body.error).toBe('string');
    expect(Array.isArray(body.issues)).toBe(true);
  });

  // Malformed JSON returns structured error
  it('malformed JSON body — returns 400 with error: invalid_request', async () => {
    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: '{broken json',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json() as Record<string, unknown>;
    expect(body.error).toBe('invalid_request');
    expect(backendFetch).not.toHaveBeenCalled();
  });

  // BFF-RL-05/T3: under-limit (null) → proceeds normally
  it('rate-limit: enforceRateLimit returns null — handler proceeds to validateBody', async () => {
    enforceRateLimit.mockResolvedValue(null);
    const req = makeRequest({ email: 'a@b.com', password: 'secret' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledOnce();
  });

  // BFF-RL-06/T3: over-limit → 429, validateBody and backendFetch NOT called
  it('rate-limit: enforceRateLimit returns 429 — handler short-circuits, backendFetch not called', async () => {
    const rateLimitedResponse = NextResponse.json(
      { error: 'rate_limited', message: 'Demasiados intentos. Intentá de nuevo más tarde.' },
      { status: 429, headers: { 'Retry-After': '30' } },
    );
    enforceRateLimit.mockResolvedValue(rateLimitedResponse);

    const req = makeRequest({ email: 'a@b.com', password: 'secret' });
    const res = await POST(req);

    expect(res.status).toBe(429);
    expect(backendFetch).not.toHaveBeenCalled();
    expect(setSession).not.toHaveBeenCalled();
  });

  // BFF-RL-07/T3: null limiter (fail-open) → proceed (enforceRateLimit already returns null)
  it('rate-limit: null limiter (unconfigured) — handler proceeds', async () => {
    enforceRateLimit.mockResolvedValue(null);
    const req = makeRequest({ email: 'a@b.com', password: 'secret' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(enforceRateLimit).toHaveBeenCalledWith(expect.any(NextRequest), 'login');
  });

  // BFF-RL-08/T4: enforce throws internally → enforceRateLimit returns null (fail-open)
  it('rate-limit: enforceRateLimit returns null after internal throw — handler proceeds', async () => {
    enforceRateLimit.mockResolvedValue(null);
    const req = makeRequest({ email: 'a@b.com', password: 'secret' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledOnce();
  });
});
