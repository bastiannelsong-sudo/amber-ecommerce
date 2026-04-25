# 01 — Infraestructura y DevOps

> Prioridad: CRÍTICA | Estado actual: 40%

## Lo que existe hoy

- Proyecto Next.js 16 con `next build` / `next start` funcional
- Dockerfile multi-stage ya en repo
- `.env.example` con variables documentadas
- Arquitectura BFF: backend nunca expuesto al cliente (ver CLAUDE.md)

---

## Requerimientos

### 1.1 Variables de entorno

**Estado actual:** definidas en `.env.example` y `.env.local`.

| Variable | Scope | Propósito |
|----------|-------|-----------|
| `INTERNAL_API_URL` | **server-only** | URL del backend NestJS (privado en prod, subnet VPC AWS) |
| `NEXT_PUBLIC_SITE_URL` | public | URL pública del ecommerce (OG, canonical, sitemap) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | public | Google OAuth client ID (es un identifier público por diseño) |
| `SESSION_SECRET` | **server-only** | Firma HMAC de la cookie httpOnly `amber_session` (≥32 chars) |

**Falta aún:**

| Variable | Propósito |
|----------|-----------|
| `NEXT_PUBLIC_GA_ID` | Google Analytics tracking ID |
| `SENTRY_DSN` | Monitoreo de errores (server-side) |
| `NEXT_PUBLIC_SENTRY_DSN` | Monitoreo de errores (client-side) |
| `MERCADOPAGO_WEBHOOK_SECRET` | Verificación de webhooks de pago |

**Acción:**
- [x] Crear archivo `.env.example` con todas las variables documentadas
- [ ] Configurar variables en la plataforma de deploy (ECS task env)
- [x] Verificar que no haya secrets expuestos con `NEXT_PUBLIC_`

**Regla crítica:** la URL del backend (`INTERNAL_API_URL`) nunca debe
prefijarse con `NEXT_PUBLIC_` porque quedaría en el bundle del cliente.
Ver [CLAUDE.md](../../CLAUDE.md) → sección "REGLA ARQUITECTÓNICA CRÍTICA — API Consumption".

---

### 1.2 CI/CD Pipeline

**Estado:** No existe

**Requerimiento mínimo — GitHub Actions:**

```
on push/PR → main:
  1. Install dependencies
  2. Lint (eslint)
  3. Type check (tsc --noEmit)
  4. Unit tests (vitest)
  5. Build (next build)
  6. Deploy preview (en PRs)
  7. Deploy producción (en merge a main)
```

**Acciones:**
- [ ] Crear `.github/workflows/ci.yml` con lint + typecheck + build
- [ ] Crear `.github/workflows/deploy.yml` para deploy automático
- [ ] Configurar branch protection en `main` (requiere CI verde)

---

### 1.3 Deployment

**Estado:** No configurado

**Opción recomendada: Vercel** (native Next.js support)

**Acciones:**
- [ ] Conectar repositorio a Vercel
- [ ] Configurar dominio personalizado
- [ ] Configurar SSL (automático en Vercel)
- [ ] Configurar redirects y headers de seguridad en `next.config.ts`
- [ ] Verificar que el build de producción funciona sin errores

**Headers de seguridad a agregar en `next.config.ts`:**
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: (configurar según necesidades)
```

---

### 1.4 Dominio y DNS

**Acciones:**
- [ ] Registrar/configurar dominio de producción
- [ ] Configurar DNS apuntando a Vercel
- [ ] Verificar SSL funcional
- [ ] Configurar redirect www → non-www (o viceversa)
- [ ] Configurar email transaccional (confirmaciones de orden)

---

## Criterio de completitud

- CI corre en cada PR y bloquea merge si falla
- Deploy automático a producción en merge a main
- Variables de entorno documentadas y configuradas
- HTTPS funcional con dominio propio
- Headers de seguridad configurados
