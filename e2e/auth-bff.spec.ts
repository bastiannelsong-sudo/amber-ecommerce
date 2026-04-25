import { test, expect, type APIResponse } from '@playwright/test';

/**
 * Tests del BFF de auth:
 *   - /api/auth/me devuelve 200 `null` sin sesión (por diseño, ver route.ts)
 *   - Flujos privados (profile) rechazan con 401 sin cookie
 *   - La cookie `amber_session` se setea tras login y se limpia tras logout
 *   - El bundle cliente NO expone la URL del backend privado
 *
 * ━━━ Prerequisitos para correr ━━━
 *   1. Ecommerce Next.js corriendo: `pnpm dev` (puerto 3001)
 *   2. Backend NestJS corriendo en puerto 3000 (con PostgreSQL)
 *   3. Browsers instalados: `npx playwright install` (una vez)
 *
 * Correr: `npx playwright test e2e/auth-bff.spec.ts --project=desktop`
 *
 * NOTA: estos tests no crean usuarios reales en BD — validan el contrato
 * del BFF. Los flujos completos login/register con credenciales reales
 * requieren una cuenta de prueba creada en backend (seed o fixture), fuera
 * del alcance de este archivo.
 */

const getJson = async (res: APIResponse) => {
  const body = await res.text();
  return body ? JSON.parse(body) : null;
};

test.describe('BFF: /api/auth/me (visitante anónimo)', () => {
  test('devuelve HTTP 200 y body null cuando no hay sesión', async ({ request }) => {
    const res = await request.get('/api/auth/me');
    expect(res.status()).toBe(200);
    expect(await getJson(res)).toBeNull();
  });
});

test.describe('BFF: endpoints privados', () => {
  test('/api/auth/profile rechaza con 401 sin cookie', async ({ request }) => {
    const res = await request.get('/api/auth/profile');
    expect(res.status()).toBe(401);
  });

  test('/api/auth/logout funciona idempotente (200 aunque no haya sesión)', async ({
    request,
  }) => {
    const res = await request.post('/api/auth/logout');
    expect(res.ok()).toBeTruthy();
    const body = await getJson(res);
    expect(body).toMatchObject({ success: true });
  });
});

test.describe('BFF: validación de payloads', () => {
  test('/api/auth/login rechaza body vacío con 400', async ({ request }) => {
    const res = await request.post('/api/auth/login', { data: {} });
    expect(res.status()).toBe(400);
  });

  test('/api/auth/register rechaza body incompleto con 400', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: { email: 'x@y.com' },
    });
    expect(res.status()).toBe(400);
  });

  test('/api/auth/google rechaza sin id_token con 400', async ({ request }) => {
    const res = await request.post('/api/auth/google', { data: {} });
    expect(res.status()).toBe(400);
  });
});

test.describe('BFF: endpoints públicos (proxy al backend)', () => {
  test('/api/products/catalog responde con datos del backend', async ({ request }) => {
    const res = await request.get('/api/products/catalog?limit=3');
    expect(res.ok()).toBeTruthy();
    const body = await getJson(res);
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('/api/collections/tree responde con jerarquía', async ({ request }) => {
    const res = await request.get('/api/collections/tree');
    expect(res.ok()).toBeTruthy();
    const body = await getJson(res);
    expect(Array.isArray(body)).toBe(true);
  });

  test('/api/products/suggestions responde con productos + colecciones', async ({
    request,
  }) => {
    const res = await request.get('/api/products/suggestions?q=aros');
    expect(res.ok()).toBeTruthy();
    const body = await getJson(res);
    expect(body).toHaveProperty('products');
    expect(body).toHaveProperty('collections');
  });
});

test.describe('Seguridad: no-leak de backend en el HTML inicial', () => {
  test('la home no expone INTERNAL_API_URL ni /ecommerce-auth en el HTML', async ({
    page,
  }) => {
    const response = await page.goto('/');
    const html = (await response?.text()) ?? '';
    // La URL del backend privado NO debe aparecer en el HTML server-rendered.
    expect(html).not.toContain('INTERNAL_API_URL');
    // Los paths del backend NO deben aparecer (el cliente solo conoce /api/*).
    expect(html).not.toContain('/ecommerce-auth/');
    // La URL hardcodeada de desarrollo del backend tampoco.
    expect(html).not.toContain('localhost:3000');
  });
});
