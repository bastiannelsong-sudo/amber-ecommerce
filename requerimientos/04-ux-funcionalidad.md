# 04 — UX y Funcionalidad

> Prioridad: ALTA | Estado actual: Variable por feature

## Lo que existe hoy

- Flujo completo: home → catálogo → producto → carrito → checkout → confirmación
- Carrito persistente con drawer lateral
- Wishlist con persistencia
- Auth modal (login/registro/recuperación)
- Búsqueda de productos
- Filtros por categoría, precio, stock
- Quick view, zoom, lightbox de imágenes
- Guía de tallas
- Comparador de productos
- Componentes de marketing (scarcity, social proof, trust badges, etc.)

---

## Requerimientos por funcionalidad

### 4.1 Flujo de compra

**Problemas detectados:**
- No hay validación de stock en tiempo real al momento del checkout
- No hay confirmación de email post-compra (depende del backend)
- El resultado de pago confía en el redirect, no en el webhook

**Acciones:**
- [ ] Validar disponibilidad de stock antes de crear la orden
- [ ] Mostrar mensaje claro si un producto se agotó durante la compra
- [ ] Implementar página de resultado que consulte estado real de la orden al backend
- [ ] Agregar email de confirmación de orden (requiere backend + servicio de email)
- [ ] Limpiar carrito solo después de confirmar pago exitoso

---

### 4.2 Gestión de errores en UI

**Estado:** Sin Error Boundaries

**Acciones:**
- [ ] Agregar `error.tsx` en rutas principales (`/catalogo`, `/producto/[id]`, `/checkout`)
- [ ] Agregar `loading.tsx` en rutas principales para Suspense
- [ ] Mostrar estados vacíos claros (carrito vacío, sin resultados de búsqueda, sin favoritos)
- [ ] Manejar errores de red con retry y mensaje amigable
- [ ] Agregar feedback visual cuando una acción falla (agregar al carrito, aplicar cupón)

---

### 4.3 Responsive y mobile

**Estado:** Diseño mobile-first con Tailwind, pero sin verificación exhaustiva

**Acciones:**
- [ ] Testar todas las páginas en viewport 320px, 375px, 768px, 1024px, 1440px
- [ ] Verificar que modales no se desbordan en mobile
- [ ] Verificar que el checkout es usable en mobile
- [ ] Verificar touch targets mínimos de 44x44px
- [ ] Verificar que el menú hamburguesa funciona correctamente
- [ ] Testar en iOS Safari y Android Chrome (comportamientos específicos)

---

### 4.4 Notificaciones y feedback

**Estado:** React Hot Toast implementado

**Acciones:**
- [ ] Verificar que toda acción importante tiene feedback:
  - Producto agregado al carrito ✓
  - Producto agregado a favoritos
  - Cupón aplicado / rechazado
  - Error de red
  - Sesión expirada
- [ ] Agregar confirmación antes de acciones destructivas (vaciar carrito, eliminar cuenta)

---

### 4.5 Páginas incompletas

**Estado:** Algunas rutas preparadas pero sin contenido

**Acciones:**
- [ ] Completar `/envios` — Página de información de envíos (tiempos, costos, zonas)
- [ ] Completar `/novedades` — Página de novedades / nuevos productos
- [ ] Revisar `/lookbook` — Verificar que tiene contenido real (no solo placeholder)
- [ ] Revisar `/gift-card` — Verificar flujo completo de compra de gift card

---

### 4.6 Internacionalización

**Estado:** Texto en español hardcodeado en componentes

**Evaluación:**
- Si solo se vende en Chile/un mercado hispanohablante: no es necesario
- Si se planea expandir: considerar `next-intl` o similar

**Acción:**
- [ ] Decidir si i18n es necesario para el lanzamiento
- [ ] Si sí: extraer strings a archivos de traducción

---

## Criterio de completitud

- Flujo de compra completo testado end-to-end sin errores
- Todas las páginas tienen estados de error, loading y vacío
- Mobile usable sin problemas en los 5 viewports principales
- Toda acción del usuario tiene feedback visual
- No hay páginas stub o placeholder
