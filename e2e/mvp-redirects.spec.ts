import { test, expect } from '@playwright/test';

test.describe('MVP Redirects', () => {
  const disabledRoutes = [
    '/checkout',
    '/carrito',
    '/perfil',
    '/reset-password',
    '/favoritos',
  ];

  for (const route of disabledRoutes) {
    test(`${route} should redirect to /catalogo`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/catalogo/);
    });
  }

  test('redirect should include mvp=1 param', async ({ page }) => {
    // Interceptar la respuesta de redirect antes de que el cliente limpie el param
    const response = await page.goto('/checkout', { waitUntil: 'commit' });
    // El middleware de Next.js redirige a /catalogo?mvp=1
    expect(response?.url()).toContain('mvp=1');
  });
});
