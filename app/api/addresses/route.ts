import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../lib/bff-proxy';
import { validateBody } from '../../lib/validation';
import { createAddressSchema } from '../../lib/addresses/schemas';

// GET /api/addresses → listado de direcciones del customer autenticado
export async function GET(req: NextRequest) {
  return proxyToBackend(req, '/ecommerce/me/addresses', { authenticated: true });
}

// POST /api/addresses → crea una direccion nueva
export async function POST(req: NextRequest) {
  const v = await validateBody(req, createAddressSchema);
  if (!v.ok) return v.response;

  return proxyToBackend(req, '/ecommerce/me/addresses', { authenticated: true, body: v.data });
}
