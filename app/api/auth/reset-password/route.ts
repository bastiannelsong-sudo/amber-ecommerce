import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../lib/bff-proxy';
import { validateBody } from '../../../lib/validation';
import { resetPasswordSchema } from '../../../lib/auth/schemas';

export async function POST(req: NextRequest) {
  const v = await validateBody(req, resetPasswordSchema);
  if (!v.ok) return v.response;

  return proxyToBackend(req, '/ecommerce-auth/reset-password', { body: v.data });
}
