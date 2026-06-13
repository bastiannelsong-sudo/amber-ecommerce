import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../lib/bff-proxy';
import { validateBody } from '../../../lib/validation';
import { updateProfileSchema } from '../../../lib/auth/schemas';

export async function GET(req: NextRequest) {
  return proxyToBackend(req, '/ecommerce-auth/profile', { authenticated: true });
}

export async function PUT(req: NextRequest) {
  const v = await validateBody(req, updateProfileSchema);
  if (!v.ok) return v.response;

  return proxyToBackend(req, '/ecommerce-auth/profile', {
    authenticated: true,
    body: v.data,
  });
}
