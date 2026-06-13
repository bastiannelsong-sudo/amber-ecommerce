import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Auth routes supported by the rate limiter.
 * BFF-RL-01, ADR-1
 */
export type AuthRoute = 'login' | 'forgot' | 'reset';

const LIMITS: Record<AuthRoute, number> = {
  login: 5,
  forgot: 3,
  reset: 5,
};

// Memoized per-route instances
const cache: Partial<Record<AuthRoute, Ratelimit>> = {};

// Once any init fails, we fail-open for all routes without retrying
let failed = false;

/**
 * Returns a memoized Ratelimit instance for the given auth route.
 * Returns null (fail-open) when:
 *   - Either Upstash env var is absent
 *   - Redis.fromEnv() or Ratelimit constructor throws
 *
 * BFF-RL-01, BFF-RL-07, BFF-RL-09, ADR-1
 */
export const getAuthLimiter = (route: AuthRoute): Ratelimit | null => {
  if (failed) return null;

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  if (cache[route]) return cache[route]!;

  try {
    const redis = Redis.fromEnv();
    cache[route] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(LIMITS[route], '60 s'),
      analytics: false,
      prefix: `rl:auth:${route}`,
    });
    return cache[route]!;
  } catch (err) {
    console.warn('[rate-limit] Failed to initialize Ratelimit — rate limiting disabled', err);
    failed = true;
    return null;
  }
};
