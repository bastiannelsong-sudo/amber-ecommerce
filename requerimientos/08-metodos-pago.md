# 08 — Métodos de Pago

> Prioridad: CRÍTICA | Estado actual: 20%

## Lo que existe hoy

- Formulario de tarjeta de crédito visual (no procesa pagos reales)
- `ecommerceService.createOrder()` envía datos al backend y recibe `init_point` de MercadoPago
- Tipos definidos: `CREDIT_CARD`, `DEBIT_CARD`, `BANK_TRANSFER`, `MERCADOPAGO`
- Badges visuales de Visa, Mastercard, Amex
- Número de orden generado aleatoriamente (`#AMB{random}`)
- **El pago no se procesa realmente** — es una simulación con delay de 2 segundos

---

## Panorama de pagos en Chile

| Pasarela | Comisión aprox. | Métodos | Ventaja |
|----------|----------------|---------|---------|
| **MercadoPago** | 3.49% + IVA | Tarjetas, Servipag, efectivo (Lider, Unimarc) | Ya integrado parcialmente, checkout hosted |
| **Transbank Webpay** | Variable (tasa intercambio + fee) | Crédito, débito Redcompra, prepago | Mayor confianza del consumidor chileno |
| **Flow** | Desde 2.89% + IVA | Webpay, transferencia, Multicaja, crypto | No requiere contrato Transbank directo |
| **Khipu** | ~1.2% + IVA | Transferencia bancaria simplificada | Muy barato, ideal para ticket alto |

---

## Requerimientos

### 8.1 MercadoPago — Completar integración (Prioridad 1)

**Estado:** Backend listo, frontend incompleto

**Acciones:**
- [ ] Reemplazar formulario de tarjeta falso por redirect a MercadoPago Checkout Pro
- [ ] Configurar `init_point` del backend para redirigir al checkout de MP
- [ ] Configurar URLs de retorno:
  - `success_url` → `/checkout/resultado?status=approved`
  - `failure_url` → `/checkout/resultado?status=rejected`
  - `pending_url` → `/checkout/resultado?status=pending`
- [ ] En `/checkout/resultado`: consultar estado real de la orden al backend (no confiar en query params)
- [ ] Implementar webhook de MercadoPago en backend:
  - Recibir notificación IPN
  - Verificar firma del webhook
  - Actualizar estado de la orden en BD
- [ ] Manejar estados de pago: approved, pending, rejected, refunded
- [ ] No limpiar carrito hasta confirmar pago aprobado
- [ ] Mostrar estado de pago pendiente con instrucciones claras

**Métodos que cubre MercadoPago:**
- Tarjetas de crédito (Visa, Mastercard, Amex, Diners)
- Tarjetas de débito
- Cuenta MercadoPago
- Pago en efectivo (Servipag, Lider, Unimarc)
- Cuotas sin interés (configurable desde panel MP)

---

### 8.2 Transferencia bancaria / Khipu (Prioridad 2)

**Razón:** Joyería = ticket alto. Muchos clientes prefieren transferencia para montos grandes.

**Acciones:**
- [ ] Evaluar integración con Khipu (comisión ~1.2%, ideal para ticket alto)
- [ ] Alternativa: Transferencia manual con comprobante
  - Mostrar datos bancarios
  - Subir comprobante de transferencia
  - Orden queda "pendiente" hasta verificación manual
- [ ] Si se usa Khipu: integrar API y agregar como opción en checkout

---

### 8.3 Webpay / Flow (Prioridad 3 — Opcional para lanzamiento)

**Razón:** Webpay genera más confianza en consumidor chileno promedio

**Evaluación:**
- Transbank Webpay Plus requiere contrato directo con Transbank
- Flow permite usar Webpay sin contrato directo (actúa como intermediario)
- Para lanzamiento inicial, MercadoPago es suficiente

**Acciones (post-lanzamiento):**
- [ ] Evaluar si la tasa de conversión justifica agregar Webpay
- [ ] Si sí: integrar Flow como intermediario (más simple que Transbank directo)
- [ ] Agregar selector de método de pago en checkout

---

### 8.4 UI de selección de método de pago

**Estado:** No existe — solo muestra formulario de tarjeta

**Acciones:**
- [ ] Crear componente `PaymentMethodSelector` con opciones:
  - MercadoPago (tarjetas + efectivo + cuotas)
  - Transferencia bancaria (si se implementa)
- [ ] Mostrar logos de métodos aceptados
- [ ] Mostrar cuotas disponibles si aplica
- [ ] Mostrar comisión adicional si la hay (o absorberla en el precio)

---

### 8.5 Cuotas y financiamiento

**Razón:** Joyería de lujo con precios $320K - $3.2M CLP, las cuotas son clave

**Acciones:**
- [ ] Configurar cuotas sin interés desde panel MercadoPago (3, 6, 12 cuotas)
- [ ] Mostrar precio en cuotas en la ficha de producto: "Desde $XX.XXX x 12 cuotas"
- [ ] Mostrar calculadora de cuotas en checkout
- [ ] Definir quién absorbe el costo de cuotas (tienda o cliente)

---

### 8.6 Seguridad de pagos

**Acciones:**
- [ ] Eliminar formulario de tarjeta propio (nunca manejar datos de tarjeta directamente)
- [ ] Usar exclusivamente checkout hosted de MercadoPago (PCI compliance automático)
- [ ] No almacenar datos de tarjeta en ningún lado
- [ ] Verificar webhook con firma para prevenir pagos falsos
- [ ] Implementar idempotencia en creación de órdenes (evitar cobros dobles)

---

### 8.7 Facturación

**Acciones:**
- [ ] Definir si se emite boleta o factura electrónica
- [ ] Si se requiere: integrar con SII (Servicio de Impuestos Internos) o usar servicio como Bsale, Nubox
- [ ] Enviar comprobante por email post-compra
- [ ] Mostrar desglose IVA si es requerido

---

## Criterio de completitud

- Al menos 1 método de pago real funcionando (MercadoPago)
- Webhook verificando pagos en backend
- Carrito se limpia solo después de pago confirmado
- Cuotas disponibles y visibles para el cliente
- Sin datos de tarjeta manejados por el frontend
- Comprobante de compra enviado por email
