/**
 * Tests for POST /api/auth/create-password — BFF-SEC-01/06/T2
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

describe('POST /api/auth/create-password', () => {
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
    new NextRequest('http://localhost/api/auth/create-password', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  it('valid { password } — proxyToBackend called once', async () => {
    const req = makeRequest({ password: 'abc123' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(proxyToBackend).toHaveBeenCalledOnce();
  });

  it('missing password — returns 400', async () => {
    const req = makeRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  it('5-char password — returns 400 (below min(6))', async () => {
    const req = makeRequest({ password: 'abc12' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  it('6-char password — returns 200 (min boundary)', async () => {
    const req = makeRequest({ password: 'abc123' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(proxyToBackend).toHaveBeenCalledOnce();
  });

  it('proxyToBackend called with pre-parsed body option', async () => {
    const req = makeRequest({ password: 'abc123' });
    await POST(req);
    const [, , options] = proxyToBackend.mock.calls[0] as [unknown, unknown, { body: unknown }];
    expect(options?.body).toEqual({ password: 'abc123' });
  });
});
