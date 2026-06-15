/**
 * Session secret startup validation — SEC-002
 *
 * Called from instrumentation.ts register() so that a missing or weak
 * SESSION_SECRET causes the server to crash at boot time, not mid-request.
 *
 * Keeping the validation logic here (separate from session.ts) means:
 * - It can be unit-tested without mocking next/headers or server-only stubs.
 * - instrumentation.ts stays thin and purpose-clear.
 * - session.ts getSecret() keeps its own runtime guard as a second line of
 *   defense (defense in depth).
 */

const MIN_SECRET_LENGTH = 32;

/**
 * Validates that SESSION_SECRET is present and meets minimum length.
 * Throws if the check fails — callers should let the error propagate to
 * crash the process at startup.
 */
export function validateSessionSecret(): void {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `SESSION_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters long ` +
        '(set in .env.local or ECS task env). Server cannot start without it.',
    );
  }
}
