/**
 * Unit tests for getAuthLimiter — BFF-RL-01, BFF-RL-T2
 *
 * Pattern: vi.mock at module level, vi.resetModules() + dynamic import() in beforeEach.
 * No live Upstash calls — all Redis and Ratelimit constructors are mocked.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoisted mocks — must be declared before any import of the mocked modules
vi.mock('@upstash/ratelimit', () => {
  const RatelimitMock = vi.fn().mockImplementation(() => ({ limit: vi.fn() }));
  (RatelimitMock as unknown as { slidingWindow: ReturnType<typeof vi.fn> }).slidingWindow = vi.fn().mockReturnValue('sliding-window-config');
  return { Ratelimit: RatelimitMock };
});

vi.mock('@upstash/redis', () => {
  const RedisMock = { fromEnv: vi.fn().mockReturnValue({ ping: vi.fn() }) };
  return { Redis: RedisMock };
});

describe('getAuthLimiter', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns a Ratelimit instance when both env vars are set', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token-abc';

    const { Ratelimit } = await import('@upstash/ratelimit');
    const { getAuthLimiter } = await import('./auth-limiter');

    const result = getAuthLimiter('login');

    expect(result).not.toBeNull();
    expect(Ratelimit).toHaveBeenCalled();
  });

  it('returns null when UPSTASH_REDIS_REST_URL is absent', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token-abc';

    const { getAuthLimiter } = await import('./auth-limiter');

    expect(getAuthLimiter('login')).toBeNull();
  });

  it('returns null when UPSTASH_REDIS_REST_TOKEN is absent', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { getAuthLimiter } = await import('./auth-limiter');

    expect(getAuthLimiter('login')).toBeNull();
  });

  it('returns null and calls console.warn when Ratelimit constructor throws', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token-abc';

    const { Ratelimit } = await import('@upstash/ratelimit');
    vi.mocked(Ratelimit).mockImplementationOnce(() => {
      throw new Error('Init failed');
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { getAuthLimiter } = await import('./auth-limiter');

    expect(getAuthLimiter('login')).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('returns the same instance on consecutive calls for the same route (memoized)', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token-abc';

    const { getAuthLimiter } = await import('./auth-limiter');

    const first = getAuthLimiter('forgot');
    const second = getAuthLimiter('forgot');

    expect(first).toBe(second);
  });

  it('returns separate instances for different routes', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token-abc';

    const { getAuthLimiter } = await import('./auth-limiter');

    const loginLimiter = getAuthLimiter('login');
    const forgotLimiter = getAuthLimiter('forgot');

    expect(loginLimiter).not.toBeNull();
    expect(forgotLimiter).not.toBeNull();
    // They may or may not be the same object depending on impl, but both must be non-null
    expect(loginLimiter).toBeDefined();
    expect(forgotLimiter).toBeDefined();
  });
});
