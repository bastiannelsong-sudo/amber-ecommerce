/**
 * Tests de seguridad: GET /api/orders/[orderNumber]
 *
 * Verifica que el endpoint NO expone PII a cualquiera que conozca el
 * order_number. El ownership se verifica contra la sesión httpOnly O
 * contra una cookie de acceso firmada por HMAC para esa orden concreta
 * (capability token para guest checkout / polling inmediato post-pago).
 *
 * Escenarios cubiertos:
 *   Sesión dueña sin cookie                    → 200 (flujo logueado intacto)
 *   Cookie válida para orden A + request orden A → 200 con proyección mínima
 *   Cookie válida para orden B + request orden A → 403 (condición 1: binding por orden)
 *   Sin cookie y sin sesión                    → 403 sin PII en body
 *   Token expirado (exp pasado)                → 403 (TTL validado server-side)
 *   Token con firma manipulada                 → 403
 *   Respuesta de polling SIN dirección completa → condición 4 (proyección mínima)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks hoisted — deben estar antes del import del módulo bajo test.
vi.mock('../../../lib/session', () => ({
  getSession: vi.fn(),
}));

// backendFetch es la función que usa el route.ts para obtener y
// verificar los datos de la orden antes de decidir si devolver PII.
vi.mock('../../../lib/bff-proxy', () => ({
  backendFetch: vi.fn(),
  proxyToBackend: vi.fn(),
}));

// order-access: mockeamos verifyOrderAccessCookie para controlar su resultado
// en tests sin necesidad de replicar la lógica HMAC.
vi.mock('../../../lib/order-access', () => ({
  verifyOrderAccessCookie: vi.fn(),
  setOrderAccessCookie: vi.fn(),
}));

// La orden que el backend devuelve cuando existe y está activa.
const MOCK_ORDER_WITH_PII = {
  order_number: 'ORD-001',
  status: 'paid',
  total: 15000,
  customer_email: 'cliente@ejemplo.com',
  customer_name: 'Cliente Test',
  shipping_address: 'Calle Falsa 123',
  shipping_city: 'Santiago',
  shipping_region: 'RM',
  shipping_zip: '7500000',
  customer_phone: '+56912345678',
  customer_id: 42,
  items: [{ product_id: 1, name: 'Anillo', quantity: 1, unit_price: 15000 }],
};

describe('GET /api/orders/[orderNumber] — ownership guard', () => {
  let getSession: ReturnType<typeof vi.fn>;
  let backendFetch: ReturnType<typeof vi.fn>;
  let verifyOrderAccessCookie: ReturnType<typeof vi.fn>;
  let GET: (req: NextRequest, ctx: { params: Promise<{ orderNumber: string }> }) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();

    const sessionMod = await import('../../../lib/session');
    const proxyMod = await import('../../../lib/bff-proxy');
    const orderAccessMod = await import('../../../lib/order-access');
    const routeMod = await import('./route');

    getSession = vi.mocked(sessionMod.getSession);
    backendFetch = vi.mocked(proxyMod.backendFetch);
    verifyOrderAccessCookie = vi.mocked(orderAccessMod.verifyOrderAccessCookie);
    GET = routeMod.GET;

    // Por defecto: sin sesión, sin cookie de acceso.
    getSession.mockResolvedValue(null);
    verifyOrderAccessCookie.mockResolvedValue(null);

    // Por defecto el backend devuelve la orden completa con PII.
    backendFetch.mockResolvedValue({
      ok: true,
      status: 200,
      data: MOCK_ORDER_WITH_PII,
    });
  });

  const makeRequest = (orderNumber: string) => {
    const req = new NextRequest(`http://localhost/api/orders/${orderNumber}`);
    const params = Promise.resolve({ orderNumber });
    return { req, params };
  };

  // ---------------------------------------------------------------------------
  // Tests preexistentes (sesión-based) — mantenidos como regresión
  // ---------------------------------------------------------------------------

  it('returns 403 when no session exists and no access cookie (unauthenticated request)', async () => {
    getSession.mockResolvedValue(null);
    verifyOrderAccessCookie.mockResolvedValue(null);

    const { req, params } = makeRequest('ORD-001');
    const response = await GET(req, { params });

    expect(response.status).toBe(403);

    // No debe filtrar PII en el cuerpo del error.
    const body = await response.json() as Record<string, unknown>;
    expect(body.customer_email).toBeUndefined();
    expect(body.shipping_address).toBeUndefined();
    expect(body.customer_name).toBeUndefined();
  });

  it('returns 403 when session belongs to a different user (wrong ownership)', async () => {
    getSession.mockResolvedValue({
      user_id: 99,
      email: 'otro@ejemplo.com',
      first_name: 'Otro',
      last_name: 'Usuario',
      access_token: 'tok',
      refresh_token: 'ref',
      expires_at: Date.now() / 1000 + 3600,
    });
    verifyOrderAccessCookie.mockResolvedValue(null);

    backendFetch.mockResolvedValue({
      ok: true,
      status: 200,
      data: MOCK_ORDER_WITH_PII, // customer_id=42, session.user_id=99 → no coincide
    });

    const { req, params } = makeRequest('ORD-001');
    const response = await GET(req, { params });

    expect(response.status).toBe(403);

    const body = await response.json() as Record<string, unknown>;
    expect(body.customer_email).toBeUndefined();
    expect(body.shipping_address).toBeUndefined();
  });

  it('returns 404 when backend returns 404 (order does not exist)', async () => {
    getSession.mockResolvedValue({
      user_id: 42,
      email: 'cliente@ejemplo.com',
      first_name: 'Cliente',
      last_name: 'Test',
      access_token: 'tok',
      refresh_token: 'ref',
      expires_at: Date.now() / 1000 + 3600,
    });
    verifyOrderAccessCookie.mockResolvedValue(null);

    // El backend dice que la orden no existe.
    backendFetch.mockResolvedValue({
      ok: false,
      status: 404,
      data: null,
    });

    const { req, params } = makeRequest('ORD-INEXISTENTE');
    const response = await GET(req, { params });

    expect(response.status).toBe(404);

    // La respuesta de error no debe contener PII.
    const body = await response.json() as Record<string, unknown>;
    expect(body.customer_email).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // Sesión dueña sin cookie → 200 (no se rompe el flujo logueado)
  // ---------------------------------------------------------------------------
  it('returns 200 when authenticated session owns the order (no access cookie needed)', async () => {
    getSession.mockResolvedValue({
      user_id: 42,
      email: 'cliente@ejemplo.com',
      first_name: 'Cliente',
      last_name: 'Test',
      access_token: 'tok',
      refresh_token: 'ref',
      expires_at: Date.now() / 1000 + 3600,
    });
    verifyOrderAccessCookie.mockResolvedValue(null); // sin cookie de acceso

    backendFetch.mockResolvedValue({
      ok: true,
      status: 200,
      data: MOCK_ORDER_WITH_PII,
    });

    const { req, params } = makeRequest('ORD-001');
    const response = await GET(req, { params });

    expect(response.status).toBe(200);
    const body = await response.json() as Record<string, unknown>;
    expect(body.order_number).toBe('ORD-001');
  });

  // ---------------------------------------------------------------------------
  // Cookie válida para orden A + request orden A → 200 con proyección mínima
  // (Condición 1 + Condición 4)
  // ---------------------------------------------------------------------------
  it('returns 200 when valid access cookie matches the requested order (guest polling flow)', async () => {
    getSession.mockResolvedValue(null); // guest, sin sesión
    // Cookie válida para ORD-001.
    verifyOrderAccessCookie.mockResolvedValue('ORD-001');

    backendFetch.mockResolvedValue({
      ok: true,
      status: 200,
      data: MOCK_ORDER_WITH_PII,
    });

    const { req, params } = makeRequest('ORD-001');
    const response = await GET(req, { params });

    expect(response.status).toBe(200);
  });

  // ---------------------------------------------------------------------------
  // Condición 4: la respuesta de polling NO incluye la dirección completa
  // ---------------------------------------------------------------------------
  it('response does NOT include full shipping address (minimal projection — condition 4)', async () => {
    getSession.mockResolvedValue(null);
    verifyOrderAccessCookie.mockResolvedValue('ORD-001');

    backendFetch.mockResolvedValue({
      ok: true,
      status: 200,
      data: MOCK_ORDER_WITH_PII,
    });

    const { req, params } = makeRequest('ORD-001');
    const response = await GET(req, { params });

    expect(response.status).toBe(200);
    const body = await response.json() as Record<string, unknown>;

    // La proyección mínima permite order_number, status, total, customer_email, items.
    expect(body.order_number).toBe('ORD-001');
    expect(body.status).toBeDefined();
    expect(body.customer_email).toBeDefined(); // para el link al comprobante

    // La dirección completa NO debe aparecer en el polling.
    expect(body.shipping_address).toBeUndefined();
    expect(body.shipping_city).toBeUndefined();
    expect(body.shipping_region).toBeUndefined();
    expect(body.shipping_zip).toBeUndefined();

    // Datos personales extra NO deben aparecer.
    expect(body.customer_name).toBeUndefined();
    expect(body.customer_phone).toBeUndefined();
    expect(body.customer_id).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // Condición 1: Cookie válida para orden B + request a orden A → 403
  // ---------------------------------------------------------------------------
  it('returns 403 when access cookie is for a DIFFERENT order (cross-order access attempt)', async () => {
    getSession.mockResolvedValue(null);
    // Cookie firmada para ORD-002 pero la request es a ORD-001.
    verifyOrderAccessCookie.mockResolvedValue('ORD-002');

    const { req, params } = makeRequest('ORD-001');
    const response = await GET(req, { params });

    expect(response.status).toBe(403);

    // No debe filtrar PII.
    const body = await response.json() as Record<string, unknown>;
    expect(body.customer_email).toBeUndefined();
    expect(body.shipping_address).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // Token expirado → 403 (TTL validado server-side — condición 3)
  // ---------------------------------------------------------------------------
  it('returns 403 when access cookie token is expired (server-side TTL check)', async () => {
    getSession.mockResolvedValue(null);
    // verifyOrderAccessCookie devuelve null cuando el token está expirado.
    // El helper valida el exp server-side y retorna null si expiró.
    verifyOrderAccessCookie.mockResolvedValue(null);

    const { req, params } = makeRequest('ORD-001');
    const response = await GET(req, { params });

    expect(response.status).toBe(403);
  });

  // ---------------------------------------------------------------------------
  // Token con firma manipulada → 403 (condición 3)
  // ---------------------------------------------------------------------------
  it('returns 403 when access cookie has a tampered signature', async () => {
    getSession.mockResolvedValue(null);
    // verifyOrderAccessCookie devuelve null cuando la firma no coincide.
    verifyOrderAccessCookie.mockResolvedValue(null);

    const { req, params } = makeRequest('ORD-001');
    const response = await GET(req, { params });

    expect(response.status).toBe(403);
  });
});

// Los tests unitarios de signOrderAccessToken / verifyOrderAccessToken
// están en app/lib/order-access.test.ts (archivo separado para evitar
// conflictos con el vi.mock hoisted de '../../../lib/order-access' de este archivo).
