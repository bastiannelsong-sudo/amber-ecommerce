import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../../lib/bff-proxy';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/addresses/:id/default → marca como default, desmarca las otras
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return proxyToBackend(req, `/ecommerce/me/addresses/${id}/default`, {
    authenticated: true,
  });
}
