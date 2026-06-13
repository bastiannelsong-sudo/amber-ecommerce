/**
 * Tests for POST /api/auth/reset-password — BFF-SEC-01/06/07/T2 + BFF-RL-02/05/06/07/T3
 *
 * Key: field is new_password (NOT password). BFF-SEC-07.
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

describe('POST /api/auth/reset-password', () => {
  let proxyToBackend: ReturnType<typeof vi.fn>;
  let enforceRateLimit: ReturnType<typeof vi.fn>;
  let POST: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const proxyMod = await import('../../../lib/bff-proxy');
    const enforceMod = await import('../../../lib/rate-limit/enforce');
    const routeMod = await import('./route');

    proxyToBackend = vi.mocked(proxyMod.proxyToBackend);
    enforceRateLimit = vi.mocked(enforceMod.enforceRateLimit);
    POST = routeMod.POST;

    proxyToBackend.mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }) as unknown as import('next/server').NextResponse,
    );
    enforceRateLimit.mockResolvedValue(null); // default: under limit, proceed
  });

  const makeRequest = (body: unknown) =>
    new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  // BFF-SEC-T2: valid { token, new_password } → proxy called once
  it('valid { token, new_password } — proxyToBackend called once', async () => {
    const req = makeRequest({ token: 'tok123', new_password: 'abc123' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(proxyToBackend).toHaveBeenCalledOnce();
  });

  // BFF-SEC-07: body with `password` instead of `new_password` → 400
  it('body with "password" instead of "new_password" — returns 400', async () => {
    const req = makeRequest({ token: 'tok123', password: 'abc123' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // BFF-SEC-06: 5-char new_password → 400
  it('5-char new_password — returns 400 (below min(6))', async () => {
    const req = makeRequest({ token: 'tok123', new_password: 'abc12' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // BFF-SEC-06: 6-char new_password → 200
  it('6-char new_password — returns 200 (min boundary)', async () => {
    const req = makeRequest({ token: 'tok123', new_password: 'abc123' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(proxyToBackend).toHaveBeenCalledOnce();
  });

  it('missing token — returns 400', async () => {
    const req = makeRequest({ new_password: 'abc123' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  it('missing new_password — returns 400', async () => {
    const req = makeRequest({ token: 'tok123' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  it('proxyToBackend called with pre-parsed body option', async () => {
    const req = makeRequest({ token: 'tok123', new_password: 'abc123' });
    await POST(req);
    const [, , options] = proxyToBackend.mock.calls[0] as [unknown, unknown, { body: unknown }];
    expect(options?.body).toEqual({ token: 'tok123', new_password: 'abc123' });
  });

  // BFF-RL-05/T3: under-limit → proceeds normally
  it('rate-limit: enforceRateLimit returns null — handler proceeds to validateBody', async () => {
    enforceRateLimit.mockResolvedValue(null);
    const req = makeRequest({ token: 'tok123', new_password: 'abc123' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(proxyToBackend).toHaveBeenCalledOnce();
  });

  // BFF-RL-06/T3: over-limit → 429, proxyToBackend NOT called
  it('rate-limit: enforceRateLimit returns 429 — handler short-circuits, proxyToBackend not called', async () => {
    const rateLimitedResponse = NextResponse.json(
      { error: 'rate_limited', message: 'Demasiados intentos. Intentá de nuevo más tarde.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
    enforceRateLimit.mockResolvedValue(rateLimitedResponse);

    const req = makeRequest({ token: 'tok123', new_password: 'abc123' });
    const res = await POST(req);

    expect(res.status).toBe(429);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // BFF-RL-07/T3: null limiter (fail-open) → proceed
  it('rate-limit: null limiter (unconfigured) — handler proceeds', async () => {
    enforceRateLimit.mockResolvedValue(null);
    const req = makeRequest({ token: 'tok123', new_password: 'abc123' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(enforceRateLimit).toHaveBeenCalledWith(expect.any(NextRequest), 'reset');
  });

  // BFF-RL-08/T4: enforce throws internally → null returned → proceed
  it('rate-limit: enforceRateLimit returns null after internal throw — handler proceeds', async () => {
    enforceRateLimit.mockResolvedValue(null);
    const req = makeRequest({ token: 'tok123', new_password: 'abc123' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(proxyToBackend).toHaveBeenCalledOnce();
  });
});
