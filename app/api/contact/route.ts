import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../lib/bff-proxy';
import { validateBody } from '../../lib/validation';
import { createContactMessageSchema } from '../../lib/contact/schemas';

export async function POST(req: NextRequest) {
  const v = await validateBody(req, createContactMessageSchema);
  if (!v.ok) return v.response;

  return proxyToBackend(req, '/contact', { body: v.data });
}
