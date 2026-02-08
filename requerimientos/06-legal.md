# 06 — Legal y Compliance

> Prioridad: ALTA | Estado actual: 0%

## Lo que existe hoy

- Sin ninguna página legal
- Sin banner de cookies
- Sin checkbox de términos en checkout o registro

---

## Requerimientos

### 6.1 Páginas legales obligatorias

**Acciones:**
- [ ] Crear `/politica-privacidad` — Política de privacidad
  - Qué datos se recolectan (nombre, email, dirección, pago)
  - Cómo se usan los datos
  - Con quién se comparten (MercadoPago, proveedor de email)
  - Derechos del usuario (acceso, rectificación, eliminación)
  - Contacto del responsable de datos
- [ ] Crear `/terminos` — Términos y condiciones
  - Condiciones de uso del sitio
  - Proceso de compra y formación del contrato
  - Precios y disponibilidad
  - Limitación de responsabilidad
- [ ] Crear `/devoluciones` — Política de devoluciones y cambios
  - Plazo para devoluciones (según ley local)
  - Condiciones del producto para devolución
  - Proceso de devolución paso a paso
  - Quién paga el envío de devolución
  - Plazo de reembolso
- [ ] Crear `/envios` (completar la página existente)
  - Zonas de envío y tiempos estimados
  - Costos de envío
  - Umbral de envío gratis ($50,000)
  - Seguimiento de pedidos

---

### 6.2 Consentimiento y cookies

**Acciones:**
- [ ] Implementar banner de cookies con opciones:
  - Cookies esenciales (siempre activas)
  - Cookies de analytics (opcionales)
  - Cookies de marketing (opcionales)
- [ ] No cargar Google Analytics hasta que el usuario acepte
- [ ] Persistir preferencia de cookies en localStorage
- [ ] Agregar link a política de cookies desde el banner

---

### 6.3 Consentimiento en formularios

**Acciones:**
- [ ] Agregar checkbox obligatorio de aceptación de términos en:
  - Formulario de registro
  - Formulario de checkout
- [ ] Agregar checkbox opcional de suscripción a newsletter en:
  - Formulario de registro
  - Formulario de checkout
- [ ] Enlazar a políticas de privacidad y términos desde los checkboxes

---

### 6.4 Facturación y comprobantes

**Evaluación:** Depende de la legislación del país

**Acciones:**
- [ ] Determinar si se requiere boleta/factura electrónica
- [ ] Si aplica: integrar con SII (Chile) o sistema fiscal local
- [ ] Enviar comprobante por email post-compra
- [ ] Mostrar desglose de impuestos en checkout si es requerido legalmente

---

### 6.5 Protección al consumidor

**Acciones:**
- [ ] Mostrar precio final (con impuestos incluidos si aplica) en todo momento
- [ ] Mostrar información del vendedor (razón social, RUT/ID fiscal, dirección)
- [ ] Implementar derecho de retracto según ley local
- [ ] Botón "Libro de reclamos" si es requerido por ley

---

## Criterio de completitud

- Todas las páginas legales publicadas y accesibles desde el footer
- Banner de cookies funcional con persistencia
- Checkboxes de consentimiento en registro y checkout
- Información del vendedor visible en el sitio
- Cumple con legislación de comercio electrónico local
