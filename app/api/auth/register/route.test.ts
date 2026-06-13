/**
 * Tests for POST /api/auth/register — BFF-SEC-01/T2
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

describe('POST /api/auth/register', () => {
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
        customer: { user_id: 2, email: 'ana@example.com', first_name: 'Ana', last_name: 'García' },
      },
    });
  });

  const makeRequest = (body: unknown) =>
    new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  it('valid body — backendFetch called once', async () => {
    const req = makeRequest({
      first_name: 'Ana',
      last_name: 'García',
      email: 'ana@example.com',
      password: '123456',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledOnce();
  });

  it('optional phone absent — still valid (200)', async () => {
    const req = makeRequest({
      first_name: 'Ana',
      last_name: 'García',
      email: 'ana@example.com',
      password: '123456',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledOnce();
  });

  it('missing first_name — returns 400', async () => {
    const req = makeRequest({
      last_name: 'García',
      email: 'ana@example.com',
      password: '123456',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it('missing last_name — returns 400', async () => {
    const req = makeRequest({
      first_name: 'Ana',
      email: 'ana@example.com',
      password: '123456',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it('missing email — returns 400', async () => {
    const req = makeRequest({
      first_name: 'Ana',
      last_name: 'García',
      password: '123456',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it('invalid email format — returns 400', async () => {
    const req = makeRequest({
      first_name: 'Ana',
      last_name: 'García',
      email: 'not-email',
      password: '123456',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it('wrong type on email (number) — returns 400', async () => {
    const req = makeRequest({
      first_name: 'Ana',
      last_name: 'García',
      email: 99999,
      password: '123456',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it('password shorter than 6 chars — returns 400', async () => {
    const req = makeRequest({
      first_name: 'Ana',
      last_name: 'García',
      email: 'ana@example.com',
      password: '12345',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it('unknown field stripped — backendFetch called without unknown field', async () => {
    const req = makeRequest({
      first_name: 'Ana',
      last_name: 'García',
      email: 'ana@example.com',
      password: '123456',
      unknown: 'drop-me',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledOnce();
    const [, init] = backendFetch.mock.calls[0] as [string, { body: string }];
    const forwarded = JSON.parse(init.body);
    expect(forwarded).not.toHaveProperty('unknown');
  });
});
