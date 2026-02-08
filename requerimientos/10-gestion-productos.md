# 10 — Gestión de Productos

> Prioridad: CRÍTICA | Estado actual: 10%

## Lo que existe hoy

- 12 productos dummy hardcodeados en `dummy-products.ts`
- Estructura de producto: id, SKU, nombre, stock, precio, costo, imágenes, categoría
- 4 categorías: Collares, Anillos, Aretes, Pulseras
- Servicio de productos con búsqueda, filtros y ordenamiento
- Backend API preparado (`GET /products`, `GET /products/:id`)
- **No existe panel de administración**
- **No se pueden agregar/editar/eliminar productos sin tocar código**

---

## Requerimientos

### 10.1 Datos del producto — Campos faltantes

**Estructura actual vs lo que necesita un ecommerce real:**

| Campo | Estado | Necesario |
|-------|--------|-----------|
| `product_id` | Existe | Sí |
| `internal_sku` | Existe | Sí |
| `name` | Existe | Sí |
| `price` | Existe | Sí |
| `cost` | Existe | Sí (solo admin) |
| `stock` | Existe | Sí |
| `image_url` | Existe | Sí |
| `images[]` | Existe | Sí |
| `category` | Existe | Sí |
| **`description`** | **NO EXISTE** | **Crítico** |
| **`short_description`** | **NO EXISTE** | **Alto** |
| **`materials`** | **NO EXISTE** | **Alto** (joyería) |
| **`weight`** | **NO EXISTE** | **Alto** (envío) |
| **`dimensions`** | **NO EXISTE** | **Medio** |
| **`variants`** | **NO EXISTE** | **Alto** (talla, color) |
| **`tags`** | **NO EXISTE** | **Medio** |
| **`is_active`** | **NO EXISTE** | **Alto** |
| **`is_featured`** | **NO EXISTE** | **Medio** |
| **`discount_price`** | **NO EXISTE** | **Alto** |
| **`meta_title`** | **NO EXISTE** | **Alto** (SEO) |
| **`meta_description`** | **NO EXISTE** | **Alto** (SEO) |
| **`slug`** | **NO EXISTE** | **Alto** (URLs amigables) |
| **`created_at`** | **NO EXISTE** | **Medio** |

**Acciones:**
- [ ] Agregar `description` y `short_description` al modelo de producto (backend)
- [ ] Agregar `materials` (array: ["Oro 18k", "Diamantes", "Platino"])
- [ ] Agregar `weight` en gramos (para cálculo de envío)
- [ ] Agregar `variants` (talla de anillo, largo de collar, etc.)
- [ ] Agregar `slug` para URLs amigables (`/producto/anillo-solitario-diamante`)
- [ ] Agregar `meta_title` y `meta_description` para SEO
- [ ] Agregar `discount_price` y `discount_percentage`
- [ ] Agregar `is_active` para controlar visibilidad
- [ ] Agregar `is_featured` para destacar en home

---

### 10.2 Panel de administración de productos

**Estado:** No existe

**Opción A — Admin panel propio (más trabajo, más control):**
- [ ] Crear ruta `/admin/productos` con listado de productos
- [ ] Crear formulario de creación/edición de producto
- [ ] Subida de imágenes (a S3, Cloudinary o similar)
- [ ] Gestión de stock (actualizar cantidades)
- [ ] Activar/desactivar productos
- [ ] Proteger rutas admin con rol de usuario

**Opción B — Usar el backend como admin (menos trabajo):**
- [ ] Si el backend (amber-back) ya tiene CRUD de productos, usar su panel
- [ ] Si no, crear endpoints CRUD en el backend y usar herramienta como Retool o AdminJS

**Opción C — Headless CMS (más rápido):**
- [ ] Usar Sanity, Strapi o Payload CMS como gestor de productos
- [ ] Conectar frontend via API del CMS
- [ ] Equipo de negocio puede gestionar productos sin desarrollador

**Acción inmediata:**
- [ ] Decidir qué opción seguir (A, B o C)

---

### 10.3 Subida de productos reales

**Estado:** Solo datos dummy con imágenes de Unsplash

**Acciones:**
- [ ] Definir catálogo inicial de productos reales (cuántos, cuáles)
- [ ] Por cada producto preparar:
  - Nombre comercial
  - Descripción detallada (materiales, medidas, acabado)
  - Descripción corta (1 línea para listados)
  - Precio de venta
  - Costo (solo admin)
  - SKU interno
  - Categoría
  - Stock inicial
  - Peso en gramos
  - Variantes (si aplica)
- [ ] Fotografiar productos (mínimo 4 fotos por producto):
  - Foto principal (fondo blanco o lifestyle)
  - Detalle del producto
  - Producto en uso (modelo)
  - Escala/referencia de tamaño
- [ ] Procesar imágenes:
  - Formato WebP
  - Resolución: 1200x1200px mínimo
  - Peso: < 200KB por imagen
  - Fondo consistente entre productos
- [ ] Subir imágenes a hosting (Cloudinary, S3, Vercel Blob)
- [ ] Cargar productos en el sistema (manual o bulk import)
- [ ] Verificar que cada producto se ve bien en:
  - Grid del catálogo
  - Página de detalle
  - Carrito
  - Quick view

---

### 10.4 Categorías y colecciones

**Estado:** 4 categorías hardcodeadas

**Acciones:**
- [ ] Definir categorías finales:
  - Collares
  - Anillos
  - Aretes / Aros
  - Pulseras
  - ¿Relojes? ¿Broches? ¿Sets/conjuntos?
- [ ] Definir colecciones temáticas:
  - "Nueva colección [temporada]"
  - "Bestsellers"
  - "Regalos bajo $500K"
  - "Compromiso y matrimonio"
  - "Edición limitada"
- [ ] Hacer categorías y colecciones dinámicas (no hardcodeadas)
- [ ] Agregar imagen de portada por categoría/colección

---

### 10.5 Variantes de producto

**Estado:** No existen

**Importante para joyería:**

| Tipo | Variantes comunes |
|------|-------------------|
| Anillos | Talla (5-13), material (oro, plata, platino) |
| Collares | Largo (40cm, 45cm, 50cm, 60cm) |
| Pulseras | Largo (16cm, 18cm, 20cm) |
| Aretes | Tipo (colgante, abrazadera, stud) |

**Acciones:**
- [ ] Definir modelo de variantes: `{ attribute: "Talla", options: ["7", "8", "9"] }`
- [ ] Cada variante puede tener stock y precio diferente
- [ ] Mostrar selector de variante en página de producto
- [ ] Validar que la variante seleccionada tiene stock
- [ ] Incluir variante seleccionada en la orden

---

### 10.6 Gestión de inventario

**Acciones:**
- [ ] Descontar stock al confirmar compra (no al agregar al carrito)
- [ ] Alerta de stock bajo (ej: < 3 unidades)
- [ ] Mostrar "Últimas X unidades" cuando stock es bajo
- [ ] Ocultar producto automáticamente cuando stock = 0
- [ ] Permitir preventa / "Avísame cuando esté disponible"

---

### 10.7 URLs amigables (SEO)

**Estado:** Usa `/producto/[id]` con ID numérico

**Acciones:**
- [ ] Migrar de `/producto/123` a `/producto/anillo-solitario-diamante`
- [ ] Generar slug automático desde el nombre del producto
- [ ] Manejar duplicados: `collar-perlas` → `collar-perlas-2`
- [ ] Redirect 301 si cambia el slug

---

## Criterio de completitud

- Productos reales cargados con fotos profesionales
- Cada producto tiene: nombre, descripción, materiales, precio, stock, imágenes, variantes
- Panel de administración funcional para gestionar productos
- Categorías y colecciones dinámicas
- URLs amigables con slug
- Gestión de inventario automática
- Al menos 10-15 productos reales para lanzamiento
