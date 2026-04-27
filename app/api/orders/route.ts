import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../lib/bff-proxy';

// POST /api/orders → crear orden (checkout).
// optionalAuth: si el usuario esta logueado se inyecta JWT y la orden
// queda asociada al customer; si es guest la orden se crea sin owner.
export async function POST(req: NextRequest) {
  return proxyToBackend(req, '/ecommerce/orders', { optionalAuth: true });
}
