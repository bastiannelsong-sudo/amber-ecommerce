import { test, expect } from '@playwright/test';

test.describe('Product Detail', () => {
  test('should load product detail page', async ({ page }) => {
    // Ir al catalogo primero y hacer click en un producto
    await page.goto('/catalogo');
    const firstProduct = page.locator('a[href*="/producto/"]').first();
    await firstProduct.waitFor({ timeout: 10000 });
    await firstProduct.click();

    // Verificar que estamos en la pagina de producto
    await expect(page).toHaveURL(/\/producto\//);
  });

  test('should show WhatsApp CTA on product page', async ({ page }) => {
    await page.goto('/catalogo');
    const firstProduct = page.locator('a[href*="/producto/"]').first();
    await firstProduct.waitFor({ timeout: 10000 });
    await firstProduct.click();

    // Buscar boton de WhatsApp
    const whatsappLink = page.locator('a[href*="wa.me"]').first();
    await expect(whatsappLink).toBeVisible({ timeout: 10000 });
  });
});
