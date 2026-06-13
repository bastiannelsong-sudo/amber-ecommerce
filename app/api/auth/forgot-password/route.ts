import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../lib/bff-proxy';
import { validateBody } from '../../../lib/validation';
import { forgotPasswordSchema } from '../../../lib/auth/schemas';
import { enforceRateLimit } from '../../../lib/rate-limit/enforce';

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, 'forgot');
  if (limited) return limited;

  const v = await validateBody(req, forgotPasswordSchema);
  if (!v.ok) return v.response;

  return proxyToBackend(req, '/ecommerce-auth/forgot-password', { body: v.data });
}
