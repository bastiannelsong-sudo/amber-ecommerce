import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../lib/bff-proxy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await params;
  return proxyToBackend(req, `/ecommerce/orders/${orderNumber}`);
}
