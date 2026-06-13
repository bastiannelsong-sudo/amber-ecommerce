/**
 * Unit tests for enforceRateLimit — BFF-RL-03, BFF-RL-05..08, BFF-RL-T1
 *
 * Pattern: vi.mock at module level, vi.resetModules() + dynamic import() in beforeEach.
 * No live Upstash calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Hoisted mock — getAuthLimiter is the seam
vi.mock('./auth-limiter', () => ({
  getAuthLimiter: vi.fn(),
}));

describe('enforceRateLimit', () => {
  let getAuthLimiter: ReturnType<typeof vi.fn>;
  let enforceRateLimit: (req: NextRequest, route: 'login' | 'forgot' | 'reset') => Promise<Response | null>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const limiterMod = await import('./auth-limiter');
    const enforceMod = await import('./enforce');

    getAuthLimiter = vi.mocked(limiterMod.getAuthLimiter);
    enforceRateLimit = enforceMod.enforceRateLimit;
  });

  const makeRequest = (headers: Record<string, string> = {}) =>
    new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: 'secret' }),
      headers: { 'Content-Type': 'application/json', ...headers },
    });

  // BFF-RL-07: null limiter (not configured) → return null (fail-open)
  it('returns null when limiter is null (not configured)', async () => {
    getAuthLimiter.mockReturnValue(null);

    const result = await enforceRateLimit(makeRequest(), 'login');

    expect(result).toBeNull();
  });

  // BFF-RL-05: success: true → return null (proceed)
  it('returns null when limiter returns success: true', async () => {
    const mockLimiter = {
      limit: vi.fn().mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: Date.now() + 60000 }),
    };
    getAuthLimiter.mockReturnValue(mockLimiter);

    const result = await enforceRateLimit(makeRequest({ 'x-forwarded-for': '1.2.3.4' }), 'login');

    expect(result).toBeNull();
    expect(mockLimiter.limit).toHaveBeenCalledWith('login:1.2.3.4');
  });

  // BFF-RL-06: success: false → return 429 with Retry-After
  it('returns 429 NextResponse when limiter returns success: false', async () => {
    const resetMs = Date.now() + 45000;
    const mockLimiter = {
      limit: vi.fn().mockResolvedValue({ success: false, limit: 5, remaining: 0, reset: resetMs }),
    };
    getAuthLimiter.mockReturnValue(mockLimiter);

    const result = await enforceRateLimit(makeRequest({ 'x-forwarded-for': '10.0.0.1' }), 'forgot');

    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);

    const body = await result!.json() as Record<string, unknown>;
    expect(body.error).toBe('rate_limited');
    expect(typeof body.message).toBe('string');

    const retryAfter = result!.headers.get('Retry-After');
    expect(retryAfter).not.toBeNull();
    const parsed = Number(retryAfter);
    expect(Number.isInteger(parsed)).toBe(true);
    expect(parsed).toBeGreaterThan(0);
  });

  // BFF-RL-06: key format uses route prefix correctly
  it('builds key as "${route}:${ip}" with correct prefix', async () => {
    const mockLimiter = {
      limit: vi.fn().mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: Date.now() + 60000 }),
    };
    getAuthLimiter.mockReturnValue(mockLimiter);

    await enforceRateLimit(makeRequest({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' }), 'reset');

    expect(mockLimiter.limit).toHaveBeenCalledWith('reset:203.0.113.5');
  });

  // BFF-RL-03: fallback IP when x-forwarded-for header is absent
  it('uses 127.0.0.1 as key IP when x-forwarded-for header is absent', async () => {
    const mockLimiter = {
      limit: vi.fn().mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: Date.now() + 60000 }),
    };
    getAuthLimiter.mockReturnValue(mockLimiter);

    await enforceRateLimit(makeRequest(), 'login');

    expect(mockLimiter.limit).toHaveBeenCalledWith('login:127.0.0.1');
  });

  // BFF-RL-08: limiter.limit() throws → console.warn + return null (fail-open)
  it('returns null and calls console.warn when limiter.limit() throws', async () => {
    const mockLimiter = {
      limit: vi.fn().mockRejectedValue(new Error('Redis timeout')),
    };
    getAuthLimiter.mockReturnValue(mockLimiter);

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await enforceRateLimit(makeRequest(), 'login');

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
  });
});
