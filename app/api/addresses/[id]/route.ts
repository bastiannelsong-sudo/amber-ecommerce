import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../lib/bff-proxy';
import { validateBody } from '../../../lib/validation';
import { updateAddressSchema } from '../../../lib/addresses/schemas';

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

  const v = await validateBody(req, updateAddressSchema);
  if (!v.ok) return v.response;

  return proxyToBackend(req, `/ecommerce/me/addresses/${id}`, {
    authenticated: true,
    body: v.data,
  });
}

// DELETE /api/addresses/:id → borra (204 No Content)
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return proxyToBackend(req, `/ecommerce/me/addresses/${id}`, {
    authenticated: true,
  });
}
