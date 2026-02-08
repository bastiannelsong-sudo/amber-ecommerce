# 11 — Gestión de Órdenes y Clientes

> Prioridad: ALTA | Estado actual: 20%

## Lo que existe hoy

- Creación de orden via `ecommerceService.createOrder()`
- Página de confirmación `/checkout/resultado` con detalle de la orden
- `getOrder(orderNumber)` para consultar orden por número
- Modelo de datos con estados: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
- **No hay historial de pedidos para el cliente**
- **No hay panel admin para gestionar órdenes**
- **No hay notificaciones por email**

---

## Requerimientos

### 11.1 Historial de pedidos del cliente

**Estado:** No existe

**Acciones:**
- [ ] Crear sección "Mis pedidos" en `/perfil` o ruta `/mis-pedidos`
- [ ] Listar todas las órdenes del usuario con:
  - Número de orden
  - Fecha
  - Estado actual (con badge de color)
  - Total
  - Resumen de items (thumbnail + nombre)
- [ ] Detalle de orden al hacer clic:
  - Items completos con imágenes
  - Dirección de envío
  - Método de pago usado
  - Número de seguimiento (cuando exista)
  - Timeline de estados
- [ ] Filtrar por estado (todos, en proceso, entregados)
- [ ] Ordenar por fecha (más reciente primero)

---

### 11.2 Estados de la orden

**Flujo completo:**

```
PENDING (pago pendiente)
  ↓ webhook confirma pago
CONFIRMED (pago confirmado)
  ↓ admin prepara pedido
PROCESSING (en preparación)
  ↓ admin despacha
SHIPPED (despachado) + tracking_number
  ↓ courier confirma entrega
DELIVERED (entregado)

Flujos alternativos:
PENDING → CANCELLED (pago rechazado o timeout)
CONFIRMED → REFUNDED (reembolso solicitado)
DELIVERED → RETURN_REQUESTED → RETURNED → REFUNDED
```

**Acciones:**
- [ ] Implementar máquina de estados en backend
- [ ] Cada cambio de estado dispara notificación al cliente
- [ ] Registrar timestamp de cada cambio de estado
- [ ] No permitir transiciones inválidas (ej: DELIVERED → PENDING)

---

### 11.3 Notificaciones al cliente

**Estado:** No existe

**Notificaciones por email (mínimo para lanzamiento):**

| Evento | Contenido |
|--------|-----------|
| Orden creada | Número de orden, resumen de items, total, dirección |
| Pago confirmado | Confirmación de pago, siguiente paso |
| Pedido despachado | Número de seguimiento, link tracking, tiempo estimado |
| Pedido entregado | Agradecimiento, invitación a dejar review |
| Pago rechazado | Explicación, link para reintentar |

**Acciones:**
- [ ] Elegir servicio de email transaccional (Resend, SendGrid, Amazon SES)
- [ ] Diseñar templates de email con branding Amber
- [ ] Implementar envío en cada cambio de estado (backend)
- [ ] Agregar email de bienvenida al registrar cuenta
- [ ] Opcional: notificación por WhatsApp (ej: via Twilio)

---

### 11.4 Panel de administración de órdenes

**Estado:** No existe

**Acciones:**
- [ ] Crear dashboard admin con:
  - Lista de órdenes recientes
  - Filtros: por estado, fecha, cliente
  - Búsqueda por número de orden o nombre de cliente
  - Contador de órdenes por estado
- [ ] Acciones por orden:
  - Ver detalle completo
  - Cambiar estado (confirmar, despachar, marcar entregado)
  - Agregar número de seguimiento
  - Agregar nota interna
  - Emitir reembolso
- [ ] Alertas:
  - Órdenes pendientes de despacho > 24h
  - Órdenes con pago pendiente > 1h

---

### 11.5 Cancelaciones y reembolsos

**Acciones:**
- [ ] Permitir al cliente cancelar si la orden está en PENDING o CONFIRMED
- [ ] Solicitud de reembolso post-entrega (formulario con motivo)
- [ ] Admin aprueba/rechaza solicitud de reembolso
- [ ] Reembolso via MercadoPago API o manual
- [ ] Registrar motivo de cancelación/reembolso para análisis

---

### 11.6 Gestión de clientes

**Estado:** Auth básico sin perfil completo

**Acciones:**
- [ ] Completar página de perfil (`/perfil`) con:
  - Datos personales editables
  - Direcciones guardadas (múltiples)
  - Historial de pedidos
  - Lista de favoritos
  - Cambio de contraseña
- [ ] Permitir checkout como invitado (sin cuenta obligatoria)
- [ ] Opción de crear cuenta después de la compra
- [ ] Guardar dirección de la última compra para la siguiente

---

### 11.7 Compra como invitado

**Estado:** El checkout actual pide datos pero no requiere cuenta

**Acciones:**
- [ ] Formalizar flujo de invitado: solo pide email + datos de envío
- [ ] Al final del checkout ofrecer: "Crea una cuenta para seguir tu pedido"
- [ ] Enviar enlace de seguimiento por email (no requiere login)
- [ ] Si crea cuenta después, asociar la orden al usuario

---

## Criterio de completitud

- Cliente puede ver historial de pedidos
- Cada cambio de estado envía email al cliente
- Admin puede gestionar órdenes (cambiar estado, agregar tracking)
- Cancelación y reembolso funcional
- Checkout funciona como invitado y como usuario registrado
- Perfil de usuario completo y editable
