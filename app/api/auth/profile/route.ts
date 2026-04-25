import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../lib/bff-proxy';

export async function GET(req: NextRequest) {
  return proxyToBackend(req, '/ecommerce-auth/profile', { authenticated: true });
}

export async function PUT(req: NextRequest) {
  return proxyToBackend(req, '/ecommerce-auth/profile', { authenticated: true });
}
