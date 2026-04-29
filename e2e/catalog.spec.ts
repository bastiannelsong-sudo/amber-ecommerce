import { test, expect } from '@playwright/test';

test.describe('Catalogo', () => {
  test('should load the catalog page', async ({ page }) => {
    await page.goto('/catalogo');
    await expect(page).toHaveTitle(/Catalogo|AMBER/i);
    // Acepta tanto "Catalogo" como "Catálogo" (con acento) y variantes ("Catálogo Completo").
    await expect(page.locator('h1')).toContainText(/Cat[aá]logo/);
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
      // El nav del header tiene el primer link "Catalogo"; otros links a /catalogo
      // existen en footers/CTAs de la misma página, por eso usamos .first().
      await expect(page.locator('header nav a[href="/catalogo"]').first()).toBeVisible();
    }
  });
});
