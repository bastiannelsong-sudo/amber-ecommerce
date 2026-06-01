/**
 * Tests unitarios para order-access.ts — sign / verify
 *
 * Verifican las propiedades criptográficas del capability token:
 *   - Token válido recién firmado → order_number correcto
 *   - Firma manipulada → null
 *   - Token expirado (exp pasado) → null (TTL server-side)
 *   - Token malformado → null
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// server-only y next/headers no están disponibles en Vitest/jsdom.
// Los mockeamos para poder importar y testear las funciones puras de HMAC.
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

describe('order-access — signOrderAccessToken / verifyOrderAccessToken', () => {
  beforeEach(() => {
    // Necesita SESSION_SECRET para firmar/verificar.
    process.env.SESSION_SECRET = 'test-secret-at-least-32-chars-long!!';
  });

  it('verifyOrderAccessToken returns order_number for a freshly signed token', async () => {
    const { signOrderAccessToken, verifyOrderAccessToken } = await import('./order-access');
    const token = signOrderAccessToken('ORD-UNIT-001');
    const result = verifyOrderAccessToken(token);
    expect(result).toBe('ORD-UNIT-001');
  });

  it('verifyOrderAccessToken returns null for a tampered signature', async () => {
    const { signOrderAccessToken, verifyOrderAccessToken } = await import('./order-access');
    const token = signOrderAccessToken('ORD-UNIT-002');
    // Tamper: replace last char to break HMAC.
    const tampered = token.slice(0, -1) + (token.slice(-1) === 'A' ? 'B' : 'A');
    const result = verifyOrderAccessToken(tampered);
    expect(result).toBeNull();
  });

  it('verifyOrderAccessToken returns null for an expired token', async () => {
    const { verifyOrderAccessToken } = await import('./order-access');
    // Construir un token expirado manualmente con la misma lógica interna.
    const { createHmac } = await import('node:crypto');
    const secret = process.env.SESSION_SECRET!;
    const pastExp = Math.floor(Date.now() / 1000) - 10; // 10s en el pasado → expirado
    const payload = Buffer.from(JSON.stringify({ order_number: 'ORD-X', exp: pastExp })).toString('base64url');
    const sig = createHmac('sha256', secret).update(payload).digest('base64url');
    const expiredToken = `${payload}.${sig}`;
    const result = verifyOrderAccessToken(expiredToken);
    expect(result).toBeNull();
  });

  it('verifyOrderAccessToken returns null for malformed token (extra dots)', async () => {
    const { verifyOrderAccessToken } = await import('./order-access');
    expect(verifyOrderAccessToken('not.a.valid.token.here')).toBeNull();
  });

  it('verifyOrderAccessToken returns null for empty string', async () => {
    const { verifyOrderAccessToken } = await import('./order-access');
    expect(verifyOrderAccessToken('')).toBeNull();
  });

  it('verifyOrderAccessToken returns null for single segment (no dot)', async () => {
    const { verifyOrderAccessToken } = await import('./order-access');
    expect(verifyOrderAccessToken('onlyone')).toBeNull();
  });

  it('different order_number in token does not validate for another order', async () => {
    // Prueba la condición 1: una cookie de la orden A no autoriza la orden B.
    // verifyOrderAccessToken devuelve el order_number del token;
    // el caller debe verificar que coincide con la ruta.
    const { signOrderAccessToken, verifyOrderAccessToken } = await import('./order-access');
    const tokenForA = signOrderAccessToken('ORD-A');
    const result = verifyOrderAccessToken(tokenForA);
    // El token es válido pero apunta a ORD-A.
    expect(result).toBe('ORD-A');
    // Si el caller compara contra ORD-B, el mismatch lo detecta el route.
    expect(result).not.toBe('ORD-B');
  });

  // ---------------------------------------------------------------------------
  // Finding #3 — edge cases adicionales
  // ---------------------------------------------------------------------------

  it('verifyOrderAccessToken returns null when exp field is absent', async () => {
    // Token bien formado y firmado pero sin campo exp → debe rechazarse.
    const { verifyOrderAccessToken } = await import('./order-access');
    const { createHmac } = await import('node:crypto');
    const secret = process.env.SESSION_SECRET!;
    // Payload sin exp (solo order_number).
    const payload = Buffer.from(JSON.stringify({ order_number: 'ORD-NO-EXP' })).toString('base64url');
    const sig = createHmac('sha256', secret).update(payload).digest('base64url');
    const tokenNoExp = `${payload}.${sig}`;
    expect(verifyOrderAccessToken(tokenNoExp)).toBeNull();
  });

  it('safeEqual: signature with different buffer length returns false without throwing', async () => {
    // safeEqual tiene un guard de longitud antes de timingSafeEqual.
    // Probamos indirectamente: firma correcta recortada (longitud distinta) → null.
    const { signOrderAccessToken, verifyOrderAccessToken } = await import('./order-access');
    const token = signOrderAccessToken('ORD-LEN');
    const [payload, sig] = token.split('.');
    // Recortamos la firma a la mitad → longitud diferente a la esperada.
    const shortSig = sig.slice(0, Math.floor(sig.length / 2));
    // No debe lanzar excepción, debe devolver null.
    expect(() => verifyOrderAccessToken(`${payload}.${shortSig}`)).not.toThrow();
    expect(verifyOrderAccessToken(`${payload}.${shortSig}`)).toBeNull();
  });

  it('verifyOrderAccessToken fails closed when SESSION_SECRET is absent', async () => {
    // Sin SESSION_SECRET el sign/verify debe fallar cerrado (null), nunca fail-open.
    const { verifyOrderAccessToken, signOrderAccessToken } = await import('./order-access');

    // Firmamos con el secret presente para tener un token válido de referencia.
    const validToken = signOrderAccessToken('ORD-NOSECRET');
    expect(verifyOrderAccessToken(validToken)).toBe('ORD-NOSECRET'); // baseline

    // Ahora quitamos el secret y verificamos que falla cerrado.
    const original = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    try {
      // verify debe retornar null (fail-closed), nunca lanzar ni devolver el order_number.
      const result = verifyOrderAccessToken(validToken);
      expect(result).toBeNull();
    } finally {
      // Restaurar para no contaminar otros tests.
      process.env.SESSION_SECRET = original;
    }
  });

  it('signOrderAccessToken throws when SESSION_SECRET is absent', async () => {
    // sign también debe fallar cerrado (lanzar), nunca emitir un token sin secret.
    const { signOrderAccessToken } = await import('./order-access');
    const original = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    try {
      expect(() => signOrderAccessToken('ORD-NOSECRET')).toThrow();
    } finally {
      process.env.SESSION_SECRET = original;
    }
  });
});
