import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../lib/bff-proxy';

// GET /api/geo → regiones + comunas de Chile (publico, cacheable)
export async function GET(req: NextRequest) {
  return proxyToBackend(req, '/ecommerce/geo/regions-communes');
}
