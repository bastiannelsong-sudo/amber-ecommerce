import { NextResponse, type NextRequest } from 'next/server';
import { getAuthLimiter, type AuthRoute } from './auth-limiter';
import { getClientIp } from './get-client-ip';

/**
 * Rate-limit gate for BFF auth routes.
 * Returns a 429 NextResponse when the IP is over the limit,
 * or null to let the handler proceed (fail-open on any error or unconfigured state).
 *
 * MUST be called before validateBody — does NOT read req.body.
 * BFF-RL-02, BFF-RL-05..09, ADR-2, ADR-3
 */
export const enforceRateLimit = async (
  req: NextRequest,
  route: AuthRoute,
): Promise<NextResponse | null> => {
  const limiter = getAuthLimiter(route);
  if (!limiter) return null;

  const ip = getClientIp(req);
  const key = `${route}:${ip}`;

  try {
    const { success, reset } = await limiter.limit(key);

    if (!success) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Demasiados intentos. Intentá de nuevo más tarde.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) },
        },
      );
    }

    return null;
  } catch (err) {
    console.warn('[rate-limit] enforceRateLimit threw — proceeding fail-open', err);
    return null;
  }
};
