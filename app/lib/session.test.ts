/**
 * Tests for session.ts security fixes
 *
 * Fix #11: SESSION_SECRET startup validation — validateSessionSecret throws when missing/weak
 * Fix #3:  Zod shape validation — getSession returns null for malformed payloads
 * Fix #8:  expires_at validation — getSession returns null for expired sessions
 * Fix M-7: setSession always uses secure:true (browsers exempt localhost)
 */

import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';

// ─── Mock next/headers ────────────────────────────────────────────────────────
// vi.mock is hoisted to the top by vitest, so we must use vi.hoisted() to
// initialize variables referenced inside the factory before the hoist happens.
const { mockCookiesGet, mockCookiesSet } = vi.hoisted(() => ({
  mockCookiesGet: vi.fn(),
  mockCookiesSet: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: mockCookiesGet, set: mockCookiesSet }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build a signed cookie using the real HMAC logic so tests exercise
// the actual decode path (integration-quality).
// ─────────────────────────────────────────────────────────────────────────────
import { createHmac } from 'node:crypto';

const TEST_SECRET = 'test-secret-must-be-at-least-32-chars!!';

function buildCookie(session: Record<string, unknown>): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const sig = createHmac('sha256', TEST_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

// Stub SESSION_SECRET before importing session.ts so getSecret() uses our value.
vi.stubEnv('SESSION_SECRET', TEST_SECRET);

import { getSession, setSession } from './session';

// ─────────────────────────────────────────────────────────────────────────────
// Fix #11: SESSION_SECRET startup validation
// ─────────────────────────────────────────────────────────────────────────────

describe('validateSessionSecret — startup validation (Fix #11)', () => {
  let validateSessionSecret: () => void;

  beforeAll(async () => {
    const mod = await import('./session-startup');
    validateSessionSecret = mod.validateSessionSecret;
  });

  it('throws when SESSION_SECRET is not set', () => {
    const original = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    try {
      expect(() => validateSessionSecret()).toThrow();
    } finally {
      if (original !== undefined) process.env.SESSION_SECRET = original;
    }
  });

  it('throws when SESSION_SECRET is an empty string', () => {
    const original = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = '';
    try {
      expect(() => validateSessionSecret()).toThrow();
    } finally {
      if (original !== undefined) process.env.SESSION_SECRET = original;
      else delete process.env.SESSION_SECRET;
    }
  });

  it('throws when SESSION_SECRET is shorter than 32 characters', () => {
    const original = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = 'short';
    try {
      expect(() => validateSessionSecret()).toThrow();
    } finally {
      if (original !== undefined) process.env.SESSION_SECRET = original;
      else delete process.env.SESSION_SECRET;
    }
  });

  it('does not throw when SESSION_SECRET is at least 32 characters (triangulation)', () => {
    const original = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = 'valid-secret-that-is-32-chars-long!!';
    try {
      expect(() => validateSessionSecret()).not.toThrow();
    } finally {
      if (original !== undefined) process.env.SESSION_SECRET = original;
      else delete process.env.SESSION_SECRET;
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Fix #3: Zod shape validation on decoded session payload
// ─────────────────────────────────────────────────────────────────────────────

describe('getSession — Zod shape validation (Fix #3)', () => {
  afterEach(() => {
    mockCookiesGet.mockReset();
  });

  it('returns null when decoded payload is missing required fields', async () => {
    // Signed correctly but missing last_name, access_token, refresh_token, expires_at
    const incomplete = {
      user_id: 1,
      email: 'user@example.com',
      first_name: 'Alice',
    };
    mockCookiesGet.mockReturnValue({ value: buildCookie(incomplete) });

    const result = await getSession();
    expect(result).toBeNull();
  });

  it('returns null when user_id is a string instead of a number', async () => {
    const wrongType = {
      user_id: 'not-a-number',
      email: 'user@example.com',
      first_name: 'Alice',
      last_name: 'Smith',
      access_token: 'tok',
      refresh_token: 'ref',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };
    mockCookiesGet.mockReturnValue({ value: buildCookie(wrongType) });

    const result = await getSession();
    expect(result).toBeNull();
  });

  it('returns null when email is missing (triangulation)', async () => {
    const noEmail = {
      user_id: 1,
      first_name: 'Alice',
      last_name: 'Smith',
      access_token: 'tok',
      refresh_token: 'ref',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };
    mockCookiesGet.mockReturnValue({ value: buildCookie(noEmail) });

    const result = await getSession();
    expect(result).toBeNull();
  });

  it('returns null when expires_at is a string instead of a number', async () => {
    const wrongExpiresType = {
      user_id: 1,
      email: 'user@example.com',
      first_name: 'Alice',
      last_name: 'Smith',
      access_token: 'tok',
      refresh_token: 'ref',
      expires_at: 'not-a-timestamp',
    };
    mockCookiesGet.mockReturnValue({ value: buildCookie(wrongExpiresType) });

    const result = await getSession();
    expect(result).toBeNull();
  });

  it('returns the typed session when payload has all required fields with correct types', async () => {
    const validSession = {
      user_id: 42,
      email: 'test@example.com',
      first_name: 'Bob',
      last_name: 'Jones',
      access_token: 'access-token-value',
      refresh_token: 'refresh-token-value',
      expires_at: Math.floor(Date.now() / 1000) + 7200,
    };
    mockCookiesGet.mockReturnValue({ value: buildCookie(validSession) });

    const result = await getSession();
    expect(result).not.toBeNull();
    expect(result?.user_id).toBe(42);
    expect(result?.email).toBe('test@example.com');
    expect(result?.first_name).toBe('Bob');
    expect(result?.last_name).toBe('Jones');
    expect(result?.access_token).toBe('access-token-value');
    expect(result?.refresh_token).toBe('refresh-token-value');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Fix #8: expires_at validation — reject expired sessions
// ─────────────────────────────────────────────────────────────────────────────

describe('getSession — expires_at validation (Fix #8)', () => {
  const baseSession = {
    user_id: 1,
    email: 'user@example.com',
    first_name: 'Alice',
    last_name: 'Smith',
    access_token: 'access-tok',
    refresh_token: 'refresh-tok',
    expires_at: 0, // overridden per test
  };

  afterEach(() => {
    mockCookiesGet.mockReset();
  });

  it('returns null when expires_at is 1 second in the past', async () => {
    const expired = { ...baseSession, expires_at: Math.floor(Date.now() / 1000) - 1 };
    mockCookiesGet.mockReturnValue({ value: buildCookie(expired) });

    const result = await getSession();
    expect(result).toBeNull();
  });

  it('returns null when expires_at is 24 hours in the past (triangulation)', async () => {
    const longExpired = { ...baseSession, expires_at: Math.floor(Date.now() / 1000) - 86400 };
    mockCookiesGet.mockReturnValue({ value: buildCookie(longExpired) });

    const result = await getSession();
    expect(result).toBeNull();
  });

  it('returns the session when expires_at is 1 hour in the future', async () => {
    const valid = { ...baseSession, expires_at: Math.floor(Date.now() / 1000) + 3600 };
    mockCookiesGet.mockReturnValue({ value: buildCookie(valid) });

    const result = await getSession();
    expect(result).not.toBeNull();
    expect(result?.user_id).toBe(1);
    expect(result?.email).toBe('user@example.com');
  });

  it('returns null when no cookie is present', async () => {
    mockCookiesGet.mockReturnValue(undefined);

    const result = await getSession();
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Fix M-7: setSession always uses secure:true
// Browsers exempt localhost from the Secure attribute, so dev still works over
// http://localhost. Removing the NODE_ENV gate is the safe default.
// ─────────────────────────────────────────────────────────────────────────────

describe('setSession — cookie security options (Fix M-7)', () => {
  const validSession = {
    user_id: 1,
    email: 'user@example.com',
    first_name: 'Alice',
    last_name: 'Smith',
    access_token: 'access-tok',
    refresh_token: 'refresh-tok',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };

  afterEach(() => {
    mockCookiesSet.mockReset();
  });

  it('sets secure:true in production', async () => {
    const original = process.env.NODE_ENV;
    // @ts-expect-error — reassigning read-only env for test purposes
    process.env.NODE_ENV = 'production';
    try {
      await setSession(validSession);
      const [, , options] = mockCookiesSet.mock.calls[0];
      expect(options.secure).toBe(true);
    } finally {
      // @ts-expect-error — restoring
      process.env.NODE_ENV = original;
    }
  });

  it('sets secure:true in development (browsers exempt localhost)', async () => {
    const original = process.env.NODE_ENV;
    // @ts-expect-error — reassigning read-only env for test purposes
    process.env.NODE_ENV = 'development';
    try {
      await setSession(validSession);
      const [, , options] = mockCookiesSet.mock.calls[0];
      expect(options.secure).toBe(true);
    } finally {
      // @ts-expect-error — restoring
      process.env.NODE_ENV = original;
    }
  });

  it('sets httpOnly:true and sameSite:lax regardless of environment', async () => {
    await setSession(validSession);
    const [, , options] = mockCookiesSet.mock.calls[0];
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe('lax');
  });
});
