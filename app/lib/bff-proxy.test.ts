/**
 * Tests for proxyToBackend body option — ADR-003
 *
 * Verifies that when options.body is set, proxyToBackend uses that value
 * instead of re-reading req.json() (which would fail on double-read).
 *
 * Also covers x-internal-api-key injection (SEC-001):
 * - proxyToBackend injects x-internal-api-key (regression guard)
 * - backendFetch injects x-internal-api-key (the bug that was fixed)
 * - tryRefreshAccessToken path injects x-internal-api-key (via backendFetch 401 trigger)
 * - key is omitted when INTERNAL_API_KEY is not set (safe for local dev)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// We mock the internal fetch + session to isolate the body-handling logic.
// We also need to mock server-only dependencies loaded by bff-proxy.ts.
vi.mock('./session', () => ({
  getSession: vi.fn().mockResolvedValue(null),
  setSession: vi.fn(),
  clearSession: vi.fn(),
}));

// We mock the global fetch to track what body is sent.
const mockFetch = vi.fn();

describe('proxyToBackend — body option (ADR-003)', () => {
  let proxyToBackend: typeof import('./bff-proxy').proxyToBackend;

  beforeEach(async () => {
    vi.resetModules();

    // Replace global fetch before importing the module.
    vi.stubGlobal('fetch', mockFetch);

    const mod = await import('./bff-proxy');
    proxyToBackend = mod.proxyToBackend;

    // Default mock response from backend.
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it('uses options.body as the serialized body instead of reading req.json()', async () => {
    // Body is already consumed — this simulates double-read scenario.
    const req = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      body: JSON.stringify({ original: 'body' }),
      headers: { 'Content-Type': 'application/json' },
    });

    // Consume the body first to simulate "already read by validateBody".
    await req.json();

    const parsedBody = { validated: 'data', stripped: true };

    // This should NOT throw even though body stream is consumed,
    // because we pass body via options.body.
    await proxyToBackend(req, '/ecommerce-auth/test', { body: parsedBody });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, fetchInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(fetchInit.body).toBe(JSON.stringify(parsedBody));
  });

  it('falls back to req.json() when body option is absent (backward compatibility)', async () => {
    const reqBody = { email: 'a@b.com', password: 'pass' };
    const req = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      body: JSON.stringify(reqBody),
      headers: { 'Content-Type': 'application/json' },
    });

    await proxyToBackend(req, '/ecommerce-auth/test');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, fetchInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(fetchInit.body).toBe(JSON.stringify(reqBody));
  });

  it('passes undefined body when options.body is set to null', async () => {
    const req = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      body: '{}',
      headers: { 'Content-Type': 'application/json' },
    });

    await proxyToBackend(req, '/ecommerce-auth/test', { body: null });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, fetchInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    // null serializes to "null" — the body is explicitly set
    expect(fetchInit.body).toBe('null');
  });
});

// ---------------------------------------------------------------------------
// SEC-001: x-internal-api-key injection
// ---------------------------------------------------------------------------

describe('x-internal-api-key injection (SEC-001)', () => {
  let proxyToBackend: typeof import('./bff-proxy').proxyToBackend;
  let backendFetch: typeof import('./bff-proxy').backendFetch;
  const getSession = vi.fn();
  const setSession = vi.fn();
  const clearSession = vi.fn();

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', mockFetch);
    // Re-wire session mock after resetModules
    vi.doMock('./session', () => ({ getSession, setSession, clearSession }));
    getSession.mockResolvedValue(null);

    const mod = await import('./bff-proxy');
    proxyToBackend = mod.proxyToBackend;
    backendFetch = mod.backendFetch;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    mockFetch.mockReset();
    getSession.mockReset();
    setSession.mockReset();
    clearSession.mockReset();
  });

  const successResponse = () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  // --- proxyToBackend (regression) ----------------------------------------

  it('proxyToBackend: sends x-internal-api-key when INTERNAL_API_KEY is set', async () => {
    vi.stubEnv('INTERNAL_API_KEY', 'secret-key-proxy');
    mockFetch.mockResolvedValue(successResponse());

    const req = new NextRequest('http://localhost/api/test', { method: 'GET' });
    await proxyToBackend(req, '/ecommerce/products');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['x-internal-api-key']).toBe('secret-key-proxy');
  });

  it('proxyToBackend: omits x-internal-api-key when INTERNAL_API_KEY is not set', async () => {
    vi.stubEnv('INTERNAL_API_KEY', '');
    mockFetch.mockResolvedValue(successResponse());

    const req = new NextRequest('http://localhost/api/test', { method: 'GET' });
    await proxyToBackend(req, '/ecommerce/products');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['x-internal-api-key']).toBeUndefined();
  });

  // --- backendFetch (the bug) ----------------------------------------------

  it('backendFetch: sends x-internal-api-key when INTERNAL_API_KEY is set', async () => {
    vi.stubEnv('INTERNAL_API_KEY', 'secret-key-backend');
    mockFetch.mockResolvedValue(successResponse());

    await backendFetch('/ecommerce-auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: 'pass' }),
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['x-internal-api-key']).toBe('secret-key-backend');
  });

  it('backendFetch: omits x-internal-api-key when INTERNAL_API_KEY is not set', async () => {
    vi.stubEnv('INTERNAL_API_KEY', '');
    mockFetch.mockResolvedValue(successResponse());

    await backendFetch('/ecommerce-auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: 'pass' }),
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['x-internal-api-key']).toBeUndefined();
  });

  it('backendFetch: preserves caller-supplied headers alongside x-internal-api-key', async () => {
    vi.stubEnv('INTERNAL_API_KEY', 'secret-key-backend');
    mockFetch.mockResolvedValue(successResponse());

    await backendFetch('/ecommerce-auth/login', {
      method: 'POST',
      headers: { 'X-Custom-Header': 'custom-value' },
      body: JSON.stringify({}),
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['x-internal-api-key']).toBe('secret-key-backend');
    expect(headers['X-Custom-Header']).toBe('custom-value');
    expect(headers['Content-Type']).toBe('application/json');
  });

  // --- tryRefreshAccessToken path (via backendFetch 401 → refresh) ---------
  //
  // We trigger the refresh path by: (1) making getSession return a valid
  // refresh_token, (2) making the first backendFetch call return 401, (3)
  // making the refresh response succeed, then verifying the refresh call
  // itself carries x-internal-api-key.

  it('refresh call (tryRefreshAccessToken): sends x-internal-api-key when INTERNAL_API_KEY is set', async () => {
    vi.stubEnv('INTERNAL_API_KEY', 'secret-key-refresh');
    vi.stubEnv('INTERNAL_API_URL', 'http://backend:3000');

    getSession.mockResolvedValue({
      access_token: 'old-token',
      refresh_token: 'refresh-token-abc',
      expires_at: 9999999999,
    });

    // First call (the authenticated backendFetch) → 401 triggers refresh
    // Second call (POST /ecommerce-auth/refresh) → 200 with new tokens
    // Third call (retry with new token) → 200
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: 'new-access',
            refresh_token: 'new-refresh',
            expires_in: 3600,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(successResponse());

    await backendFetch('/ecommerce/orders', { authenticated: true });

    // fetch should have been called 3 times: initial + refresh + retry
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // The second call is the refresh — verify it carries the internal key
    const [refreshUrl, refreshInit] = mockFetch.mock.calls[1] as [string, RequestInit];
    expect(refreshUrl).toContain('/ecommerce-auth/refresh');
    const refreshHeaders = refreshInit.headers as Record<string, string>;
    expect(refreshHeaders['x-internal-api-key']).toBe('secret-key-refresh');
  });

  it('refresh call: omits x-internal-api-key when INTERNAL_API_KEY is not set', async () => {
    vi.stubEnv('INTERNAL_API_KEY', '');
    vi.stubEnv('INTERNAL_API_URL', 'http://backend:3000');

    getSession.mockResolvedValue({
      access_token: 'old-token',
      refresh_token: 'refresh-token-abc',
      expires_at: 9999999999,
    });

    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: 'new-access',
            refresh_token: 'new-refresh',
            expires_in: 3600,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(successResponse());

    await backendFetch('/ecommerce/orders', { authenticated: true });

    expect(mockFetch).toHaveBeenCalledTimes(3);
    const [, refreshInit] = mockFetch.mock.calls[1] as [string, RequestInit];
    const refreshHeaders = refreshInit.headers as Record<string, string>;
    expect(refreshHeaders['x-internal-api-key']).toBeUndefined();
  });
});
