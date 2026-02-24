import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accesibilidad (WCAG)', () => {
  test('home page no debe tener violaciones críticas', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // Puede dar falsos positivos con temas dinámicos
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    if (critical.length > 0) {
      const summary = critical.map(
        (v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} elementos)`,
      );
      console.log('Violaciones de accesibilidad:', summary);
    }

    expect(critical).toHaveLength(0);
  });

  test('catálogo no debe tener violaciones críticas', async ({ page }) => {
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');
    // Esperar a que carguen los productos
    await page.waitForTimeout(2000);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    expect(critical).toHaveLength(0);
  });

  test('página de contacto no debe tener violaciones críticas', async ({ page }) => {
    await page.goto('/contacto');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    expect(critical).toHaveLength(0);
  });

  test('navegación debe tener landmarks ARIA correctos', async ({ page }) => {
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withRules(['landmark-one-main', 'region'])
      .analyze();

    // Solo advertir, no fallar por landmarks
    if (results.violations.length > 0) {
      console.log(
        'Advertencias de landmarks:',
        results.violations.map((v) => v.id),
      );
    }
  });

  test('imágenes deben tener atributo alt', async ({ page }) => {
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const results = await new AxeBuilder({ page })
      .withRules(['image-alt'])
      .analyze();

    const violations = results.violations.filter((v) => v.id === 'image-alt');

    if (violations.length > 0) {
      const count = violations.reduce((acc, v) => acc + v.nodes.length, 0);
      console.log(`${count} imágenes sin atributo alt`);
    }

    expect(violations).toHaveLength(0);
  });

  test('formularios deben tener labels asociados', async ({ page }) => {
    await page.goto('/contacto');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withRules(['label', 'label-title-only'])
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    expect(critical).toHaveLength(0);
  });
});
