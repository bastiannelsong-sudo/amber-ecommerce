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
  // El select usa `short_name` del API /api/geo (no el full_name).
  region: 'Metropolitana',
  city: 'Las Condes',
  postalCode: '7550000',
};

/**
 * Agrega el primer producto del catalogo al carrito y navega a checkout.
 *
 * Optimizacion: en vez de clickear "Agregar al carrito" en la UI del
 * producto (frágil por el header sticky que intercepta clicks),
 * inyectamos el item directo al localStorage que Zustand persist usa
 * (`amber-cart-storage`). Esto desacopla el setup del carrito de los
 * tests del flow de checkout — los tests del add-to-cart UI viven aparte.
 */
export async function addFirstProductToCart(page: Page): Promise<void> {
  const res = await page.request.get('/api/products/catalog?limit=1');
  if (!res.ok()) {
    throw new Error(
      `No pude listar productos (HTTP ${res.status()}). Asegurate ` +
        `de que backend + frontend esten arriba y haya productos en BD.`,
    );
  }
  const data = await res.json();
  const product = data?.data?.[0] ?? data?.[0];
  if (!product?.slug) {
    throw new Error('Catalogo vacio — no hay productos para testear.');
  }

  // Cargamos / antes de tocar localStorage (Zustand persist requiere
  // el origin correcto; sin un goto previo localStorage es de about:blank).
  await page.goto('/');

  await page.evaluate((p) => {
    const cartState = {
      state: {
        items: [{ product: p, quantity: 1 }],
        isOpen: false,
      },
      version: 0,
    };
    localStorage.setItem('amber-cart-storage', JSON.stringify(cartState));
  }, product);

  // Recargar para que Zustand re-hidrate del localStorage actualizado.
  await page.goto('/checkout');
}

/**
 * Crea una orden directamente via POST /api/orders (mismo endpoint que
 * dispara el form de checkout) en vez de driver la UI.
 *
 * Por que: el form de checkout es un flujo de 2 steps con header
 * sticky que intercepta clicks. Driver eso desde Playwright es
 * extremadamente fragil. Para la suite del comprobante (que es lo que
 * queremos cubrir aca), lo unico relevante es tener un order_number
 * en la BD — la UI del checkout se testea aparte.
 */
export async function createOrderViaApi(page: Page): Promise<string> {
  // Tomamos el primer producto del catalogo para usar precio + sku reales.
  const catRes = await page.request.get('/api/products/catalog?limit=1');
  if (!catRes.ok()) {
    throw new Error(
      `No pude listar productos (HTTP ${catRes.status()}). Backend caido?`,
    );
  }
  const cat = await catRes.json();
  const product = cat?.data?.[0] ?? cat?.[0];
  if (!product) throw new Error('Catalogo vacio.');

  const payload = {
    customer_email: TEST_CUSTOMER.email,
    customer_name: `${TEST_CUSTOMER.firstName} ${TEST_CUSTOMER.lastName}`,
    customer_phone: TEST_CUSTOMER.phone,
    shipping_address: TEST_CUSTOMER.address,
    shipping_city: TEST_CUSTOMER.city,
    shipping_region: TEST_CUSTOMER.region,
    shipping_postal_code: TEST_CUSTOMER.postalCode,
    items: [
      {
        product_id: product.product_id,
        name: product.name,
        internal_sku: product.internal_sku,
        quantity: 1,
        unit_price: Number(product.price),
        image_url: product.image_url,
      },
    ],
  };

  const res = await page.request.post('/api/orders', { data: payload });
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`POST /api/orders fallo (${res.status()}): ${body}`);
  }
  const body = await res.json();
  const orderNumber = body?.order?.order_number;
  if (!orderNumber) {
    throw new Error('Response de /api/orders no trae order_number');
  }
  return orderNumber;
}

/**
 * @deprecated Usar createOrderViaApi() — driver el form via Playwright
 * es fragil con el header sticky de este sitio. La UI del checkout
 * se testea en su propia spec con auth y todo el flow.
 */
export async function submitCheckoutAndCaptureOrder(
  page: Page,
): Promise<string> {
  let capturedOrderNumber = '';

  // Espia el response de POST /api/orders via on('response') en lugar de
  // route() — mas robusto, no toca el flujo del request.
  page.on('response', async (resp) => {
    if (
      resp.url().endsWith('/api/orders') &&
      resp.request().method() === 'POST'
    ) {
      try {
        const body = await resp.json();
        if (body?.order?.order_number) {
          capturedOrderNumber = body.order.order_number;
        }
      } catch {
        /* respuesta no-JSON — ignorar */
      }
    }
  });

  // Bloqueo del redirect a MP. Cuando el browser intenta ir a
  // sandbox.mercadopago.com, abortamos sin error.
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

  // Step 1: shipping → click "Continuar al Pago" via CSS selector
  // especifico (evitamos getByRole que choca con la newsletter "Obtener 10%").
  // dispatchEvent emula un click real que React captura via su onClick.
  const continueBtn = page.locator(
    'form button[type="submit"]:has-text("Continuar al Pago")',
  );
  await expect(continueBtn).toBeVisible();
  await continueBtn.scrollIntoViewIfNeeded();
  // Click via dispatchEvent — bypassa pointer-event interception del header.
  await continueBtn.dispatchEvent('click');

  // Step 2: esperar render del payment form y disparar onClick del boton
  // "Pagar con MercadoPago" (su click handler dispara el form submit).
  const payBtn = page.locator(
    'form button[type="submit"]:has-text("Pagar con MercadoPago")',
  );
  await expect(payBtn).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(300);
  await payBtn.dispatchEvent('click');

  // Esperamos a que el route handler capture el order_number.
  await expect.poll(() => capturedOrderNumber, { timeout: 15000 }).not.toBe('');

  return capturedOrderNumber;
}
