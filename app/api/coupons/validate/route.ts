import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../lib/bff-proxy';
import { validateBody } from '../../../lib/validation';
import { validateCouponSchema } from '../../../lib/ecommerce/schemas';

export async function POST(req: NextRequest) {
  const v = await validateBody(req, validateCouponSchema);
  if (!v.ok) return v.response;

  return proxyToBackend(req, '/ecommerce/coupons/validate', { body: v.data });
}
