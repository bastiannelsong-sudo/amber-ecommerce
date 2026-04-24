import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../lib/bff-proxy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return proxyToBackend(req, `/collections/${slug}`);
}
