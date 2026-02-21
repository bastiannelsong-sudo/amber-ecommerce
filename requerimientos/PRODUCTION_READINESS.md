# AMBER JOYAS — Análisis de Producción

**Fecha:** 2026-02-08 (actualizado 2026-02-09)
**Estado general:** ~85% listo para producción
**Objetivo:** E-commerce completo con checkout y pagos reales
**Dominio:** amberjoyeria.cl (hosting y dominio listos)

---

## BLOQUEANTES — No se puede salir sin esto

### 1. Integración de Pagos — MercadoPago
- El checkout actual **simula el pago** (delay de 2 segundos, no procesa nada)
- El paquete `mercadopago` ya está instalado en el backend
- El endpoint `POST /ecommerce/payments/webhook` ya existe pero con token placeholder `TU_ACCESS_TOKEN_DE_MERCADOPAGO`
- **Pendiente:**
  - [ ] Crear cuenta MercadoPago con credenciales de **producción**
  - [ ] Integrar SDK: Checkout → Crear preferencia MP → Redirigir usuario → Webhook confirma → Orden actualizada
  - [ ] Configurar `MP_ACCESS_TOKEN` en `.env` de producción
  - [ ] Probar flujo completo en sandbox antes de producción

### 2. Autenticación de usuarios e-commerce ✅ IMPLEMENTADO
- ~~`AuthModal.tsx` existe en el frontend pero no está conectado al backend~~
- ~~El backend solo tiene OAuth de MercadoLibre (para admin), no tiene registro/login de clientes~~
- **Implementado:**
  - [x] Módulo `ecommerce-auth` completo en backend (NestJS)
  - [x] Registro con email/password (bcrypt, salt 12)
  - [x] Login con email/password → JWT (access 15min + refresh 7 días)
  - [x] Google OAuth2 (verificación de id_token, popup sin redirección)
  - [x] Account linking automático (merge por email)
  - [x] Forgot password con email SMTP (link con token hasheado, 1hr expiry)
  - [x] Reset password con validación de token
  - [x] Refresh token automático en api-client (queue de requests en 401)
  - [x] Rate limiting por endpoint (login: 5/min, register: 3/min, forgot: 3/hr)
  - [x] AuthModal reescrito con 5 vistas (login, register, forgot, forgot-response, linked)
  - [x] Botón Google Sign-In, barra de fortaleza de password, shake animation
  - [x] Página `/reset-password` con validación de token
  - [x] Auth store con refresh token support
  - [x] Guards: JwtAuthGuard + OptionalAuthGuard (checkout invitado)
  - [x] Decorador @CurrentCustomer()
  - [x] Entidades: EcommerceCustomer (UUID, dual auth_providers) + CustomerAddress
  - [x] FK customer_id en ecommerce_orders (nullable para invitados)
  - [x] Migración 020 ejecutada en DB local
  - [x] Página `/perfil` adaptada a first_name/last_name
- **Pendiente menor:**
  - [ ] Configurar credenciales reales Google OAuth (`GOOGLE_CLIENT_ID`)
  - [ ] Configurar SMTP real (AWS SES configurado en .env)
  - [ ] Tab "Seguridad" en /perfil (vincular/desvincular Google, cambiar password)
  - [ ] Checkout con auth opcional (banner "iniciar sesión" + checkbox "crear cuenta")

### 3. Variables de entorno de producción
- [ ] `NEXT_PUBLIC_API_URL` → URL del backend en producción (actualmente `localhost:3000`)
- [ ] `NEXT_PUBLIC_SITE_URL` → `https://amberjoyeria.cl`
- [ ] `MP_ACCESS_TOKEN` → Credenciales reales de MercadoPago
- [ ] `DB_HOST`, `DB_PORT`, `DB_PASSWORD` → Credenciales de PostgreSQL de producción
- [ ] `REDIRECT_URI` de MercadoLibre → Verificar que apunte al dominio correcto
- [ ] CORS en backend → Agregar `https://amberjoyeria.cl` a origins permitidos
- [x] `JWT_SECRET` y `JWT_REFRESH_SECRET` configurados (dev, cambiar en prod)
- [x] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` placeholder en .env
- [x] `SMTP_HOST/PORT/USER/PASS/FROM` configurado para AWS SES
- [x] `ADMIN_API_KEY` configurado
- [x] `CONTACT_EMAIL` configurado

### 4. Base de datos en producción
- Backend usa PostgreSQL en `localhost:5433` — necesita instancia de producción
- 20 migraciones deben ejecutarse en orden en el servidor (001 a 020)
- **Verificar columnas sincronizadas** (lecciones aprendidas):
  - [ ] `products.price` — entity vs tabla
  - [ ] `products.images` — entity vs tabla
  - [ ] `secondary_skus.logistic_type` — entity vs tabla
  - [ ] `secondary_skus.variation_id` — entity vs tabla
- [ ] Ejecutar `\d products` y `\d secondary_skus` en psql para confirmar
- [x] Migración 020 (ecommerce_customers + customer_addresses) ejecutada en local

---

## IMPORTANTES — Deberían estar para el lanzamiento

### 5. Seguridad del backend ✅ PARCIALMENTE IMPLEMENTADO
- [ ] Instalar y configurar `helmet` (headers de seguridad en API)
- [x] ~~Instalar y configurar `@nestjs/throttler` (rate limiting)~~ — Instalado y configurado globalmente (ThrottlerGuard como APP_GUARD)
- [ ] Agregar Guards de autenticación en endpoints admin:
  - Crear/editar/eliminar productos
  - Crear/editar/eliminar colecciones
  - Sincronización de órdenes
  - Configuraciones mensuales
- [x] `ADMIN_API_KEY` configurado en .env para protección de endpoints admin

### 6. Imágenes de productos
- El catálogo tiene fallback a **dummy data** cuando la API falla (no debe pasar en prod)
- Las imágenes vienen de MercadoLibre (`http2.mlstatic.com`) — funciona pero no es ideal
- [ ] Verificar que todos los productos publicados tengan imágenes asignadas
- [ ] Considerar CDN propio o bucket S3 para imágenes de marca

### 7. Formulario de contacto ✅ IMPLEMENTADO
- ~~`/contacto` simula el envío (1 segundo de delay, no envía nada)~~
- [x] `ContactModule` creado en backend con entidad `ContactMessage`
- [x] Endpoint funcional para recibir mensajes
- [x] SMTP configurado con AWS SES
- [x] `CONTACT_EMAIL` configurado en .env

### 8. Reviews/Reseñas
- `ReviewForm.tsx` y `ReviewList.tsx` existen pero no están integrados al backend real
- [ ] Decidir si las reseñas van en el lanzamiento o post-lanzamiento
- [ ] Si van: conectar con endpoints `POST /ecommerce/reviews` y `GET /ecommerce/reviews/:productId`

---

## SEO — Estado actual y mejoras

### Ya implementado
- [x] Metadata con título, descripción y keywords en español (es_CL)
- [x] Open Graph y Twitter Cards configurados
- [x] Sitemap dinámico (`/sitemap.ts`) con productos y páginas estáticas
- [x] `robots.txt` con rutas privadas bloqueadas (`/carrito`, `/checkout`, `/perfil`, `/favoritos`)
- [x] Schema.org Organization con SearchAction
- [x] Headers de seguridad en Next.js (HSTS, X-Frame-Options, X-Content-Type-Options)
- [x] URLs amigables con slugs
- [x] Imágenes optimizadas con Next.js Image y `sizes` responsivos

### Pendiente
- [ ] **Schema.org Product** en páginas de producto (precio, disponibilidad, reviews → rich snippets en Google)
- [ ] **Schema.org BreadcrumbList** en páginas de producto y colección
- [ ] **Meta descriptions únicas** por producto y colección (actualmente solo la global)
- [ ] **Canonical URLs** explícitas en cada página
- [ ] **Google Search Console** — verificar propiedad del dominio
- [ ] **Google Analytics / GA4** — tracking de conversiones y comportamiento
- [x] ~~Verificar bundle size~~ — `next build` pasa sin errores

---

## MARKETING & PSICOLOGÍA — Principios ya implementados

### Ya aprovechas
- [x] **Escasez** (`ScarcityIndicator`) — "Quedan pocas unidades"
- [x] **Anclaje de precios** (`PriceAnchor`) — Precio original tachado vs. precio de oferta
- [x] **Prueba social** (`SocialProofBadge`, `ReviewList`) — Reseñas y ratings
- [x] **Confianza** (`TrustBadges`) — Badges de seguridad, garantía, envío
- [x] **Progreso** (`FreeShippingProgress`) — "Te faltan $X para envío gratis" (umbral $30.000)
- [x] **Recuperación** (`AbandonedCartModal`) — Modal para carritos abandonados
- [x] **Urgencia** (`PromoBanner`) — Banners promocionales con efecto shimmer
- [x] **Badges de producto** — nuevo, bestseller, exclusivo, limitado, oferta

### Mejoras post-lanzamiento
- [ ] Countdown timers para ofertas limitadas
- [ ] "X personas viendo este producto" (social proof en tiempo real)
- [ ] Email de carrito abandonado (requiere sistema de email)
- [ ] Programa de referidos
- [ ] Notificaciones de stock ("Avísame cuando vuelva")

---

## FUNCIONALIDADES — Estado actual

| Funcionalidad | Estado | Detalle |
|---------------|--------|---------|
| Checkout/Pago | Simulado | Falta integración MercadoPago real |
| Auth de clientes | ✅ Implementado | Registro, login, Google OAuth, forgot/reset password |
| Formulario contacto | ✅ Implementado | ContactModule + AWS SES |
| Perfil/Pedidos | Parcial | Perfil funcional, pedidos con datos mock |
| Reviews | Pendiente | Componentes listos, falta conectar API |
| Cupones | Backend listo | Falta verificar flujo end-to-end |
| Rate Limiting | ✅ Implementado | ThrottlerGuard global + por endpoint en auth |
| JWT Auth | ✅ Implementado | Access 15min + Refresh 7d + auto-refresh |
| Google OAuth | ✅ Implementado | Popup GSI + account linking |
| Reset Password | ✅ Implementado | Email SMTP + token hasheado + página frontend |

---

## INFRAESTRUCTURA DE DEPLOY

### Frontend (Next.js)
- [x] ~~Configurar build de producción: `pnpm build`~~ — Build pasa sin errores
- [x] ~~Verificar que el build pase sin errores~~ — Todas las rutas compilan
- [ ] Configurar variables de entorno en hosting (Vercel / VPS)
- [x] ~~Verificar `next.config.ts` — security headers activos~~
- [ ] SSL/HTTPS habilitado en dominio

### Backend (NestJS)
- [x] ~~Build de producción: `pnpm build`~~ — Build pasa sin errores
- [ ] Script de inicio: `node dist/main`
- [ ] PostgreSQL accesible desde el servidor
- [ ] Ejecutar migraciones en orden (001 a 020 + stock_validation_cache)
- [ ] Configurar process manager (PM2 o similar)
- [ ] SSL/HTTPS en API
- [ ] Logs de producción configurados

---

## CHECKLIST PRIORIZADO

| # | Tarea | Prioridad | Esfuerzo | Estado |
|---|-------|-----------|----------|--------|
| 1 | Configurar MercadoPago credenciales reales | BLOQUEANTE | Alto | [ ] |
| 2 | ~~Decidir auth: checkout invitado vs. registro~~ | ~~BLOQUEANTE~~ | ~~Medio~~ | [x] Ambos implementados |
| 3 | Variables de entorno producción (front + back) | BLOQUEANTE | Bajo | [ ] Parcial |
| 4 | PostgreSQL producción + migraciones | BLOQUEANTE | Medio | [ ] |
| 5 | CORS con dominio producción | BLOQUEANTE | Bajo | [ ] |
| 6 | ~~Helmet~~ + Rate Limiting en backend | Importante | Bajo | [~] Rate limiting ✅, Helmet pendiente |
| 7 | Guards en endpoints admin | Importante | Medio | [ ] ADMIN_API_KEY configurada |
| 8 | ~~Formulario de contacto funcional~~ | ~~Importante~~ | ~~Bajo~~ | [x] ContactModule implementado |
| 9 | Schema.org Product en páginas de producto | SEO | Bajo | [ ] |
| 10 | Google Search Console + Analytics | SEO | Bajo | [ ] |
| 11 | Meta descriptions por producto/colección | SEO | Bajo | [ ] |
| 12 | Verificar imágenes reales en productos | Contenido | Medio | [ ] |
| 13 | Probar flujo completo end-to-end | QA | Medio | [ ] |
| 14 | ~~`next build` + `nest build` sin errores~~ | ~~Deploy~~ | ~~Bajo~~ | [x] Ambos compilan |
| 15 | Conectar reviews con backend | Post-launch | Bajo | [ ] |
| 16 | Email carrito abandonado | Post-launch | Alto | [ ] |
| 17 | Credenciales reales Google OAuth | Config | Bajo | [ ] |
| 18 | Tab Seguridad en /perfil | UX | Medio | [ ] |
| 19 | Checkout con auth opcional | UX | Medio | [ ] |

---

## ARQUITECTURA ACTUAL

```
                    ┌─────────────────┐
                    │   amberjoyeria.cl │
                    │   (Next.js 16)   │
                    │   Puerto: 4200   │
                    └────────┬────────┘
                             │ API calls (JWT Bearer)
                             ▼
                    ┌─────────────────┐
                    │   API Backend    │
                    │   (NestJS 10)    │
                    │   Puerto: 3000   │
                    │   ThrottlerGuard │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL   │    │ MercadoLibre │    │ MercadoPago  │
│  Puerto: 5433 │    │   API        │    │   (Pagos)    │
│  DB: amber    │    │  (OAuth)     │    │  (Pendiente) │
└──────────────┘    └──────────────┘    └──────────────┘
         │                                       │
    ┌────┴────┐                            ┌─────┴─────┐
    ▼         ▼                            ▼           ▼
┌────────┐ ┌────────┐               ┌──────────┐ ┌─────────┐
│Google  │ │AWS SES │               │  Google   │ │ SMTP    │
│OAuth2  │ │(Email) │               │  GSI      │ │ Reset   │
│verify  │ │Contact │               │  Popup    │ │ Password│
└────────┘ └────────┘               └──────────┘ └─────────┘
```

**Backend:** NestJS + TypeORM, 16 controllers, 22 services, 25 entidades, JWT auth + ThrottlerGuard
**Frontend:** Next.js 16, React 19, Tailwind CSS 4, Zustand, 26+ páginas, 33 componentes
**Auth:** Dual (email/password + Google OAuth2), refresh tokens, account linking
**Categorías:** Sistema dual — `categories` (bodega) + `collections` (e-commerce, 3 niveles jerárquicos)
