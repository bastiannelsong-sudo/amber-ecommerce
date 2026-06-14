/**
 * Tests for POST /api/reviews — reviews BFF validation
 *
 * Backend contract source:
 *   amber-back/src/ecommerce/dto/create-review.dto.ts (CreateReviewDto)
 *   amber-back/src/ecommerce/ecommerce.controller.ts (createReview)
 *
 * Pattern: hoisted vi.mock, vi.resetModules() + dynamic import() per test.
 * Reviews route uses proxyToBackend (no cookie side-effects needed).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('../../lib/bff-proxy', () => ({
  backendFetch: vi.fn(),
  proxyToBackend: vi.fn(),
}));

describe('POST /api/reviews', () => {
  let proxyToBackend: ReturnType<typeof vi.fn>;
  let POST: (req: NextRequest) => Promise<Response>;

  const validReviewBody = {
    product_id: 42,
    customer_name: 'Jane Smith',
    customer_email: 'jane@example.com',
    rating: 4,
    comment: 'Great product, very satisfied!',
  };

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const proxyMod = await import('../../lib/bff-proxy');
    const routeMod = await import('./route');

    proxyToBackend = vi.mocked(proxyMod.proxyToBackend);
    POST = routeMod.POST;

    proxyToBackend.mockResolvedValue(
      new Response(JSON.stringify({ id: 1, rating: 4 }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }) as unknown as import('next/server').NextResponse,
    );
  });

  const makeRequest = (body: unknown) =>
    new NextRequest('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  // Happy path: valid minimal body (no optional fields)
  it('valid review body — proxyToBackend called once with parsed data', async () => {
    const req = makeRequest(validReviewBody);
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(proxyToBackend).toHaveBeenCalledOnce();
    const [, , options] = proxyToBackend.mock.calls[0] as [unknown, unknown, { body: unknown }];
    expect(options?.body).toEqual(validReviewBody);
  });

  // Happy path: valid body with optional fields
  it('valid review with optional title and order_number — proxyToBackend called, 201', async () => {
    const bodyWithOptionals = {
      ...validReviewBody,
      title: 'Excellent!',
      order_number: 'ORD-2026-001',
    };
    const req = makeRequest(bodyWithOptionals);
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(proxyToBackend).toHaveBeenCalledOnce();
    const [, , options] = proxyToBackend.mock.calls[0] as [unknown, unknown, { body: unknown }];
    expect(options?.body).toEqual(bodyWithOptionals);
  });

  // Missing required field: product_id
  it('missing product_id — returns 400, backend not called', async () => {
    const { product_id: _, ...bodyWithout } = validReviewBody;
    const req = makeRequest(bodyWithout);
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // Missing required field: customer_name
  it('missing customer_name — returns 400, backend not called', async () => {
    const { customer_name: _, ...bodyWithout } = validReviewBody;
    const req = makeRequest(bodyWithout);
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // Missing required field: comment
  it('missing comment — returns 400, backend not called', async () => {
    const { comment: _, ...bodyWithout } = validReviewBody;
    const req = makeRequest(bodyWithout);
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // Invalid email format
  it('customer_email not an email — returns 400, backend not called', async () => {
    const req = makeRequest({ ...validReviewBody, customer_email: 'not-an-email' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // Wrong type: product_id as string
  it('product_id as string — returns 400, backend not called', async () => {
    const req = makeRequest({ ...validReviewBody, product_id: 'abc' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // Rating out of range: 0 (below min)
  it('rating = 0 (below min 1) — returns 400, backend not called', async () => {
    const req = makeRequest({ ...validReviewBody, rating: 0 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // Rating out of range: 6 (above max)
  it('rating = 6 (above max 5) — returns 400, backend not called', async () => {
    const req = makeRequest({ ...validReviewBody, rating: 6 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // Rating wrong type: string
  it('rating as string — returns 400, backend not called', async () => {
    const req = makeRequest({ ...validReviewBody, rating: 'five' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(proxyToBackend).not.toHaveBeenCalled();
  });

  // 400 response has structured error body
  it('400 response has { error, issues } structure', async () => {
    const req = makeRequest({ ...validReviewBody, rating: 0 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(typeof body.error).toBe('string');
    expect(Array.isArray(body.issues)).toBe(true);
  });

  // Unknown fields stripped
  it('unknown field stripped before forward', async () => {
    const req = makeRequest({ ...validReviewBody, __evil__: true });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(proxyToBackend).toHaveBeenCalledOnce();
    const [, , options] = proxyToBackend.mock.calls[0] as [unknown, unknown, { body: unknown }];
    expect(options?.body).not.toHaveProperty('__evil__');
  });
});
