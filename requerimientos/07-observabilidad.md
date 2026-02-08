# 07 — Observabilidad

> Prioridad: MEDIA | Estado actual: 0%

## Lo que existe hoy

- Sin monitoreo de errores
- Sin analytics
- Sin logging estructurado
- `console.log` para debugging en desarrollo

---

## Requerimientos

### 7.1 Monitoreo de errores

**Herramienta recomendada:** Sentry (free tier disponible)

**Acciones:**
- [ ] Instalar `@sentry/nextjs`
- [ ] Configurar Sentry para client y server
- [ ] Configurar source maps para stack traces legibles
- [ ] Agregar contexto de usuario a los errores (user ID, email)
- [ ] Configurar alertas por email/Slack para errores nuevos
- [ ] Crear `instrumentation.ts` para inicialización server-side

---

### 7.2 Analytics

**Herramienta recomendada:** Google Analytics 4 o Plausible (privacy-friendly)

**Acciones:**
- [ ] Instalar y configurar analytics
- [ ] Respetar consentimiento de cookies (no trackear sin consentimiento)
- [ ] Configurar eventos personalizados:
  - `view_item` — Vista de producto
  - `add_to_cart` — Agregar al carrito
  - `begin_checkout` — Iniciar checkout
  - `purchase` — Compra completada
  - `search` — Búsqueda de productos
  - `add_to_wishlist` — Agregar a favoritos
  - `apply_coupon` — Usar cupón
- [ ] Configurar conversión de compra como objetivo principal
- [ ] Configurar funnel: catálogo → producto → carrito → checkout → pago

---

### 7.3 Logging

**Acciones:**
- [ ] Eliminar todos los `console.log` de desarrollo antes de producción
- [ ] Implementar logging condicional (solo en development)
- [ ] Loguear errores de API en Sentry (no en consola)
- [ ] Loguear eventos de pago críticos (orden creada, pago iniciado, pago confirmado)

---

### 7.4 Uptime y performance

**Acciones:**
- [ ] Configurar monitor de uptime (UptimeRobot free tier o Better Uptime)
- [ ] Monitorear endpoints críticos:
  - Home page (200)
  - API de productos (200)
  - API de checkout (disponibilidad)
- [ ] Configurar alerta si el sitio cae (email + Slack)
- [ ] Revisar Web Vitals en producción via Vercel Analytics o CrUX

---

### 7.5 Dashboard de negocio

**Evaluación:** Puede ser fase 2

**Acciones (post-lanzamiento):**
- [ ] Dashboard con métricas clave:
  - Ventas diarias/semanales
  - Productos más vistos
  - Tasa de conversión del funnel
  - Tasa de abandono de carrito
  - Cupones más usados
- [ ] Puede implementarse con Google Analytics o herramienta dedicada

---

## Criterio de completitud

- Sentry capturando errores de client y server
- Analytics trackeando eventos de ecommerce
- Funnel de conversión configurado
- Monitor de uptime activo con alertas
- Sin `console.log` en producción
