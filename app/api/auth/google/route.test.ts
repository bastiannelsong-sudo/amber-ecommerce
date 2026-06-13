/**
 * Tests for POST /api/auth/google — BFF-SEC-04/T2
 *
 * Confirms the credential field fix (id_token → credential).
 * { credential } is accepted, { id_token } is rejected.
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

describe('POST /api/auth/google', () => {
  let backendFetch: ReturnType<typeof vi.fn>;
  let POST: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const proxyMod = await import('../../../lib/bff-proxy');
    const sessionMod = await import('../../../lib/session');
    const routeMod = await import('./route');

    backendFetch = vi.mocked(proxyMod.backendFetch);
    vi.mocked(sessionMod.setSession).mockResolvedValue(undefined);
    POST = routeMod.POST;

    backendFetch.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        access_token: 'tok',
        refresh_token: 'ref',
        customer: { user_id: 3, email: 'g@google.com', first_name: 'G', last_name: 'User' },
        was_linked: false,
        is_new_account: false,
      },
    });
  });

  const makeRequest = (body: unknown) =>
    new NextRequest('http://localhost/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  // BFF-SEC-04: { credential } → backendFetch called with { credential }
  it('{ credential: "tok" } — backendFetch called with { credential: "tok" }', async () => {
    const req = makeRequest({ credential: 'google-jwt-token' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledOnce();
    const [, init] = backendFetch.mock.calls[0] as [string, { body: string }];
    const forwarded = JSON.parse(init.body);
    expect(forwarded).toEqual({ credential: 'google-jwt-token' });
    expect(forwarded).not.toHaveProperty('id_token');
  });

  // BFF-SEC-04: { id_token } → 400, backendFetch not called
  it('{ id_token: "tok" } — returns 400, backendFetch not called', async () => {
    const req = makeRequest({ id_token: 'google-jwt-token' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it('missing credential — returns 400', async () => {
    const req = makeRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it('empty string credential — returns 400', async () => {
    const req = makeRequest({ credential: '' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it('unknown field stripped — backendFetch called without extra fields', async () => {
    const req = makeRequest({ credential: 'google-jwt-token', extra: 'drop' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const [, init] = backendFetch.mock.calls[0] as [string, { body: string }];
    const forwarded = JSON.parse(init.body);
    expect(forwarded).not.toHaveProperty('extra');
  });
});
