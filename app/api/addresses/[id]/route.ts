import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../lib/bff-proxy';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/addresses/:id → una direccion especifica (ownership check en backend)
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return proxyToBackend(req, `/ecommerce/me/addresses/${id}`, {
    authenticated: true,
  });
}

// PATCH /api/addresses/:id → actualiza campos
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return proxyToBackend(req, `/ecommerce/me/addresses/${id}`, {
    authenticated: true,
  });
}

// DELETE /api/addresses/:id → borra (204 No Content)
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return proxyToBackend(req, `/ecommerce/me/addresses/${id}`, {
    authenticated: true,
  });
}
