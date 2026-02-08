# 12 — Operaciones del Negocio

> Prioridad: ALTA | Estado actual: 0%

## Lo que existe hoy

- Nada de operaciones reales implementado
- Todo funciona con datos dummy

---

Este documento cubre todo lo que NO es código pero es necesario para vender.

---

## Requerimientos

### 12.1 Checklist pre-lanzamiento

**Contenido y marca:**
- [ ] Logo final en formato SVG (reemplazar JPEGs actuales)
- [ ] Favicon configurado (actualmente usa default de Next.js)
- [ ] Textos de home, sobre nosotros y contacto con contenido real
- [ ] Datos de contacto reales (email, teléfono, dirección)
- [ ] Redes sociales creadas y enlazadas (Instagram, Facebook, TikTok)
- [ ] Fotos reales del equipo / taller / marca en "Sobre nosotros"

**Productos:**
- [ ] Mínimo 10-15 productos reales cargados
- [ ] Fotos profesionales de cada producto (mínimo 4 por producto)
- [ ] Descripciones completas (materiales, medidas, cuidados)
- [ ] Precios reales definidos con margen calculado
- [ ] Stock inicial ingresado

**Pagos:**
- [ ] Cuenta MercadoPago verificada y activa
- [ ] Cuenta bancaria para recibir pagos vinculada
- [ ] Comisiones calculadas y absorbidas en el precio
- [ ] Prueba de compra real end-to-end

**Legal:**
- [ ] RUT o patente comercial activa
- [ ] Inicio de actividades en SII (si no está hecho)
- [ ] Políticas publicadas (privacidad, términos, devoluciones)
- [ ] Boleta o factura electrónica habilitada

---

### 12.2 Operación diaria

**Proceso de una venta:**

```
1. Cliente compra → llega notificación (email/WhatsApp)
2. Verificar pago confirmado en MercadoPago
3. Preparar pedido:
   - Seleccionar producto
   - Empaquetar (caja + papel + tarjeta)
   - Pesar paquete
4. Generar envío en courier (Chilexpress/Starken/Blue Express)
5. Obtener etiqueta + número de seguimiento
6. Actualizar orden a "Despachado" con tracking
7. Dejar paquete en sucursal o agendar retiro
8. Monitorear entrega
9. Marcar como "Entregado" cuando courier confirme
```

**Acciones:**
- [ ] Documentar proceso paso a paso para el equipo
- [ ] Definir horarios de corte de despacho (ej: pedidos antes de 14:00 se despachan mismo día)
- [ ] Definir quién gestiona las órdenes (responsable)
- [ ] Crear plantilla de packing list

---

### 12.3 Inventario

**Acciones:**
- [ ] Definir dónde se almacena el inventario (casa, bodega, showroom)
- [ ] Definir proceso de restock:
  - Proveedor / taller propio
  - Lead time de producción
  - Punto de reorden por producto
- [ ] Definir qué hacer cuando un producto se agota:
  - Ocultar del catálogo
  - Mostrar "Agotado" con opción de notificación
  - Deshabilitar compra pero mantener visible (SEO)
- [ ] Inventario cruzado si se vende por otros canales (Instagram, WhatsApp, presencial)

---

### 12.4 Atención al cliente

**Acciones:**
- [ ] Definir canales de atención:
  - Email de soporte (ej: contacto@amber.cl)
  - WhatsApp Business
  - Formulario de contacto (ya existe en `/contacto`)
  - Instagram DMs
- [ ] Definir horarios de atención
- [ ] Preparar respuestas tipo para:
  - "¿Dónde está mi pedido?"
  - "¿Puedo cambiar mi pedido?"
  - "¿Cómo devuelvo un producto?"
  - "¿Hacen envíos a [región]?"
  - "¿Tienen [producto] en [talla/color]?"
- [ ] Evaluar chat en vivo (Tidio, Crisp o widget de WhatsApp)
- [ ] Tiempo de respuesta objetivo: < 2 horas en horario laboral

---

### 12.5 Marketing de lanzamiento

**Acciones previas al lanzamiento:**
- [ ] Crear perfil de Instagram con grid planificado (9-12 posts)
- [ ] Crear página de Facebook
- [ ] Configurar Google My Business (si hay punto físico)
- [ ] Preparar campaña de lanzamiento:
  - Email a lista de contactos existente
  - Posts en redes sociales
  - Cupón de descuento de lanzamiento
- [ ] Configurar pixel de Facebook / Meta para remarketing
- [ ] Configurar Google Ads (si hay presupuesto)

**Acciones post-lanzamiento:**
- [ ] Email de carrito abandonado (24h después)
- [ ] Email post-compra pidiendo review (7 días después)
- [ ] Newsletter mensual con nuevos productos
- [ ] Estrategia de contenido en Instagram (3-4 posts por semana)

---

### 12.6 Métricas de negocio a trackear

| Métrica | Fórmula | Objetivo inicial |
|---------|---------|-----------------|
| Tasa de conversión | Compras / Visitas | > 1.5% |
| Ticket promedio | Ingresos / N° órdenes | > $300K |
| Tasa de abandono de carrito | Carritos abandonados / Carritos creados | < 70% |
| Costo de adquisición (CAC) | Gasto marketing / Nuevos clientes | < $30K |
| Tasa de recompra | Clientes repetidos / Total clientes | > 15% |
| NPS (Net Promoter Score) | Encuesta post-compra | > 50 |

**Acciones:**
- [ ] Configurar dashboard con estas métricas (Google Analytics + hoja de cálculo al inicio)
- [ ] Revisar métricas semanalmente
- [ ] Definir objetivos mensuales

---

### 12.7 Proveedores y costos operacionales

**Costos a considerar:**

| Concepto | Estimación mensual |
|----------|-------------------|
| Hosting (Vercel Pro) | $20 USD (~$19K CLP) |
| Dominio (.cl) | ~$10K CLP/año |
| Email transaccional (Resend) | Gratis hasta 3K emails/mes |
| MercadoPago comisión | ~3.5% por venta |
| Packaging (cajas, bolsas, tarjetas) | Variable por unidad |
| Courier (Chilexpress/Starken) | $5K-$10K por envío |
| Fotografía de productos | Puntual por sesión |
| Sentry (monitoreo) | Gratis hasta 5K eventos/mes |
| Cloudinary (imágenes) | Gratis hasta 25GB |

**Acciones:**
- [ ] Calcular costo operacional por venta
- [ ] Definir precio mínimo de venta para cubrir costos
- [ ] Calcular punto de equilibrio (break-even)

---

## Criterio de completitud

- Proceso de venta documentado paso a paso
- Al menos 1 venta de prueba real completada end-to-end
- Canales de atención al cliente definidos y activos
- Inventario real ingresado en el sistema
- Métricas configuradas y dashboard básico funcional
- Costos operacionales calculados
