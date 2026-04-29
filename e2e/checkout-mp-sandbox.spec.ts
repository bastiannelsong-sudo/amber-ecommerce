/**
 * E2E del flujo de checkout contra MP sandbox.
 *
 * Cubre:
 *   1. Catálogo → producto → agregar al carrito → checkout
 *   2. Llenar form de envío y avanzar a "payment"
 *   3. Click "Pagar" → verifica redirect a sandbox.mercadopago.cl/checkout
 *
 * NO automatiza la UI de MP (login, formulario de tarjeta) porque cambia
 * frecuentemente y rompe los tests sin valor. Para validar transiciones de
 * estado de la orden ver `webhook-state-machine.spec.ts` (simula webhook
 * con HMAC válido y verifica state machine).
 *
 * Pre-requisitos:
 *   - Backend (puerto 3000) corriendo con MP_ACCESS_TOKEN sandbox cargado
 *   - Ecommerce (puerto 3001) corriendo
 *   - Migración 036 aplicada en la BD local
 *
 * Smoke manual completo (incluyendo UI de MP) usar las creds de
 * `memory/reference_mp_sandbox_test_user.md`.
 */
import { test, expect } from '@playwright/test';

test.describe('Checkout → MercadoPago sandbox', () => {
  test('flujo completo: catalogo → carrito → checkout → redirect a MP', async ({ page }) => {
    // 1. Catálogo: agregar primer producto al carrito
    await page.goto('/catalogo');
    const firstProduct = page.locator('a[href^="/producto/"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 10000 });
    await firstProduct.click();

    // 2. PDP: click "Agregar al carrito" (abre CartDrawer overlay)
    const addToCart = page.getByRole('button', { name: /agregar al carrito/i }).first();
    await expect(addToCart).toBeVisible({ timeout: 10000 });
    await addToCart.click();

    // Cerrar el CartDrawer (su backdrop fixed inset-0 z-[60] intercepta
    // clicks). Click en el botón "Cerrar carrito" del drawer.
    const closeCartBtn = page.getByRole('button', { name: /cerrar carrito/i });
    await closeCartBtn.click();
    // Esperar a que la animación de salida termine (Framer Motion).
    await expect(closeCartBtn).toBeHidden({ timeout: 3000 });

    // 3. Ir a checkout
    await page.goto('/checkout');

    // Esperar hidratación del cart store (Zustand persist).
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });

    // 4. Form de envío
    await page.fill('input[name="email"]', 'comprador.test@amber.test');
    await page.fill('input[name="firstName"]', 'APRO');
    await page.fill('input[name="lastName"]', 'Tester');
    await page.fill('input[name="phone"]', '+56912345678');
    await page.fill('input[name="address"]', 'Av. Apoquindo 1234');

    // Region/comuna se cargan async desde /api/geo. Esperamos a que el select
    // se habilite (no esté disabled) antes de seleccionar la primera opcion
    // real (index 1, porque index 0 es "Seleccionar").
    const regionSelect = page.locator('select[name="region"]');
    await expect(regionSelect).toBeEnabled({ timeout: 10000 });
    await regionSelect.selectOption({ index: 1 });

    const citySelect = page.locator('select[name="city"]');
    await expect(citySelect).toBeEnabled({ timeout: 5000 });
    await citySelect.selectOption({ index: 1 });

    await page.fill('input[name="postalCode"]', '7550000');

    // 5. Avanzar a payment step. Submit el form via Enter en el último input —
     //    evita problemas de viewport con sticky CTAs y dispara la validación
     //    HTML5 + handler onSubmit normalmente.
    await page.locator('input[name="postalCode"]').press('Enter');
    // Verificamos que avanzamos viendo el heading del nuevo step.
    await expect(page.getByRole('heading', { name: /confirmar y pagar/i })).toBeVisible({
      timeout: 5000,
    });

    // 6. Click "Pagar con MercadoPago" → POST /api/orders → init_point → redirect
    const payButton = page.getByRole('button', { name: /pagar con mercadopago/i });
    await expect(payButton).toBeVisible({ timeout: 10000 });
    await payButton.scrollIntoViewIfNeeded();

    // Capturamos la respuesta del backend antes de la redirect.
    const ordersPromise = page.waitForResponse(
      (r) => r.url().includes('/api/orders') && r.request().method() === 'POST',
      { timeout: 15000 },
    );
    await payButton.click();

    const ordersRes = await ordersPromise;
    // Backend retorna 201 Created (POST /orders); ecommerce BFF lo proxea sin
    // remapeo. Aceptamos 200 o 201.
    expect([200, 201]).toContain(ordersRes.status());
    // No leemos el body: la redirect a MP descarga el response del Network
    // cache antes de que tengamos chance. La URL final lo valida.

    // 7. Verificar que el browser navega a MP. waitForURL tolera el dominio
    // sandbox tanto en .cl como en .com.
    await page.waitForURL(/mercadopago\.(cl|com)/, { timeout: 15000 });

    // No interactuamos con la UI de MP (login, tarjeta) — fuera de alcance.
    // Si hace falta smoke real, ver memory/reference_mp_sandbox_test_user.md.
  });
});
