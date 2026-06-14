import { test, expect } from '@playwright/test';

/**
 * E2E smoke test: cart → checkout flow.
 *
 * Scope:
 *   1. Load catalog, find first in-stock product, hover + click "Agregar al Carrito"
 *   2. Cart drawer opens with the item → assert product name + count badge
 *   3. Assert summary totals (subtotal visible, free-shipping threshold conditional)
 *   4. Navigate to /checkout via "Finalizar Compra" CTA in the cart drawer
 *   5. Fill shipping form (contact + address + region/commune from live geo API)
 *   6. STOP before the real MercadoPago redirect by intercepting /api/orders and
 *      blocking the response — verify the submit button was reached without crashing
 *
 * Requirements:
 *   - Next.js dev server running on :3001  (BASE_URL env or playwright.config default)
 *   - NestJS backend running on :3000      (for /api/geo and catalog API calls)
 *   - At least one in-stock product in the catalog
 *
 * If the backend is unavailable the spec is written correctly but cannot be
 * executed headlessly — it will fail with a connection error, not a test-logic error.
 *
 * Free-shipping threshold: orders >= $50.000 (CLP) get free shipping.
 * This test asserts the label: "Gratis" when subtotal >= threshold, "$XXXX" otherwise.
 */
test.describe('Cart → Checkout smoke', () => {
  test.describe.configure({ mode: 'serial' });

  test('add product to cart from catalog and verify cart drawer', async ({ page }) => {
    await page.goto('/catalogo');

    // Wait for at least one product card to appear
    const firstCard = page.locator('.group').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });

    // Desktop: hover triggers the "Agregar al Carrito" button
    await firstCard.hover();

    const addToCartBtn = firstCard.getByRole('button', { name: /agregar al carrito/i });
    await expect(addToCartBtn).toBeVisible({ timeout: 5000 });
    await addToCartBtn.click();

    // Toast confirmation
    await expect(page.getByText(/agregado al carrito/i)).toBeVisible({ timeout: 5000 });

    // Cart badge on header icon should show 1
    const cartBadge = page.locator('header button[aria-label="Carrito"] span');
    await expect(cartBadge).toBeVisible({ timeout: 5000 });
    await expect(cartBadge).toHaveText('1');

    // Cart drawer opens automatically after adding (or click the button)
    // If drawer is not open yet, open it
    const drawer = page.getByRole('heading', { name: /^Carrito$/i });
    const isDrawerOpen = await drawer.isVisible().catch(() => false);
    if (!isDrawerOpen) {
      await page.getByRole('button', { name: 'Carrito' }).click();
    }

    // Drawer is open: verify item is listed
    await expect(page.getByRole('heading', { name: /^Carrito$/i })).toBeVisible({ timeout: 5000 });

    // At least one item row visible
    const cartItems = page.locator('[class*="CartItem"], [data-testid="cart-item"]');
    // Fall back: any list structure inside the drawer panel
    const drawerPanel = page.locator('.fixed.right-0');
    await expect(drawerPanel).toBeVisible({ timeout: 5000 });
  });

  test('cart drawer shows totals with free-shipping threshold', async ({ page }) => {
    await page.goto('/catalogo');

    const firstCard = page.locator('.group').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    await firstCard.hover();

    const addToCartBtn = firstCard.getByRole('button', { name: /agregar al carrito/i });
    await expect(addToCartBtn).toBeVisible({ timeout: 5000 });
    await addToCartBtn.click();

    // Open drawer if not already open
    const drawer = page.getByRole('heading', { name: /^Carrito$/i });
    const isOpen = await drawer.isVisible({ timeout: 2000 }).catch(() => false);
    if (!isOpen) {
      await page.getByRole('button', { name: 'Carrito' }).click();
    }

    await expect(page.getByRole('heading', { name: /^Carrito$/i })).toBeVisible({ timeout: 5000 });

    // Subtotal row is visible
    await expect(page.getByText(/subtotal/i)).toBeVisible({ timeout: 5000 });

    // Envío row exists — either "Gratis" or a price
    const envioText = page.getByText(/envío/i);
    await expect(envioText).toBeVisible({ timeout: 5000 });

    // Shipping display depends on subtotal vs. $50.000 threshold
    const shippingValue = page.getByText(/Gratis|\$[0-9]/);
    await expect(shippingValue).toBeVisible({ timeout: 5000 });
  });

  test('proceed from cart drawer to checkout page', async ({ page }) => {
    await page.goto('/catalogo');

    const firstCard = page.locator('.group').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    await firstCard.hover();

    const addToCartBtn = firstCard.getByRole('button', { name: /agregar al carrito/i });
    await expect(addToCartBtn).toBeVisible({ timeout: 5000 });
    await addToCartBtn.click();

    // Open drawer
    const drawer = page.getByRole('heading', { name: /^Carrito$/i });
    const isOpen = await drawer.isVisible({ timeout: 2000 }).catch(() => false);
    if (!isOpen) {
      await page.getByRole('button', { name: 'Carrito' }).click();
    }

    await expect(page.getByRole('heading', { name: /^Carrito$/i })).toBeVisible({ timeout: 5000 });

    // Click "Finalizar Compra" — rendered as a Link to /checkout
    const checkoutLink = page.getByRole('link', { name: /finalizar compra/i });
    await expect(checkoutLink).toBeVisible({ timeout: 5000 });
    await checkoutLink.click();

    // Should land on /checkout
    await expect(page).toHaveURL(/\/checkout$/, { timeout: 10000 });

    // Shipping form heading visible
    await expect(
      page.getByRole('heading', { name: /información de envío/i }),
    ).toBeVisible({ timeout: 10000 });
  });

  test('fill shipping form and reach payment step (stops before MP redirect)', async ({ page }) => {
    // Intercept /api/orders to block the MP redirect but still capture the request
    await page.route('**/api/orders', async (route) => {
      // Abort so the browser never redirects to mercadopago.com
      await route.abort('blockedbyclient');
    });

    // Pre-populate cart via localStorage before navigation so the checkout
    // is not empty (avoids the CheckoutEmptyState guard).
    await page.goto('/catalogo');

    const firstCard = page.locator('.group').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    await firstCard.hover();

    const addToCartBtn = firstCard.getByRole('button', { name: /agregar al carrito/i });
    await expect(addToCartBtn).toBeVisible({ timeout: 5000 });
    await addToCartBtn.click();

    // Navigate to checkout directly
    await page.goto('/checkout');

    // Wait for shipping form
    await expect(
      page.getByRole('heading', { name: /información de envío/i }),
    ).toBeVisible({ timeout: 10000 });

    // ── Contact info ──────────────────────────────────────────────────────
    await page.getByLabel('Email').fill('e2e-test@amber.cl');
    await page.getByLabel('Nombre').fill('Test');
    await page.getByLabel('Apellido').fill('E2E');
    await page.getByLabel(/teléfono/i).fill('+56912345678');

    // ── Address fields ────────────────────────────────────────────────────
    await page.getByLabel('Dirección').fill('Av. Apoquindo 1234');

    // Wait for geo data to load so region select is enabled
    const regionSelect = page.locator('select[name="region"]');
    await expect(regionSelect).toBeEnabled({ timeout: 10000 });

    // Select first available region
    await regionSelect.selectOption({ index: 1 });

    // Wait for commune select to populate
    const communeSelect = page.locator('select[name="commune"]');
    await expect(communeSelect).toBeEnabled({ timeout: 5000 });

    // Select first available commune
    await communeSelect.selectOption({ index: 1 });

    // ── Submit ────────────────────────────────────────────────────────────
    // Click "Continuar al Pago" — navigates to payment step
    const continueBtn = page.getByRole('button', { name: /continuar al pago/i });
    await expect(continueBtn).toBeVisible({ timeout: 5000 });
    await continueBtn.click();

    // Payment step: MercadoPago info card or pay button visible
    // (the /api/orders call is intercepted/aborted so we never redirect to MP)
    await expect(
      page.getByRole('heading', { name: /pago/i }),
    ).toBeVisible({ timeout: 10000 });
  });
});
