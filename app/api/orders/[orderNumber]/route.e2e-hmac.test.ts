/**
 * End-to-end security test: cross-order binding SIN mock de verifyOrderAccessCookie.
 *
 * Finding #1: el test de cross-order en route.test.ts MOCKEA verifyOrderAccessCookie,
 * por lo que daría verde aunque el binding `!==` se rompiera. Este archivo ejerce la
 * lógica REAL del HMAC end-to-end:
 *
 *   - Firma una cookie de acceso válida para ORD-B usando signOrderAccessToken real.
 *   - Inyecta ese token en el store de cookies bajo el nombre de la cookie de ORD-A
 *     (simulando a un atacante que copia el token de ORD-B al slot de ORD-A).
 *   - Hace un request a ORD-A → debe dar 403 (la verificación criptográfica rechaza
 *     el token porque order_number del payload != order_number de la ruta).
 *
 * NO se mockea order-access: verifyOrderAccessCookie y verifyOrderAccessToken
 * corren con su lógica HMAC-SHA256 real.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createHmac } from 'node:crypto';

// Mocks hoisted — solo lo que NO es la pieza bajo test.
vi.mock('../../../lib/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('../../../lib/bff-proxy', () => ({
  backendFetch: vi.fn(),
  proxyToBackend: vi.fn(),
}));

// NO se mockea '../../../lib/order-access' → lógica HMAC real.

// SECRET fijo para este test suite.
const TEST_SECRET = 'e2e-hmac-test-secret-32chars-ok!!';

// Helpers para construir el nombre de la cookie (replica la lógica interna de order-access.ts).
const ORDER_ACCESS_COOKIE_PREFIX = 'amber_oa_';
const cookieName = (orderNumber: string) =>
  `${ORDER_ACCESS_COOKIE_PREFIX}${orderNumber.replace(/[^a-zA-Z0-9-]/g, '-')}`;

/**
 * Construye un token válido para `orderNumber` usando el mismo algoritmo
 * que signOrderAccessToken (payload.signature base64url).
 */
const buildRealToken = (orderNumber: string, secret: string): string => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const payload = Buffer.from(JSON.stringify({ order_number: orderNumber, exp })).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
};

describe('GET /api/orders/[orderNumber] — cross-order binding REAL HMAC (no mock de order-access)', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.SESSION_SECRET = TEST_SECRET;
  });

  it('returns 403 when a valid token for ORD-B is presented for ORD-A (real HMAC verification)', async () => {
    // 1. Construir el token real para ORD-B.
    const tokenForOrdB = buildRealToken('ORD-B', TEST_SECRET);

    // 2. Mockear next/headers cookies() para que devuelva ese token
    //    bajo el nombre de la cookie de ORD-A.
    //    Esto simula: atacante copia el token válido de ORD-B al slot cookie de ORD-A.
    const cookieForOrdA = cookieName('ORD-A');
    vi.doMock('next/headers', () => ({
      cookies: vi.fn().mockResolvedValue({
        get: vi.fn((name: string) => {
          if (name === cookieForOrdA) {
            // El token de ORD-B colocado en el slot de ORD-A.
            return { value: tokenForOrdB };
          }
          return undefined;
        }),
        set: vi.fn(),
        delete: vi.fn(),
      }),
    }));

    // 3. Mockear session → sin sesión (guest).
    const { getSession } = await import('../../../lib/session');
    vi.mocked(getSession).mockResolvedValue(null);

    // 4. Mockear backendFetch (no debería llegar aquí, pero por seguridad).
    const { backendFetch } = await import('../../../lib/bff-proxy');
    vi.mocked(backendFetch).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        order_number: 'ORD-A',
        status: 'paid',
        total: 10000,
        customer_email: 'victim@ejemplo.com',
        customer_id: null,
        items: [],
      },
    });

    // 5. Importar el route DESPUÉS de establecer los mocks con doMock.
    const { GET } = await import('./route');

    const req = new NextRequest('http://localhost/api/orders/ORD-A');
    const params = Promise.resolve({ orderNumber: 'ORD-A' });
    const response = await GET(req, { params });

    // 6. La verificación HMAC real detecta que order_number del token (ORD-B)
    //    != order_number de la ruta (ORD-A) → verifyOrderAccessCookie devuelve null
    //    → hasCapabilityAccess = false → sin sesión → 403.
    expect(response.status).toBe(403);

    const body = await response.json() as Record<string, unknown>;
    // No debe filtrar PII.
    expect(body.customer_email).toBeUndefined();
    expect(body.shipping_address).toBeUndefined();
  });

  it('returns 200 when a valid token for ORD-A is used to access ORD-A (real HMAC — positive path)', async () => {
    // Control positivo: el mismo mecanismo real debe permitir acceso con el token correcto.
    const tokenForOrdA = buildRealToken('ORD-A', TEST_SECRET);
    const cookieForOrdA = cookieName('ORD-A');

    vi.doMock('next/headers', () => ({
      cookies: vi.fn().mockResolvedValue({
        get: vi.fn((name: string) => {
          if (name === cookieForOrdA) return { value: tokenForOrdA };
          return undefined;
        }),
        set: vi.fn(),
        delete: vi.fn(),
      }),
    }));

    const { getSession } = await import('../../../lib/session');
    vi.mocked(getSession).mockResolvedValue(null);

    const { backendFetch } = await import('../../../lib/bff-proxy');
    vi.mocked(backendFetch).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        order_number: 'ORD-A',
        status: 'paid',
        total: 10000,
        customer_email: 'owner@ejemplo.com',
        customer_id: null,
        items: [],
      },
    });

    const { GET } = await import('./route');

    const req = new NextRequest('http://localhost/api/orders/ORD-A');
    const params = Promise.resolve({ orderNumber: 'ORD-A' });
    const response = await GET(req, { params });

    // El token es legítimo para ORD-A → 200.
    expect(response.status).toBe(200);
    const body = await response.json() as Record<string, unknown>;
    expect(body.order_number).toBe('ORD-A');
  });
});
