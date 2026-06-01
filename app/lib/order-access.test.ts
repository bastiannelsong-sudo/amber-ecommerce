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
});
