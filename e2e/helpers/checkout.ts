import { Page, expect } from '@playwright/test';

/**
 * Datos de un cliente de test. Email empieza con 'e2e-test-' para que
 * cleanupRecentTestOrders() en db.ts pueda limpiarlo despues.
 */
export const TEST_CUSTOMER = {
  email: 'e2e-test-bot@ambernelson.cl',
  firstName: 'Bot',
  lastName: 'Tester',
  phone: '+56912345678',
  address: 'Av Apoquindo 4500',
  apartment: '',
  region: 'Region Metropolitana de Santiago',
  city: 'Las Condes',
  postalCode: '7550000',
};

/**
 * Va al catalogo, agrega el primer producto disponible al carrito y
 * navega a /checkout. Asume que el catalogo tiene al menos un producto
 * con stock — si no, falla.
 */
export async function addFirstProductToCart(page: Page): Promise<void> {
  await page.goto('/catalogo');
  // Espera a que carguen productos (deduplicar entre data-testid o .group).
  const firstCard = page.locator('[data-testid="product-card"], .group').first();
  await expect(firstCard).toBeVisible({ timeout: 15000 });
  await firstCard.click();

  // En la pagina de producto, click "Agregar al carrito".
  const addBtn = page
    .getByRole('button', { name: /agregar al carrito|añadir al carrito/i })
    .first();
  await expect(addBtn).toBeVisible({ timeout: 10000 });
  await addBtn.click();

  // Cerrar drawer del cart si se abrio, e ir a checkout via URL directa.
  await page.goto('/checkout');
}

/**
 * Llena el formulario de checkout con datos de test y submitea.
 * Intercepta el redirect a MP — en su lugar captura el order_number
 * del response y devuelve para que el spec lo use.
 *
 * Por que: el redirect a sandbox.mercadopago.com es lo que NO queremos
 * testear (frágil, lento, requiere llenar tarjeta en iframe externo).
 * Capturamos el order_number y simulamos el resto via simulateMpWebhook.
 */
export async function submitCheckoutAndCaptureOrder(
  page: Page,
): Promise<string> {
  let capturedOrderNumber = '';

  // Bloqueamos la navegacion fuera del dominio (a MP) ANTES de submitear.
  await page.route('**/api/orders', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    capturedOrderNumber = body?.order?.order_number ?? '';
    // Devolvemos el response real al cliente — el front va a hacer
    // window.location = init_point. Eso lo bloqueamos abajo.
    await route.fulfill({ response, json: body });
  });

  // Bloqueo del redirect a MP. Cuando el browser intenta ir a
  // sandbox.mercadopago.com, abortamos.
  await page.route(/mercadopago\.com|mercadolibre\.com/, (route) =>
    route.abort('blockedbyclient'),
  );

  // Llenar form
  await page.fill('input[name="email"]', TEST_CUSTOMER.email);
  await page.fill('input[name="firstName"]', TEST_CUSTOMER.firstName);
  await page.fill('input[name="lastName"]', TEST_CUSTOMER.lastName);
  await page.fill('input[name="phone"]', TEST_CUSTOMER.phone);
  await page.fill('input[name="address"]', TEST_CUSTOMER.address);

  // Region/city son selects poblados desde getGeo. Esperamos a que
  // tengan opciones antes de seleccionar.
  await page.waitForFunction(
    () => {
      const el = document.querySelector(
        'select[name="region"]',
      ) as HTMLSelectElement | null;
      return el != null && el.options.length > 1;
    },
    { timeout: 10000 },
  );
  await page.selectOption('select[name="region"]', { label: TEST_CUSTOMER.region });
  await page.waitForFunction(
    () => {
      const el = document.querySelector(
        'select[name="city"]',
      ) as HTMLSelectElement | null;
      return el != null && el.options.length > 1;
    },
    { timeout: 10000 },
  );
  await page.selectOption('select[name="city"]', { label: TEST_CUSTOMER.city });

  if (TEST_CUSTOMER.postalCode) {
    await page.fill('input[name="postalCode"]', TEST_CUSTOMER.postalCode);
  }

  // Submit. La respuesta de POST /api/orders se intercepta arriba.
  await page.locator('button[type="submit"]').click();

  // Esperamos a que el route handler capture el order_number.
  await expect.poll(() => capturedOrderNumber, { timeout: 15000 }).not.toBe('');

  return capturedOrderNumber;
}
