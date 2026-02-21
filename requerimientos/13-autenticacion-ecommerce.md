# 13. Autenticación E-commerce — Arquitectura Completa

**Fecha:** 2026-02-08
**Estado:** Aprobado para implementación
**Alcance:** Registro/Login local + Google OAuth2 + Recuperación de contraseña + Account linking + Checkout invitado

---

## 1. Modelo de datos

### Tabla `ecommerce_customers`

| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| id | UUID (PK) | NO | gen_random_uuid() |
| email | VARCHAR(255) UNIQUE | NO | Ancla única de identidad |
| password_hash | VARCHAR(255) | SÍ | NULL si solo usa Google |
| google_id | VARCHAR(255) | SÍ | NULL si solo usa local |
| auth_providers | VARCHAR[] | NO | `['local']`, `['google']`, `['local','google']` |
| first_name | VARCHAR(100) | NO | |
| last_name | VARCHAR(100) | NO | |
| phone | VARCHAR(20) | SÍ | |
| is_verified | BOOLEAN | NO | DEFAULT false |
| reset_token | VARCHAR(255) | SÍ | Token hasheado para reset password |
| reset_token_exp | TIMESTAMP | SÍ | Expiración del reset token (1 hora) |
| password_changed_at | TIMESTAMP | SÍ | Para invalidar JWTs anteriores |
| refresh_token_hash | VARCHAR(255) | SÍ | Hash del refresh token activo |
| created_at | TIMESTAMP | NO | DEFAULT NOW() |
| updated_at | TIMESTAMP | NO | DEFAULT NOW() |

### Tabla `customer_addresses`

| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| id | UUID (PK) | NO | gen_random_uuid() |
| customer_id | UUID (FK) | NO | REFERENCES ecommerce_customers(id) ON DELETE CASCADE |
| label | VARCHAR(50) | NO | DEFAULT 'Casa' (Casa, Oficina, Otro) |
| street | VARCHAR(255) | NO | |
| apartment | VARCHAR(100) | SÍ | |
| city | VARCHAR(100) | NO | |
| region | VARCHAR(100) | NO | |
| postal_code | VARCHAR(20) | SÍ | |
| is_default | BOOLEAN | NO | DEFAULT false |
| created_at | TIMESTAMP | NO | DEFAULT NOW() |

### Modificación a tabla existente

```sql
ALTER TABLE ecommerce_orders
    ADD COLUMN customer_id UUID REFERENCES ecommerce_customers(id) ON DELETE SET NULL;
```

Nullable para mantener compatibilidad con checkout invitado.

### Relaciones

```
ecommerce_customers
    ├── 1:N → customer_addresses
    ├── 1:N → ecommerce_orders (FK nullable)
    └── 1:N → reviews (match por customer_email, sin FK)
```

---

## 2. Migración SQL

**Archivo:** `migrations/020_create_ecommerce_customers.sql`

```sql
CREATE TABLE ecommerce_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255),
    auth_providers VARCHAR[] NOT NULL DEFAULT '{}',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT false,
    reset_token VARCHAR(255),
    reset_token_exp TIMESTAMP,
    password_changed_at TIMESTAMP,
    refresh_token_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON ecommerce_customers(email);
CREATE INDEX idx_customers_google_id ON ecommerce_customers(google_id);

CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES ecommerce_customers(id) ON DELETE CASCADE,
    label VARCHAR(50) DEFAULT 'Casa',
    street VARCHAR(255) NOT NULL,
    apartment VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_addresses_customer ON customer_addresses(customer_id);

ALTER TABLE ecommerce_orders
    ADD COLUMN customer_id UUID REFERENCES ecommerce_customers(id) ON DELETE SET NULL;

CREATE INDEX idx_orders_customer ON ecommerce_orders(customer_id);
```

---

## 3. Backend — Estructura del módulo

```
src/ecommerce-auth/
├── ecommerce-auth.module.ts
├── ecommerce-auth.controller.ts
├── ecommerce-auth.service.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── google.strategy.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── optional-auth.guard.ts
├── decorators/
│   ├── current-customer.decorator.ts
│   └── public.decorator.ts
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   ├── forgot-password.dto.ts
│   ├── reset-password.dto.ts
│   └── update-profile.dto.ts
└── entities/
    ├── ecommerce-customer.entity.ts
    └── customer-address.entity.ts
```

Módulo separado del `auth/` existente (MercadoLibre admin) siguiendo principio `arch-feature-modules`.

---

## 4. Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/ecommerce-auth/register` | No | Registro con email/password |
| POST | `/ecommerce-auth/login` | No | Login → JWT (access + refresh) |
| POST | `/ecommerce-auth/google` | No | Login/registro con Google id_token |
| POST | `/ecommerce-auth/forgot-password` | No | Enviar email de reset |
| POST | `/ecommerce-auth/reset-password` | No | Cambiar password con token |
| POST | `/ecommerce-auth/refresh` | No | Renovar access token con refresh token |
| GET | `/ecommerce-auth/profile` | Sí | Ver perfil del cliente |
| PUT | `/ecommerce-auth/profile` | Sí | Editar perfil |
| POST | `/ecommerce-auth/link-google` | Sí | Vincular cuenta Google |
| POST | `/ecommerce-auth/create-password` | Sí | Crear password (usuario Google-only) |

---

## 5. JWT Strategy

```
Access Token:   15 minutos
Refresh Token:  7 días (hasheado en DB)
Payload:        { sub: customer_id, email: customer_email }
Secreto:        JWT_SECRET y JWT_REFRESH_SECRET en .env
```

Siguiendo best practice `security-auth-jwt`:
- Tokens de corta vida + refresh
- Solo datos mínimos en payload (nunca password)
- Validar que el usuario existe y está activo en `validate()`
- Invalidar tokens emitidos antes de `password_changed_at`

---

## 6. Flujos de autenticación

### 6.1 Registro local

```
1. Validar DTO (email, password min 8 chars, first_name, last_name)
2. Verificar email no existe en DB
3. Hash password con bcrypt (salt rounds: 12)
4. Crear EcommerceCustomer con auth_providers: ['local']
5. Generar access_token (15min) + refresh_token (7 días)
6. Guardar hash del refresh_token en DB
7. Retornar { customer, access_token, refresh_token }
```

### 6.2 Login local

```
1. Buscar customer por email
2. Si no existe → 401 "Credenciales inválidas"
3. Si existe pero NO tiene 'local' en auth_providers →
   400 "Esta cuenta usa Google. Iniciá sesión con Google
   o creá una contraseña desde tu perfil."
4. Comparar password con bcrypt
5. Si no match → 401 "Credenciales inválidas"
6. Generar tokens, retornar
```

### 6.3 Google OAuth (popup, sin redirección)

```
1. Frontend: Usuario clickea "Continuar con Google"
2. Frontend: google.accounts.id.initialize() → popup de Google
3. Frontend: Google devuelve credential (id_token JWT)
4. Frontend: POST /ecommerce-auth/google { id_token }
5. Backend: Verificar id_token con Google OAuth2Client
6. Backend: Extraer email, google_id, given_name, family_name
7. Backend: Buscar customer por email:
   a. No existe → Crear con auth_providers: ['google'], google_id seteado
   b. Existe sin Google → MERGE: agregar google_id + 'google' a auth_providers
   c. Existe con Google → Login directo
8. Generar tokens, retornar { customer, access_token, refresh_token, is_new_account, was_linked }
```

### 6.4 Forgot password

```
1. Recibir email en DTO
2. Rate limiting: máximo 3 requests por hora por email
3. Buscar customer por email:
   a. No existe → Responder igual (no revelar existencia)
   b. Solo Google, sin 'local' en providers →
      Retornar { provider: 'google', message: "Tu cuenta usa Google" }
   c. Tiene 'local' → Generar reset_token (UUID v4),
      guardar bcrypt hash + expiración (1 hora) en DB
4. Enviar email con link: https://amberjoyeria.cl/reset-password?token=XXX
5. Responder { sent: true } (genérico para seguridad)
```

### 6.5 Reset password

```
1. Recibir { token, new_password }
2. Buscar customer con reset_token no expirado
3. Verificar token con bcrypt contra reset_token almacenado
4. Hash nueva password con bcrypt
5. Actualizar: password_hash, password_changed_at = NOW()
6. Limpiar: reset_token = NULL, reset_token_exp = NULL
7. Invalidar refresh_token_hash (forzar re-login)
8. Retornar success
```

### 6.6 Account linking — Decisiones

| Escenario | Acción |
|-----------|--------|
| Registro Google → login email/password | Rechazar: "Esta cuenta usa Google. Creá contraseña desde perfil." |
| Registro email → login Google (mismo email) | **Merge automático**: agregar google_id + 'google' a providers |
| Usuario Google quiere agregar password | `/ecommerce-auth/create-password` (requiere auth) |
| Usuario local quiere vincular Google | `/ecommerce-auth/link-google` (requiere auth) |
| Desvincular Google | Solo si tiene 'local' activo (no quedarse sin método) |
| Desvincular local | No permitido (siempre puede crear password) |

---

## 7. Variables de entorno nuevas

```env
# JWT
JWT_SECRET=clave-secreta-min-32-caracteres-produccion
JWT_REFRESH_SECRET=otra-clave-secreta-diferente-produccion

# Google OAuth2
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# Email (SMTP para reset password)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_xxx
SMTP_FROM=AMBER Joyas <no-reply@amberjoyeria.cl>
```

---

## 8. Seguridad — Guards y Rate Limiting

### Guards (siguiendo `security-use-guards`)

```typescript
// JwtAuthGuard — Protege rutas que requieren autenticación
// Se aplica globalmente, se salta con @Public()

// OptionalAuthGuard — Para checkout
// Si hay token válido → inyecta customer en request
// Si no hay token → continúa sin customer (invitado)
```

### Rate Limiting (siguiendo `security-rate-limiting`)

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| POST /login | 5 intentos | 1 minuto |
| POST /register | 3 intentos | 1 minuto |
| POST /forgot-password | 3 intentos | 1 hora |
| POST /reset-password | 5 intentos | 15 minutos |
| POST /google | 10 intentos | 1 minuto |

---

## 9. Frontend — UI/UX del AuthModal

### 5 vistas del modal

**Vista 1: LOGIN**
- Botón "Continuar con Google" (arriba, prominente)
- Separador "──── o ────"
- Campos: Email, Contraseña (con toggle visibilidad)
- Link "¿Olvidaste tu contraseña?"
- Botón "Iniciar Sesión" (con loading state)
- Link "¿No tienes cuenta? Crear cuenta"

**Vista 2: REGISTER**
- Botón "Continuar con Google" (arriba)
- Separador
- Campos: Nombre, Apellido (lado a lado), Email, Contraseña (con barra de fortaleza)
- Botón "Crear Cuenta" (con loading state)
- Link "¿Ya tienes cuenta? Iniciar sesión"

**Vista 3: FORGOT PASSWORD**
- Texto explicativo
- Campo Email
- Botón "Enviar enlace de recuperación"
- Link "← Volver a iniciar sesión"

**Vista 4: FORGOT RESPONSE**
- Si tiene 'local': "✓ Revisa tu bandeja de entrada"
- Si solo tiene 'google': "Tu cuenta usa Google" + botón Google + sugerencia de crear password

**Vista 5: GOOGLE LINKED**
- "✓ Cuenta vinculada" — confirmación de merge automático
- Botón "Continuar"

### Interacciones

| Acción | Feedback |
|--------|----------|
| Click login | Botón spinner + "Iniciando..." |
| Login exitoso | Toast "Bienvenida, {nombre}" + cierra modal |
| Password incorrecto | Shake animation + mensaje rojo inline |
| Registro exitoso | Toast "Cuenta creada" + cierra modal |
| Email ya existe (registro) | "Este email ya tiene cuenta. ¿Iniciar sesión?" |
| Google linking | Vista 5 por 3s → auto-cierra |
| Forgot password enviado | Vista 4 confirmación |
| Token expirado (reset page) | Mensaje + link "Solicitar nuevo enlace" |

---

## 10. Nuevas páginas/rutas frontend

### `/reset-password?token=XXX` (página nueva)

- Campo: Nueva contraseña (con barra de fortaleza)
- Campo: Confirmar contraseña
- Botón: "Restablecer contraseña"
- Si token expirado: "Solicitar nuevo enlace"
- Éxito: redirigir a home + toast "Contraseña actualizada"

### `/perfil` — Tab "Seguridad" (nueva)

- Métodos de inicio de sesión activos
- Cambiar contraseña (si tiene 'local')
- Crear contraseña (si solo tiene 'google')
- Vincular/desvincular Google
- Desvincular solo si tiene el otro método activo

### `/checkout` — Auth opcional

- Banner: "¿Ya tienes cuenta? Iniciar sesión"
- Si logueado: auto-fill con datos guardados + dirección
- Si invitado: formulario normal
- Checkbox: "Crear cuenta con estos datos" (pide contraseña adicional)

---

## 11. Google Sign-In — Implementación frontend

```
Método: Google Identity Services (GSI) - modo popup
NO redirige fuera del sitio.

1. Cargar <script src="https://accounts.google.com/gsi/client" async> en layout.tsx
2. google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback })
3. Click botón → google.accounts.id.prompt() o renderButton()
4. Google muestra popup de selección de cuenta
5. Callback recibe { credential: id_token_jwt }
6. Frontend: POST /ecommerce-auth/google { id_token: credential }
7. Backend verifica → responde con JWT propio
8. Frontend guarda en auth store → cierra modal
```

---

## 12. Paquetes a instalar

### Backend

```bash
pnpm add @nestjs/jwt passport-jwt passport-google-oauth20 bcrypt nodemailer
pnpm add -D @types/bcrypt @types/passport-jwt @types/passport-google-oauth20 @types/nodemailer
```

### Frontend

No requiere paquetes nuevos. Google GSI se carga via `<script>` tag.

---

## 13. Plan de implementación — 8 pasos

### Paso 1: Base (Backend)
- Instalar paquetes
- Ejecutar migración SQL 020
- Crear entidades TypeORM (EcommerceCustomer, CustomerAddress)
- Scaffold del módulo ecommerce-auth

### Paso 2: Registro + Login (Backend)
- DTOs: RegisterDto, LoginDto
- Service: register(), login()
- JWT Strategy + JwtModule config
- Controller: POST /register, POST /login, POST /refresh

### Paso 3: Google OAuth (Backend)
- Google Strategy (verificar id_token)
- Account linking logic (merge por email)
- Controller: POST /google

### Paso 4: Forgot/Reset Password (Backend)
- DTOs: ForgotPasswordDto, ResetPasswordDto
- Service: forgotPassword(), resetPassword()
- Email service (nodemailer + SMTP)
- Rate limiting con @nestjs/throttler
- Controller: POST /forgot-password, POST /reset-password

### Paso 5: Guards y decoradores (Backend)
- JwtAuthGuard (global con @Public())
- OptionalAuthGuard (para checkout)
- @CurrentCustomer() decorator
- Proteger endpoints: GET/PUT /profile, POST /link-google, POST /create-password

### Paso 6: Frontend AuthModal
- Reescribir AuthModal.tsx con 5 vistas
- Integrar Google Sign-In (GSI script)
- Conectar auth store con API real
- Loading states, error handling, toasts

### Paso 7: Frontend páginas
- /reset-password page
- /perfil tab Seguridad
- /checkout auth opcional + auto-fill + checkbox crear cuenta

### Paso 8: QA
- Test registro local
- Test login local
- Test Google OAuth + account linking
- Test forgot/reset password
- Test checkout invitado vs logueado
- Test refresh token
- Test rate limiting

### Dependencias

```
1 → 2 → 3 → 4    (backend secuencial)
         ↓
    5 → 6 → 7 → 8 (guards → frontend → QA)
```

Pasos 3 y 4 pueden ejecutarse en paralelo.

---

## 14. Diagrama de arquitectura

```
┌──────────────────────────────────────────────────────────┐
│                     FRONTEND                              │
│                                                          │
│  AuthModal ──► POST /ecommerce-auth/login                │
│            ──► POST /ecommerce-auth/register             │
│            ──► POST /ecommerce-auth/google               │
│            ──► POST /ecommerce-auth/forgot-password      │
│                                                          │
│  /reset-password ──► POST /ecommerce-auth/reset-password │
│                                                          │
│  /perfil (Seguridad) ──► POST /link-google               │
│                      ──► POST /create-password           │
│                      ──► PUT /profile                    │
│                                                          │
│  /checkout ──► OptionalAuthGuard                         │
│            ──► POST /ecommerce/orders (con/sin customer) │
│                                                          │
│  Auth Store (Zustand) ← access_token + refresh_token     │
│  API Client ← Bearer token en headers                    │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                     BACKEND                               │
│                                                          │
│  ecommerce-auth.module.ts                                │
│  ├── Controller (10 endpoints)                           │
│  ├── Service (register, login, google, reset, etc.)      │
│  ├── JwtStrategy (validar access tokens)                 │
│  ├── GoogleStrategy (verificar id_tokens)                │
│  ├── JwtAuthGuard (protección global)                    │
│  ├── OptionalAuthGuard (checkout invitado)               │
│  └── Email Service (nodemailer + SMTP)                   │
│                                                          │
│  Separado de auth/ (MercadoLibre admin)                  │
└──────────────────────────┬───────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌──────────────┐ ┌─────────┐ ┌─────────┐
     │  PostgreSQL   │ │ Google  │ │  SMTP   │
     │              │ │ OAuth2  │ │ (email) │
     │ customers    │ │ verify  │ │ reset   │
     │ addresses    │ │ id_token│ │ password│
     │ orders (FK)  │ │         │ │         │
     └──────────────┘ └─────────┘ └─────────┘
```
