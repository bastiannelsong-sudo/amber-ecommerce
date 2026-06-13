import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../lib/bff-proxy';
import { validateBody } from '../../../lib/validation';
import { changePasswordSchema } from '../../../lib/auth/schemas';

export async function POST(req: NextRequest) {
  const v = await validateBody(req, changePasswordSchema);
  if (!v.ok) return v.response;

  return proxyToBackend(req, '/ecommerce-auth/change-password', {
    authenticated: true,
    body: v.data,
  });
}
