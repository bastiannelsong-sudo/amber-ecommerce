import { test, expect } from '@playwright/test';

test.describe('Catalogo', () => {
  test('should load the catalog page', async ({ page }) => {
    await page.goto('/catalogo');
    await expect(page).toHaveTitle(/Catalogo|AMBER/i);
    await expect(page.locator('h1')).toContainText('Catalogo');
  });

  test('should display products', async ({ page }) => {
    await page.goto('/catalogo');
    // Esperar a que los productos carguen
    const products = page.locator('[data-testid="product-card"], .group');
    await expect(products.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have a working header', async ({ page, isMobile }) => {
    await page.goto('/catalogo');
    await expect(page.locator('header')).toBeVisible();
    if (isMobile) {
      // En mobile el link de catalogo esta oculto detras del menu hamburguesa
      await expect(page.locator('button[aria-label="Menu"]')).toBeVisible();
    } else {
      await expect(page.locator('nav a[href="/catalogo"]')).toBeVisible();
    }
  });
});
