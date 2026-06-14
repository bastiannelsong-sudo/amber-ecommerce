import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../lib/bff-proxy';
import { validateBody } from '../../lib/validation';
import { createReviewSchema } from '../../lib/ecommerce/schemas';

/**
 * POST /api/reviews → create a product review
 *
 * Backend contract: POST /ecommerce/reviews (CreateReviewDto).
 * Validates the body before forwarding to avoid sending malformed data
 * to the backend. Invalid requests are rejected with 400 + structured
 * issues payload (BFF-SEC-02, BFF-SEC-03, ADR-002).
 */
export async function POST(req: NextRequest) {
  const v = await validateBody(req, createReviewSchema);
  if (!v.ok) return v.response;

  return proxyToBackend(req, '/ecommerce/reviews', { body: v.data });
}
