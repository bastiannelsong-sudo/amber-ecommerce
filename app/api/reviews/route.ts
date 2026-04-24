import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../lib/bff-proxy';

/**
 * POST /api/reviews → crear review
 *
 * ⚠️  TODO (backend-pendiente al 2026-04-20):
 * El endpoint `POST /ecommerce/reviews` NO está implementado en NestJS.
 * El ecommerce.controller solo expone GET /ecommerce/reviews/:productId.
 * Este BFF queda listo; cuando el backend sume el POST (ver ReviewForm),
 * funciona automáticamente. Hasta entonces devuelve 404 del backend.
 */
export async function POST(req: NextRequest) {
  return proxyToBackend(req, '/ecommerce/reviews');
}
