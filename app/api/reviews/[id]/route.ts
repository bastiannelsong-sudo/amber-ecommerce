import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../lib/bff-proxy';

/**
 * GET /api/reviews/[id]
 *
 * Devuelve reviews + estadísticas del producto cuyo ID es `id`.
 * Semánticamente es product_id, pero el slug se estandariza a `[id]` porque
 * App Router exige que los dynamic segments hermanos usen el mismo nombre
 * (`[id]/helpful/` es hermano en el mismo nivel de /api/reviews/).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackend(req, `/ecommerce/reviews/${id}`);
}
