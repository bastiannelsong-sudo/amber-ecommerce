import { NextResponse, type NextRequest } from 'next/server';
import { backendFetch } from '../../../../lib/bff-proxy';

/**
 * PATCH /api/reviews/[id]/helpful
 *
 * ⚠️  TODO (backend-pendiente al 2026-04-20):
 * El endpoint `PATCH /ecommerce/reviews/:id/helpful` NO está implementado en
 * NestJS (ecommerce.controller solo tiene GET reviews). Este BFF queda listo;
 * cuando el backend sume la feature, funciona automáticamente.
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
