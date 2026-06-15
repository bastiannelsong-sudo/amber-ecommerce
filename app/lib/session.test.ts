/**
 * Tests for session.ts security fixes
 *
 * Fix #11: SESSION_SECRET startup validation — validateSessionSecret throws when missing/weak
 * Fix #3:  Zod shape validation — getSession returns null for malformed payloads
 * Fix #8:  expires_at validation — getSession returns null for expired sessions
 */

import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';

// ─── Mock next/headers ────────────────────────────────────────────────────────
// vi.mock is hoisted to the top by vitest, so we must use vi.hoisted() to
// initialize variables referenced inside the factory before the hoist happens.
const { mockCookiesGet } = vi.hoisted(() => ({
  mockCookiesGet: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: mockCookiesGet }),
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

import { getSession } from './session';

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
