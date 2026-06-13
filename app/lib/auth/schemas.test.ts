/**
 * Tests for auth zod schemas — BFF-SEC-01, BFF-SEC-T1, BFF-SEC-T3
 *
 * Pure unit tests: no mocks needed, schemas are framework-agnostic.
 * Covers: valid shapes, missing required fields, wrong types, unknown field stripping.
 */

import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  createPasswordSchema,
  googleAuthSchema,
  linkGoogleSchema,
  updateProfileSchema,
} from './schemas';

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------
describe('loginSchema', () => {
  it('accepts valid login body', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('rejects non-email value for email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('rejects missing email', () => {
    const result = loginSchema.safeParse({ password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('rejects missing password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com' });
    expect(result.success).toBe(false);
  });

  it('rejects numeric email (wrong type)', () => {
    const result = loginSchema.safeParse({ email: 12345, password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('strips unknown fields (e.g. __proto__)', () => {
    const result = loginSchema.safeParse({
      email: 'a@b.com',
      password: 'secret',
      __proto__: 'evil',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Object.keys(result.data)).not.toContain('__proto__');
    }
  });
});

// ---------------------------------------------------------------------------
// registerSchema
// ---------------------------------------------------------------------------
describe('registerSchema', () => {
  it('accepts valid register body with all fields', () => {
    const result = registerSchema.safeParse({
      first_name: 'Ana',
      last_name: 'García',
      email: 'ana@example.com',
      password: '123456',
      phone: '+56912345678',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid body without optional phone', () => {
    const result = registerSchema.safeParse({
      first_name: 'Ana',
      last_name: 'García',
      email: 'ana@example.com',
      password: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing first_name', () => {
    const result = registerSchema.safeParse({
      last_name: 'García',
      email: 'ana@example.com',
      password: '123456',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing last_name', () => {
    const result = registerSchema.safeParse({
      first_name: 'Ana',
      email: 'ana@example.com',
      password: '123456',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing email', () => {
    const result = registerSchema.safeParse({
      first_name: 'Ana',
      last_name: 'García',
      password: '123456',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = registerSchema.safeParse({
      first_name: 'Ana',
      last_name: 'García',
      email: 'not-email',
      password: '123456',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 6 chars (min(6) parity)', () => {
    const result = registerSchema.safeParse({
      first_name: 'Ana',
      last_name: 'García',
      email: 'ana@example.com',
      password: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('accepts 6-char password (min parity boundary)', () => {
    const result = registerSchema.safeParse({
      first_name: 'Ana',
      last_name: 'García',
      email: 'ana@example.com',
      password: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('strips unknown fields', () => {
    const result = registerSchema.safeParse({
      first_name: 'Ana',
      last_name: 'García',
      email: 'ana@example.com',
      password: '123456',
      unknown_field: 'drop-me',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Object.keys(result.data)).not.toContain('unknown_field');
    }
  });
});

// ---------------------------------------------------------------------------
// forgotPasswordSchema
// ---------------------------------------------------------------------------
describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'a@b.com' });
    expect(result.success).toBe(true);
  });

  it('rejects missing email', () => {
    const result = forgotPasswordSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'not-email' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// resetPasswordSchema
// ---------------------------------------------------------------------------
describe('resetPasswordSchema', () => {
  it('accepts valid { token, new_password }', () => {
    const result = resetPasswordSchema.safeParse({ token: 'tok123', new_password: 'abc123' });
    expect(result.success).toBe(true);
  });

  it('rejects missing token', () => {
    const result = resetPasswordSchema.safeParse({ new_password: 'abc123' });
    expect(result.success).toBe(false);
  });

  it('rejects missing new_password', () => {
    const result = resetPasswordSchema.safeParse({ token: 'tok123' });
    expect(result.success).toBe(false);
  });

  it('rejects wrong field name "password" instead of "new_password"', () => {
    const result = resetPasswordSchema.safeParse({ token: 'tok123', password: 'abc123' });
    expect(result.success).toBe(false);
  });

  it('rejects new_password shorter than 6 chars', () => {
    const result = resetPasswordSchema.safeParse({ token: 'tok123', new_password: 'abc12' });
    expect(result.success).toBe(false);
  });

  it('accepts new_password with exactly 6 chars', () => {
    const result = resetPasswordSchema.safeParse({ token: 'tok123', new_password: 'abc123' });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// changePasswordSchema
// ---------------------------------------------------------------------------
describe('changePasswordSchema', () => {
  it('accepts valid { current_password, new_password }', () => {
    const result = changePasswordSchema.safeParse({
      current_password: 'oldpass',
      new_password: 'newpass',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing current_password', () => {
    const result = changePasswordSchema.safeParse({ new_password: 'newpass' });
    expect(result.success).toBe(false);
  });

  it('rejects missing new_password', () => {
    const result = changePasswordSchema.safeParse({ current_password: 'oldpass' });
    expect(result.success).toBe(false);
  });

  it('rejects new_password shorter than 6 chars', () => {
    const result = changePasswordSchema.safeParse({
      current_password: 'oldpass',
      new_password: 'abc12',
    });
    expect(result.success).toBe(false);
  });

  it('accepts new_password with exactly 6 chars', () => {
    const result = changePasswordSchema.safeParse({
      current_password: 'oldpass',
      new_password: 'abc123',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createPasswordSchema
// ---------------------------------------------------------------------------
describe('createPasswordSchema', () => {
  it('accepts valid { password }', () => {
    const result = createPasswordSchema.safeParse({ password: 'abc123' });
    expect(result.success).toBe(true);
  });

  it('rejects missing password', () => {
    const result = createPasswordSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 6 chars', () => {
    const result = createPasswordSchema.safeParse({ password: 'abc12' });
    expect(result.success).toBe(false);
  });

  it('accepts password with exactly 6 chars', () => {
    const result = createPasswordSchema.safeParse({ password: 'abc123' });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// googleAuthSchema
// ---------------------------------------------------------------------------
describe('googleAuthSchema', () => {
  it('accepts { credential: string }', () => {
    const result = googleAuthSchema.safeParse({ credential: 'google-jwt-token' });
    expect(result.success).toBe(true);
  });

  it('rejects missing credential', () => {
    const result = googleAuthSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects empty string credential', () => {
    const result = googleAuthSchema.safeParse({ credential: '' });
    expect(result.success).toBe(false);
  });

  it('rejects id_token field (wrong name — production bug)', () => {
    const result = googleAuthSchema.safeParse({ id_token: 'google-jwt-token' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// linkGoogleSchema
// ---------------------------------------------------------------------------
describe('linkGoogleSchema', () => {
  it('accepts { credential: string }', () => {
    const result = linkGoogleSchema.safeParse({ credential: 'google-jwt-token' });
    expect(result.success).toBe(true);
  });

  it('rejects missing credential', () => {
    const result = linkGoogleSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects id_token field (wrong name)', () => {
    const result = linkGoogleSchema.safeParse({ id_token: 'google-jwt-token' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateProfileSchema
// ---------------------------------------------------------------------------
describe('updateProfileSchema', () => {
  it('accepts empty body {} (all fields optional — BFF-SEC-05)', () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only first_name', () => {
    const result = updateProfileSchema.safeParse({ first_name: 'Marco' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ first_name: 'Marco' });
    }
  });

  it('accepts full profile update', () => {
    const result = updateProfileSchema.safeParse({
      first_name: 'Marco',
      last_name: 'Polo',
      email: 'marco@example.com',
      phone: '+56912345678',
      avatar_url: 'https://example.com/avatar.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email when provided', () => {
    const result = updateProfileSchema.safeParse({ email: 'not-email' });
    expect(result.success).toBe(false);
  });

  it('strips unknown fields', () => {
    const result = updateProfileSchema.safeParse({ first_name: 'Marco', unknown: 'drop' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Object.keys(result.data)).not.toContain('unknown');
    }
  });
});
