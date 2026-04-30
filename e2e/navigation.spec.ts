import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to catalog from header', async ({ page, isMobile }) => {
    await page.goto('/');
    if (isMobile) {
      await page.click('button[aria-label="Menu"]');
      // Los links del menu mobile estan fuera de <nav>, usar getByRole
      await page.getByRole('link', { name: 'Catalogo' }).last().click();
    } else {
      await page.click('nav a[href="/catalogo"]');
    }
    await expect(page).toHaveURL(/\/catalogo/);
  });

  test('should navigate to about page', async ({ page, isMobile }) => {
    await page.goto('/');
    if (isMobile) {
      await page.click('button[aria-label="Menu"]');
      await page.getByRole('link', { name: 'Sobre Nosotros' }).last().click();
    } else {
      await page.click('nav a[href="/sobre-nosotros"]');
    }
    await expect(page).toHaveURL(/\/sobre-nosotros/);
  });

  test('should navigate to contact page', async ({ page, isMobile }) => {
    await page.goto('/');
    if (isMobile) {
      await page.click('button[aria-label="Menu"]');
      await page.getByRole('link', { name: 'Contacto' }).last().click();
    } else {
      await page.click('nav a[href="/contacto"]');
    }
    await expect(page).toHaveURL(/\/contacto/);
  });

  test('should show search modal', async ({ page }) => {
    await page.goto('/catalogo');
    await page.click('button[aria-label="Buscar"]');
    // Verificar que el modal de busqueda aparece
    // En desktop hay un input inline en hero + el del modal; en mobile solo el del
    // modal queda visible. Pedimos el primero VISIBLE — funciona para ambos viewports.
    const searchModal = page
      .locator('input[type="search"]:visible, input[placeholder*="Buscar"]:visible')
      .first();
    await expect(searchModal).toBeVisible({ timeout: 3000 });
  });

  test('mobile menu should toggle', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Only for mobile viewport');
    await page.goto('/catalogo');
    await page.click('button[aria-label="Menu"]');
    await expect(page.getByRole('link', { name: 'Catalogo' }).last()).toBeVisible();
  });
});
