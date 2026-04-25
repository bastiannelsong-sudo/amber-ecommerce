import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../lib/bff-proxy';

// GET /api/addresses → listado de direcciones del customer autenticado
export async function GET(req: NextRequest) {
  return proxyToBackend(req, '/ecommerce/me/addresses', { authenticated: true });
}

// POST /api/addresses → crea una direccion nueva
export async function POST(req: NextRequest) {
  return proxyToBackend(req, '/ecommerce/me/addresses', { authenticated: true });
}
