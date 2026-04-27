import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../lib/bff-proxy';

// GET /api/orders/me → lista de pedidos del usuario autenticado.
// Requiere sesión: rechaza con 401 si no hay JWT.
export async function GET(req: NextRequest) {
  return proxyToBackend(req, '/ecommerce/orders/me', { authenticated: true });
}
