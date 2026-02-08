# 09 — Envíos y Logística

> Prioridad: CRÍTICA | Estado actual: 15%

## Lo que existe hoy

- Envío gratis sobre $50,000 CLP (hardcodeado)
- Tarifa plana de $5,000 CLP bajo ese umbral
- Selector de región con las 16 regiones de Chile
- Componente `FreeShippingProgress` con barra de progreso
- Timeline visual de entrega: confirmado → preparación (1-2 días) → entregado (3-5 días)
- **No hay integración real con courier ni cálculo por zona/peso**

---

## Tarifas de referencia — Couriers en Chile (2026)

| Courier | Santiago (local) | Regiones | Mejor para |
|---------|-----------------|----------|------------|
| **Chilexpress** | $5,000 - $12,000 | $7,000 - $15,000 | Rapidez, cobertura |
| **Starken** | $2,500 - $7,500 | $4,000 - $10,000 | Precio económico |
| **Blue Express** | $4,000 - $10,000 | $5,000 - $12,000 | Descuentos por volumen |
| **Correos de Chile** | $3,000 - $6,000 | $4,000 - $8,000 | Cobertura rural |

*Precios varían según peso, dimensiones y destino exacto.*

---

## Requerimientos

### 9.1 Modelo de envíos para lanzamiento

**Opción recomendada:** Tarifas por zona (sin API de courier al inicio)

**Zonas de envío propuestas:**

| Zona | Regiones | Tarifa | Tiempo estimado |
|------|----------|--------|-----------------|
| Santiago (RM) | Metropolitana | $4,990 | 1-2 días hábiles |
| Zona Centro | V, VI, VII, O'Higgins | $5,990 | 2-3 días hábiles |
| Zona Norte | I, II, III, IV, XV | $7,990 | 3-5 días hábiles |
| Zona Sur | VIII, IX, XIV, X | $6,990 | 3-5 días hábiles |
| Zona Austral | XI, XII | $9,990 | 5-7 días hábiles |
| **Envío gratis** | Todas | $0 | Aplica sobre $80,000 |

**Acciones:**
- [ ] Crear mapa de zonas de envío (región → zona → tarifa)
- [ ] Implementar función `calcularEnvio(region, subtotal)` que devuelva costo y tiempo estimado
- [ ] Actualizar umbral de envío gratis (evaluar $50K vs $80K vs $100K según margen)
- [ ] Mostrar costo de envío dinámico en carrito al seleccionar región
- [ ] Mostrar tiempo estimado de entrega según zona
- [ ] Actualizar `FreeShippingProgress` con umbral real

---

### 9.2 Cálculo de envío en carrito y checkout

**Estado:** Solo muestra tarifa plana o gratis

**Acciones:**
- [ ] Agregar selector de región/comuna en el carrito (no solo en checkout)
- [ ] Calcular envío en tiempo real al cambiar región
- [ ] Mostrar desglose: subtotal + envío + total
- [ ] Si el envío es gratis, mostrar "Envío gratis" destacado
- [ ] Mostrar cuánto falta para envío gratis: "Agrega $X más para envío gratis"

---

### 9.3 Opciones de envío

**Acciones:**
- [ ] Ofrecer al menos 2 opciones:
  - **Envío estándar**: Tarifa según zona, 2-5 días hábiles
  - **Envío express** (solo RM): +$3,000 sobre estándar, 24 horas hábiles
- [ ] Evaluar retiro en tienda/showroom si hay punto físico
- [ ] Mostrar fecha estimada de entrega (no solo días)

---

### 9.4 Integración con courier (Fase 2)

**Para después del lanzamiento — cuando el volumen lo justifique:**

**Acciones:**
- [ ] Evaluar API de Chilexpress, Starken o Blue Express para:
  - Cotización en tiempo real por peso/dimensiones
  - Generación automática de etiquetas de envío
  - Número de seguimiento automático
- [ ] Alternativa: Usar servicio agregador como **Envíame** o **Shipit**
  - Conecta múltiples couriers en una sola API
  - Cotización automática del más barato
  - Tracking unificado
- [ ] Configurar peso estimado por categoría de producto:
  - Anillos: ~50g
  - Aretes: ~30g
  - Collares: ~100g
  - Pulseras: ~80g

---

### 9.5 Tracking de envíos

**Estado:** Timeline visual estático, sin tracking real

**Acciones:**
- [ ] Agregar campo `tracking_number` a la orden
- [ ] Crear página `/seguimiento` para consultar estado de envío
- [ ] Mostrar estados: Preparando → Despachado → En camino → Entregado
- [ ] Enviar email/notificación cuando el pedido se despacha con número de seguimiento
- [ ] Link al tracking del courier (ej: chilexpress.cl/seguimiento)

---

### 9.6 Packaging (consideración de negocio)

**Para joyería de lujo el packaging es parte de la experiencia:**

**Acciones:**
- [ ] Definir packaging estándar (caja, bolsa, papel de seda, tarjeta)
- [ ] Ofrecer opción de "empaque regalo" en checkout (+$X o gratis)
- [ ] Incluir tarjeta con mensaje personalizado (campo en checkout)
- [ ] Definir peso del packaging para cálculo de envío

---

### 9.7 Despacho en Santiago — Detalle

**Para la Región Metropolitana (mayor volumen esperado):**

**Acciones:**
- [ ] Definir si se despacha desde bodega propia o usa fulfillment
- [ ] Definir horario de corte para despacho mismo día (ej: pedidos antes de 12:00)
- [ ] Evaluar delivery propio para Santiago (Uber, Rappi, moto propia) vs courier
- [ ] Definir comunas con cobertura express

---

## Criterio de completitud

- Envío calculado dinámicamente según región del comprador
- Al menos 2 opciones de envío (estándar + express RM)
- Envío gratis sobre umbral definido
- Tiempo estimado de entrega visible antes de pagar
- Tracking number asignado a cada orden despachada
- Email de notificación al despachar
