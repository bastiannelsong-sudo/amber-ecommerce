import 'server-only';
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

const COOKIE_NAME = 'amber_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export interface AmberSession {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp (seconds)
}

/** Runtime schema for AmberSession — mirrors the interface field-for-field. */
const amberSessionSchema = z.object({
  user_id: z.number(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number(),
});

const getSecret = (): string => {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'SESSION_SECRET debe existir y tener al menos 32 caracteres (definir en .env.local / ECS task env)',
    );
  }
  return secret;
};

const sign = (payload: string): string => {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
};

const safeEqual = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
};

const encode = (session: AmberSession): string => {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = sign(payload);
  return `${payload}.${signature}`;
};

const decode = (cookieValue: string): AmberSession | null => {
  const parts = cookieValue.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expected = sign(payload);
  if (!safeEqual(signature, expected)) return null;
  try {
    const json = Buffer.from(payload, 'base64url').toString('utf-8');
    const result = amberSessionSchema.safeParse(JSON.parse(json));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
};

export const getSession = async (): Promise<AmberSession | null> => {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const session = decode(raw);
  if (!session) return null;
  // Reject sessions whose expiry has passed. expires_at is Unix seconds (set
  // by tryRefreshAccessToken as Math.floor(Date.now() / 1000) + expires_in).
  if (session.expires_at < Math.floor(Date.now() / 1000)) return null;
  return session;
};

export const setSession = async (session: AmberSession): Promise<void> => {
  const store = await cookies();
  store.set(COOKIE_NAME, encode(session), {
    httpOnly: true,
    secure: true, // Browsers exempt localhost from Secure; always-secure is safe for dev
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
};

export const clearSession = async (): Promise<void> => {
  const store = await cookies();
  store.delete(COOKIE_NAME);
};

export const getAccessToken = async (): Promise<string | null> => {
  const session = await getSession();
  return session?.access_token ?? null;
};
