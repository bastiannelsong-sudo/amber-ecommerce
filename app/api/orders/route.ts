import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../lib/bff-proxy';

// POST /api/orders → crear orden (checkout)
export async function POST(req: NextRequest) {
  return proxyToBackend(req, '/ecommerce/orders');
}
