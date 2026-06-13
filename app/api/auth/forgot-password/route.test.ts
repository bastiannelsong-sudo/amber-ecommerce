/**
 * Tests for POST /api/auth/forgot-password — BFF-SEC-01/02/03/T2
 *
 * Important: 400 response body must NOT echo the submitted email value
 * (generic error to prevent email-existence leaking — BFF-SEC-T2, ADR-004).
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

describe('POST /api/auth/forgot-password', () => {
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
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }) as unknown as import('next/server').NextResponse,
    );
  });

  const makeRequest = (body: unknown) =>
    new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  // BFF-SEC-T2: valid email → proxy called once
  it('valid email — proxyToBackend called once', async () => {
    const req = makeRequest({ email: 'a@b.com' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(proxyToBackend).toHaveBeenCalledOnce();
  });

  // BFF-SEC-T2: invalid email → 400, no proxy call
  it('invalid email format — returns 400, proxyToBackend not called', async () => {
    const req = makeRequest({ email: 'not-an-email' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // BFF-SEC-T2: missing email → 400, no proxy call
  it('missing email — returns 400, proxyToBackend not called', async () => {
    const req = makeRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // ADR-004: 400 response body does NOT echo email value (generic error)
  it('400 response body does NOT contain the submitted email value', async () => {
    const sensitiveEmail = 'victim@example.com';
    const req = makeRequest({ email: 'not-an-email', someData: sensitiveEmail });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).not.toContain(sensitiveEmail);
    expect(text).not.toContain('not-an-email');
  });

  // BFF-SEC-T2: proxyToBackend called with parsed body (not raw req)
  it('valid email — proxyToBackend called with pre-parsed body option', async () => {
    const req = makeRequest({ email: 'a@b.com' });
    await POST(req);
    expect(proxyToBackend).toHaveBeenCalledOnce();
    const [, , options] = proxyToBackend.mock.calls[0] as [unknown, unknown, { body: unknown }];
    expect(options?.body).toEqual({ email: 'a@b.com' });
  });
});
