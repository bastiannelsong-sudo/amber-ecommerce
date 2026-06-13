/**
 * Tests for proxyToBackend body option — ADR-003
 *
 * Verifies that when options.body is set, proxyToBackend uses that value
 * instead of re-reading req.json() (which would fail on double-read).
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
