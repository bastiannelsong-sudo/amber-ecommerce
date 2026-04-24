import 'server-only';
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'amber_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export interface AmberSession {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp
}

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
    return JSON.parse(json) as AmberSession;
  } catch {
    return null;
  }
};

export const getSession = async (): Promise<AmberSession | null> => {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return decode(raw);
};

export const setSession = async (session: AmberSession): Promise<void> => {
  const store = await cookies();
  store.set(COOKIE_NAME, encode(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
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
