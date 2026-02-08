# Amber Ecommerce — Mapa de Producción

> Última actualización: 2026-02-07

## Estado actual del proyecto

| Área | Progreso | Detalle |
|------|----------|---------|
| Frontend (páginas y componentes) | ██████████ 95% | 25 componentes, 14 rutas |
| Estado y persistencia | ██████████ 90% | 3 stores Zustand |
| Marketing y conversión | ██████████ 95% | 11 componentes psicológicos |
| Métodos de pago | ██░░░░░░░░ 20% | MercadoPago parcial, sin pago real |
| Envíos y logística | █░░░░░░░░░ 15% | Solo tarifa plana, sin courier |
| Gestión de productos | █░░░░░░░░░ 10% | Datos dummy, sin admin, sin fotos reales |
| Gestión de órdenes | ██░░░░░░░░ 20% | Crea orden, sin historial ni admin |
| Infraestructura y DevOps | ░░░░░░░░░░ 0% | Sin CI/CD ni config deploy |
| Seguridad | █░░░░░░░░░ 15% | Solo interceptor 401 |
| SEO y Performance | ██░░░░░░░░ 20% | Metadata básica, sin optimización |
| Testing | ░░░░░░░░░░ 0% | Sin tests |
| Legal y Compliance | ░░░░░░░░░░ 0% | Sin políticas |
| Observabilidad | ░░░░░░░░░░ 0% | Sin monitoreo |
| Operaciones de negocio | ░░░░░░░░░░ 0% | Sin procesos definidos |

---

## Stack tecnológico

- **Framework**: Next.js 16.1.6 (App Router) + React 19
- **Lenguaje**: TypeScript (strict)
- **Estilos**: TailwindCSS 4.x + Framer Motion
- **Estado**: Zustand 5 con persistencia localStorage
- **HTTP**: Axios + React Query (TanStack)
- **Pagos**: MercadoPago (redirect flow, incompleto)
- **Tipografía**: Cormorant Garamond + Montserrat

---

## Documentos de requerimientos

### Técnicos

| # | Documento | Prioridad | Items |
|---|-----------|-----------|-------|
| 01 | [Infraestructura y DevOps](./01-infraestructura.md) | CRÍTICA | 15 |
| 02 | [Seguridad](./02-seguridad.md) | CRÍTICA | 22 |
| 03 | [SEO y Performance](./03-seo-performance.md) | ALTA | 28 |
| 04 | [UX y Funcionalidad](./04-ux-funcionalidad.md) | ALTA | 20 |
| 05 | [Testing y Calidad](./05-testing.md) | ALTA | 18 |
| 06 | [Legal y Compliance](./06-legal.md) | ALTA | 16 |
| 07 | [Observabilidad](./07-observabilidad.md) | MEDIA | 15 |

### Negocio y operaciones

| # | Documento | Prioridad | Items |
|---|-----------|-----------|-------|
| 08 | [Métodos de Pago](./08-metodos-pago.md) | CRÍTICA | 25 |
| 09 | [Envíos y Logística](./09-envios-logistica.md) | CRÍTICA | 22 |
| 10 | [Gestión de Productos](./10-gestion-productos.md) | CRÍTICA | 30 |
| 11 | [Gestión de Órdenes y Clientes](./11-gestion-ordenes.md) | ALTA | 24 |
| 12 | [Operaciones del Negocio](./12-operaciones-negocio.md) | ALTA | 20 |

**Total: ~255 items** (técnicos + negocio)

---

## Orden de implementación recomendado

```
Fase 0 — Producto (semana 1-2) ⭐ PRIMERO
├── Decidir cómo gestionar productos (admin propio / CMS / backend)
├── Cargar productos reales con fotos profesionales
├── Agregar descripciones, materiales, variantes
├── Completar campos faltantes (description, weight, slug)
└── Configurar hosting de imágenes (Cloudinary / S3)

Fase 1 — Pagos y envíos (semana 2-3) ⭐ CRÍTICO
├── Completar integración MercadoPago (redirect real)
├── Implementar webhook de confirmación de pago
├── Definir zonas y tarifas de envío
├── Calcular envío dinámico según región
└── Probar compra real end-to-end

Fase 2 — Seguridad y calidad (semana 3-4)
├── Headers de seguridad
├── Protección de rutas privadas
├── Sanitización de inputs
├── Tests unitarios (stores + servicios)
├── Tests E2E (flujo de compra)
└── Error boundaries + loading states

Fase 3 — SEO y legal (semana 4-5)
├── Metadata dinámica por página
├── Sitemap + robots.txt
├── Schema markup (Product, Organization)
├── next/image en todas las imágenes
├── Políticas legales (privacidad, términos, devoluciones)
└── Banner de cookies

Fase 4 — Órdenes y clientes (semana 5-6)
├── Historial de pedidos del cliente
├── Email transaccional (confirmación, despacho)
├── Panel admin básico de órdenes
├── Tracking de envíos
└── Perfil de usuario completo

Fase 5 — Lanzamiento (semana 6-7)
├── CI/CD pipeline
├── Deploy a Vercel con dominio propio
├── Sentry + Analytics
├── Prueba de compra real completa
├── Checklist pre-lanzamiento (contenido, legal, pagos)
└── Marketing de lanzamiento
```

---

## Hallazgos críticos

> Cosas que se ven funcionales pero **no lo son** para producción:

1. **El pago es simulado** — El formulario de tarjeta no procesa nada. Solo hace un `setTimeout` de 2s y muestra "orden confirmada"
2. **Los productos son dummy** — Son 12 items con fotos de Unsplash, sin descripciones ni variantes
3. **No hay admin** — Para agregar un producto hay que editar código
4. **El envío es flat rate** — $5K o gratis, sin considerar zona, peso ni courier real
5. **No hay emails** — El cliente no recibe ninguna notificación
6. **No hay historial** — El cliente no puede ver sus pedidos anteriores

---

## Fuentes de referencia

- [Pasarelas de pago en Chile — Digitalizame](https://digitalizame.cl/pasarelas-de-pago-en-chile/)
- [Comparativa medios de pago Chile — Emagenic](https://www.emagenic.cl/comparativa-medios-de-pago-para-ecommerce-en-chile)
- [Costos de envío Chile — Restauración y Conservación](https://restauracionyconservacion.cl/costo-envios-starken-chilexpress/)
- [Empresas de encomiendas Chile — Tiendanube](https://www.tiendanube.com/blog/empresa-de-encomiendas-mas-barata-en-chile/)
