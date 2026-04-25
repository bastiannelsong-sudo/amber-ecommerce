import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../lib/bff-proxy';

export async function GET(req: NextRequest) {
  return proxyToBackend(req, '/collections/tree');
}
