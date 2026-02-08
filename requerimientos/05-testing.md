# 05 — Testing y Calidad

> Prioridad: ALTA | Estado actual: 0%

## Lo que existe hoy

- Sin tests de ningún tipo
- Sin framework de testing instalado
- Sin scripts de test en package.json
- ESLint configurado (único check de calidad)

---

## Requerimientos

### 5.1 Setup de testing

**Acciones:**
- [ ] Instalar Vitest + React Testing Library + jsdom
- [ ] Configurar `vitest.config.ts`
- [ ] Agregar script `"test"` y `"test:coverage"` en `package.json`
- [ ] Configurar coverage mínimo (objetivo: 60% en componentes críticos)

---

### 5.2 Tests unitarios — Stores (prioridad máxima)

**Razón:** Los stores manejan la lógica de negocio del carrito, auth y wishlist

**Acciones:**
- [ ] `cart.store.test.ts` — Agregar/eliminar items, calcular totales, persistencia
- [ ] `auth.store.test.ts` — Login, logout, persistencia de token
- [ ] `wishlist.store.test.ts` — Toggle items, persistencia

---

### 5.3 Tests unitarios — Services

**Acciones:**
- [ ] `products.service.test.ts` — Fetch productos, fallback a dummy data, filtros
- [ ] `ecommerce.service.test.ts` — Crear orden, validar cupón, fetch reviews

---

### 5.4 Tests de componentes (prioridad alta)

**Componentes críticos a testar:**

- [ ] `Header` — Renderiza, muestra contador de carrito, abre auth modal
- [ ] `ProductCard` — Renderiza producto, agrega al carrito, agrega a favoritos
- [ ] `CartDrawer` — Muestra items, actualiza cantidad, calcula total
- [ ] `AuthModal` — Cambia entre login/registro, valida formulario
- [ ] `FilterSidebar` — Aplica filtros correctamente
- [ ] `CouponInput` — Valida cupón, muestra descuento
- [ ] `CheckoutProgressBar` — Muestra paso actual correctamente

---

### 5.5 Tests E2E (prioridad alta)

**Framework recomendado:** Playwright

**Acciones:**
- [ ] Instalar y configurar Playwright
- [ ] Flujo crítico: Navegar catálogo → ver producto → agregar al carrito → checkout
- [ ] Flujo de búsqueda: Buscar producto → ver resultados → clic en producto
- [ ] Flujo de auth: Registrar → login → ver perfil
- [ ] Flujo de filtros: Aplicar filtros → verificar resultados
- [ ] Flujo de wishlist: Agregar favorito → ver en /favoritos → eliminar

---

### 5.6 Type checking

**Estado:** TypeScript strict habilitado

**Acciones:**
- [ ] Agregar script `"typecheck": "tsc --noEmit"` en `package.json`
- [ ] Ejecutar y corregir errores de tipos pendientes
- [ ] Incluir typecheck en CI pipeline

---

## Criterio de completitud

- Vitest configurado y corriendo
- Stores con coverage > 80%
- Componentes críticos con tests de renderizado
- Al menos 1 flujo E2E completo (compra)
- TypeScript sin errores
- CI ejecuta lint + typecheck + tests en cada PR
