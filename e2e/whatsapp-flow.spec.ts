import { test, expect } from '@playwright/test';

test.describe('WhatsApp Flow', () => {
  test('should have floating WhatsApp button', async ({ page }) => {
    await page.goto('/');
    // El boton aparece despues de 1.5s
    const whatsappFloat = page.locator('a[href*="wa.me"]').first();
    await expect(whatsappFloat).toBeVisible({ timeout: 5000 });
  });

  test('WhatsApp links should have correct format', async ({ page }) => {
    await page.goto('/');
    const whatsappLinks = page.locator('a[href*="wa.me"]');
    const count = await whatsappLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const href = await whatsappLinks.nth(i).getAttribute('href');
      expect(href).toMatch(/^https:\/\/wa\.me\/569\d{8}/);
    }
  });

  test('WhatsApp link in header should open in new tab', async ({ page }) => {
    await page.goto('/catalogo');
    const headerWhatsApp = page.locator('header a[href*="wa.me"]');
    await expect(headerWhatsApp).toHaveAttribute('target', '_blank');
    await expect(headerWhatsApp).toHaveAttribute('rel', /noopener/);
  });
});
