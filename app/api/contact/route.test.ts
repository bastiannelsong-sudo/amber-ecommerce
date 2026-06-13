/**
 * Tests for POST /api/contact — BFF-NAV-04, BFF-NAV-07, BFF-NAV-08
 *
 * Pattern: hoisted vi.mock, vi.resetModules() + dynamic import() per test.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('../../lib/bff-proxy', () => ({
  backendFetch: vi.fn(),
  proxyToBackend: vi.fn(),
}));

describe('POST /api/contact', () => {
  let proxyToBackend: ReturnType<typeof vi.fn>;
  let POST: (req: NextRequest) => Promise<Response>;

  const validBody = {
    name: 'Ana',
    email: 'ana@example.com',
    subject: 'Hello',
    message: 'World',
  };

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const proxyMod = await import('../../lib/bff-proxy');
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
    new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  // BFF-NAV-04: valid body → proxyToBackend called once
  it('valid contact body — proxyToBackend called once', async () => {
    const req = makeRequest(validBody);
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(proxyToBackend).toHaveBeenCalledOnce();
    const [, , options] = proxyToBackend.mock.calls[0] as [unknown, unknown, { body: unknown }];
    expect(options?.body).toEqual(validBody);
  });

  // BFF-NAV-04: invalid email → 400, backend not called (throttle guard)
  it('invalid email format — returns 400 without consuming throttle budget', async () => {
    const req = makeRequest({ ...validBody, email: 'not-an-email' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // BFF-NAV-04: message > 2000 chars → 400
  it('message exceeding 2000 chars — returns 400', async () => {
    const req = makeRequest({ ...validBody, message: 'x'.repeat(2001) });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // BFF-NAV-04: subject > 50 chars → 400
  it('subject exceeding 50 chars — returns 400', async () => {
    const req = makeRequest({ ...validBody, subject: 'x'.repeat(51) });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // Missing required field → 400
  it('missing name — returns 400', async () => {
    const { name: _, ...withoutName } = validBody;
    const req = makeRequest(withoutName);
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // BFF-NAV-08: 400 response has structured error body
  it('400 response has { error, issues } structure', async () => {
    const req = makeRequest({ ...validBody, email: 'bad' });
    const res = await POST(req);
    const body = await res.json() as Record<string, unknown>;
    expect(typeof body.error).toBe('string');
    expect(Array.isArray(body.issues)).toBe(true);
  });
});
