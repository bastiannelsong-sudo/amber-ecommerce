/**
 * Tests de seguridad: GET /api/orders/[orderNumber]
 *
 * Verifica que el endpoint NO expone PII a cualquiera que conozca el
 * order_number. El ownership se verifica contra la sesión httpOnly.
 *
 * RED → GREEN: la implementación debe verificar ownership antes de
 * devolver PII del pedido.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks hoisted — deben estar antes del import del módulo bajo test.
vi.mock('../../../lib/session', () => ({
  getSession: vi.fn(),
}));

// backendFetch es la función que usa el nuevo route.ts para obtener y
// verificar los datos de la orden antes de decidir si devolver PII.
vi.mock('../../../lib/bff-proxy', () => ({
  backendFetch: vi.fn(),
  proxyToBackend: vi.fn(),
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
  customer_id: 42,
};

describe('GET /api/orders/[orderNumber] — ownership guard', () => {
  let getSession: ReturnType<typeof vi.fn>;
  let backendFetch: ReturnType<typeof vi.fn>;
  let GET: (req: NextRequest, ctx: { params: Promise<{ orderNumber: string }> }) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();

    const sessionMod = await import('../../../lib/session');
    const proxyMod = await import('../../../lib/bff-proxy');
    const routeMod = await import('./route');

    getSession = vi.mocked(sessionMod.getSession);
    backendFetch = vi.mocked(proxyMod.backendFetch);
    GET = routeMod.GET;

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
  // 6.1a — Sin ownership válido → 403, SIN PII en el body.
  // ---------------------------------------------------------------------------
  it('returns 403 when no session exists (unauthenticated request)', async () => {
    getSession.mockResolvedValue(null);

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
    // Sesión con un user_id distinto al customer_id de la orden (42).
    getSession.mockResolvedValue({
      user_id: 99,
      email: 'otro@ejemplo.com',
      first_name: 'Otro',
      last_name: 'Usuario',
      access_token: 'tok',
      refresh_token: 'ref',
      expires_at: Date.now() / 1000 + 3600,
    });

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

  // ---------------------------------------------------------------------------
  // 6.1b — Con ownership correcto (sesión correcta) → 200 con datos.
  // ---------------------------------------------------------------------------
  it('returns 200 with order data when session matches order customer_id', async () => {
    // Sesión con el mismo user_id que el customer_id de la orden (42).
    getSession.mockResolvedValue({
      user_id: 42,
      email: 'cliente@ejemplo.com',
      first_name: 'Cliente',
      last_name: 'Test',
      access_token: 'tok',
      refresh_token: 'ref',
      expires_at: Date.now() / 1000 + 3600,
    });

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
    // Con ownership válido, los datos de la orden se retornan completos.
    expect(body.customer_email).toBe('cliente@ejemplo.com');
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
});
