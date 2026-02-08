# 02 — Seguridad

> Prioridad: CRÍTICA | Estado actual: 15%

## Lo que existe hoy

- Interceptor Axios que limpia token en respuesta 401
- Token de auth en localStorage
- Validación básica en formularios (HTML5)

---

## Requerimientos

### 2.1 Autenticación y sesión

**Problemas actuales:**
- Token almacenado en `localStorage` (vulnerable a XSS)
- Sin expiración de token en el cliente
- Sin refresh token flow
- Sin protección de rutas privadas (perfil, checkout)

**Acciones:**
- [ ] Evaluar migrar token a httpOnly cookie (requiere cambio en backend)
- [ ] Implementar verificación de expiración de token
- [ ] Agregar middleware de Next.js para proteger rutas privadas (`/perfil`, `/checkout`)
- [ ] Implementar cierre de sesión automático por inactividad
- [ ] Validar que el logout limpia todo el estado correctamente

---

### 2.2 Sanitización de inputs

**Estado:** Sin sanitización

**Acciones:**
- [ ] Sanitizar todos los inputs de usuario antes de enviar al API (nombre, email, dirección, reviews)
- [ ] Escapar contenido de reviews al renderizar (prevenir XSS almacenado)
- [ ] Validar formato de email, teléfono, código postal en el cliente
- [ ] Limitar longitud máxima de campos de texto

---

### 2.3 Protección de formularios

**Acciones:**
- [ ] Agregar rate limiting visual en login (ej: bloqueo tras 5 intentos)
- [ ] Implementar honeypot o captcha en formulario de contacto
- [ ] Implementar honeypot o captcha en formulario de reviews
- [ ] Desabilitar botón de submit mientras hay request en vuelo (prevenir doble envío)
- [ ] Validar en checkout que los items del carrito aún están en stock antes de pagar

---

### 2.4 Headers de seguridad

**Estado:** No configurados

**Acciones:**
- [ ] Configurar Content-Security-Policy en `next.config.ts`
- [ ] Configurar X-Frame-Options: DENY
- [ ] Configurar X-Content-Type-Options: nosniff
- [ ] Configurar Referrer-Policy: strict-origin-when-cross-origin
- [ ] Configurar Permissions-Policy (desactivar cámara, micrófono, etc.)
- [ ] Configurar Strict-Transport-Security (HSTS)

---

### 2.5 Datos sensibles

**Acciones:**
- [ ] Verificar que `.env.local` está en `.gitignore`
- [ ] Auditar que ningún secret está hardcodeado en el código
- [ ] Verificar que `NEXT_PUBLIC_` solo expone lo necesario
- [ ] No loguear datos de pago o información personal en consola
- [ ] Limpiar `console.log` de desarrollo antes de deploy

---

### 2.6 Pagos (MercadoPago)

**Acciones:**
- [ ] Implementar webhook de MercadoPago para confirmar pagos (backend)
- [ ] Verificar firma del webhook para prevenir pagos falsos
- [ ] No confiar en el estado de pago que viene del redirect del cliente
- [ ] Mostrar estado real del pago consultando al backend en `/checkout/resultado`

---

## Criterio de completitud

- No hay tokens en localStorage (migrado a httpOnly cookies) o se documenta el riesgo aceptado
- Todas las rutas privadas requieren autenticación
- Inputs sanitizados y validados
- Headers de seguridad configurados y verificados con securityheaders.com
- Sin secrets en el código fuente
- Flujo de pago verificado end-to-end
