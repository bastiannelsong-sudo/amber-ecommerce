import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../lib/bff-proxy';

export async function POST(req: NextRequest) {
  return proxyToBackend(req, '/ecommerce-auth/forgot-password');
}
