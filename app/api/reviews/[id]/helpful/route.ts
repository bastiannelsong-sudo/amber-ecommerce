import { NextResponse, type NextRequest } from 'next/server';
import { backendFetch } from '../../../../lib/bff-proxy';

/**
 * PATCH /api/reviews/[id]/helpful
 *
 * NOTE: The backend endpoint PATCH /ecommerce/reviews/:id/helpful is NOT
 * implemented in NestJS (ecommerce.controller only exposes GET reviews and
 * POST reviews). This BFF handler is a forward-compatible stub; when the
 * backend adds the helpful endpoint, this route will work automatically.
 * No request body is involved, so no validation is needed here.
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { ok, status, data } = await backendFetch(`/ecommerce/reviews/${id}/helpful`, {
    method: 'PATCH',
  });
  return NextResponse.json(data ?? {}, { status: ok ? 200 : status });
}
