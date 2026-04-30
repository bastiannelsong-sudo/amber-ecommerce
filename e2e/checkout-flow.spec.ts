import { test, expect } from '@playwright/test';
import {
  addFirstProductToCart,
  submitCheckoutAndCaptureOrder,
} from './helpers/checkout';
import { simulateMpWebhook, cleanupRecentTestOrders } from './helpers/db';

/**
 * E2E del flow completo de checkout. NO testea la UI de MercadoPago
 * (iframe externo, fragil, no agrega valor). En su lugar:
 *   1. Catalogo -> producto -> agregar al carrito (UI real)
 *   2. /checkout llenar form (UI real)
 *   3. Submit -> intercepta /api/orders, captura order_number
 *   4. Bloquea el redirect a MP
 *   5. simulateMpWebhook(orderNumber, status) modifica DB directo
 *   6. Navega a /checkout/resultado y verifica el comportamiento UI
 *
 * Asume:
 *   - Backend NestJS corriendo en :3000 (con DB local)
 *   - Frontend Next en :3001
 *   - DB local con migrations 033-035 aplicadas
 *   - Catalogo con al menos 1 producto en stock
 *
 * Limpieza: al final de la suite borra todas las ordenes con email
 * 'e2e-test-*' creadas durante la corrida.
 */
test.describe('Checkout flow E2E', () => {
  test.afterAll(async () => {
    await cleanupRecentTestOrders();
  });

  test('Pago aprobado con tarjeta → comprobante muestra "Visa terminada en 0604"', async ({
    page,
  }) => {
    await addFirstProductToCart(page);
    const orderNumber = await submitCheckoutAndCaptureOrder(page);

    // Simulamos lo que haria el webhook real cuando MP nos avisa que
    // el pago fue aprobado con tarjeta Visa terminada en 0604.
    await simulateMpWebhook(orderNumber, {
      status: 'approved',
      payment_method: 'visa',
      card_last_four: '0604',
    });

    // Navegamos a la pagina de resultado como si MP nos hubiera redirigido.
    await page.goto(`/checkout/resultado?status=success&order=${orderNumber}`);

    // Polling del resultado page detecta el status 'paid' en menos de 30s.
    await expect(page.getByRole('heading', { name: /pedido confirmado/i })).toBeVisible({
      timeout: 30000,
    });

    // CTA "Ver comprobante" aparece solo en estado paid.
    const verComprobante = page.getByRole('link', { name: /ver comprobante/i });
    await expect(verComprobante).toBeVisible();
    await verComprobante.click();

    // Comprobante: assert el numero de orden + 4 digitos finales.
    await expect(page).toHaveURL(new RegExp(`/orden/${orderNumber}`));
    await expect(page.getByRole('heading', { name: new RegExp(`#${orderNumber}`, 'i') })).toBeVisible();
    await expect(page.getByText(/visa/i)).toBeVisible();
    await expect(page.getByText(/0604/)).toBeVisible();
    await expect(page.getByText(/pagado/i)).toBeVisible();
  });

  test('Pago rechazado → UI failure + boton "Reintentar pago"', async ({
    page,
  }) => {
    await addFirstProductToCart(page);
    const orderNumber = await submitCheckoutAndCaptureOrder(page);

    await simulateMpWebhook(orderNumber, { status: 'rejected' });

    await page.goto(`/checkout/resultado?status=failure&order=${orderNumber}`);

    await expect(
      page.getByRole('heading', { name: /pago no completado/i }),
    ).toBeVisible({ timeout: 30000 });
    await expect(
      page.getByRole('link', { name: /reintentar pago/i }),
    ).toBeVisible();
    // No debe haber CTA "Ver comprobante" en estado failed.
    await expect(
      page.getByRole('link', { name: /ver comprobante/i }),
    ).not.toBeVisible();
  });

  test('Pago pending → polling → transiciona a paid en runtime', async ({
    page,
  }) => {
    await addFirstProductToCart(page);
    const orderNumber = await submitCheckoutAndCaptureOrder(page);

    // Inicialmente lo dejamos pending. La UI debe mostrar "Pago en proceso".
    await simulateMpWebhook(orderNumber, { status: 'pending' });
    await page.goto(`/checkout/resultado?status=pending&order=${orderNumber}`);

    await expect(
      page.getByRole('heading', { name: /pago en proceso/i }),
    ).toBeVisible({ timeout: 15000 });

    // Despues de 3s, simulamos que llego el webhook de aprobacion.
    await page.waitForTimeout(3000);
    await simulateMpWebhook(orderNumber, {
      status: 'approved',
      payment_method: 'master',
      card_last_four: '5678',
    });

    // El polling del front (cada 2s) deberia detectar el cambio.
    await expect(
      page.getByRole('heading', { name: /pedido confirmado/i }),
    ).toBeVisible({ timeout: 30000 });
  });

  test('Pago aprobado con account_money (sin tarjeta) → comprobante sin 4 digitos', async ({
    page,
  }) => {
    await addFirstProductToCart(page);
    const orderNumber = await submitCheckoutAndCaptureOrder(page);

    await simulateMpWebhook(orderNumber, {
      status: 'approved',
      payment_method: 'account_money',
      card_last_four: undefined,
    });

    await page.goto(`/checkout/resultado?status=success&order=${orderNumber}`);
    await expect(
      page.getByRole('heading', { name: /pedido confirmado/i }),
    ).toBeVisible({ timeout: 30000 });

    await page.getByRole('link', { name: /ver comprobante/i }).click();
    await expect(page).toHaveURL(new RegExp(`/orden/${orderNumber}`));

    // El metodo se muestra como "Dinero en MercadoPago", sin "•••• XXXX".
    await expect(page.getByText(/dinero en mercadopago/i)).toBeVisible();
    await expect(page.getByText(/terminada en/i)).not.toBeVisible();
  });

  test('Comprobante con order_number invalido → not-found', async ({ page }) => {
    await page.goto('/orden/AMBNOEXISTE12345');
    await expect(
      page.getByRole('heading', { name: /no encontramos esta orden/i }),
    ).toBeVisible();
  });
});
