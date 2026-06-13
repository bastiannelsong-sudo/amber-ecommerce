import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../lib/bff-proxy';
import { validateBody } from '../../../lib/validation';
import { linkGoogleSchema } from '../../../lib/auth/schemas';

export async function POST(req: NextRequest) {
  const v = await validateBody(req, linkGoogleSchema);
  if (!v.ok) return v.response;

  return proxyToBackend(req, '/ecommerce-auth/link-google', {
    authenticated: true,
    body: v.data,
  });
}
