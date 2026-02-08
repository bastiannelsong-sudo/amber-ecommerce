# 03 — SEO y Performance

> Prioridad: ALTA | Estado actual: 20%

## Lo que existe hoy

- Metadata básica en `layout.tsx` (título y descripción global)
- Fuentes cargadas via Google Fonts (Next.js font optimization)
- Imágenes de productos vía URLs externas (Unsplash) sin optimización
- Sin sitemap, sin robots.txt, sin schema markup

---

## Requerimientos

### 3.1 Metadata por página

**Estado:** Solo metadata global en layout

**Acciones:**
- [ ] Agregar `metadata` o `generateMetadata` en cada `page.tsx`:
  - `/` — título home, descripción de la marca
  - `/catalogo` — título catálogo, descripción con keywords
  - `/producto/[id]` — título dinámico con nombre del producto, descripción, OG image
  - `/colecciones` — título y descripción de colecciones
  - `/contacto` — título contacto
  - `/sobre-nosotros` — título sobre nosotros
- [ ] Configurar Open Graph tags (og:title, og:description, og:image) por página
- [ ] Configurar Twitter Card tags
- [ ] Agregar canonical URLs

---

### 3.2 Sitemap y robots.txt

**Estado:** No existen

**Acciones:**
- [ ] Crear `app/sitemap.ts` (generación dinámica con Next.js)
  - Incluir todas las páginas estáticas
  - Incluir páginas de productos dinámicas (`/producto/[id]`)
  - Configurar `lastModified` y `changeFrequency`
- [ ] Crear `app/robots.ts`
  - Permitir indexación de páginas públicas
  - Bloquear `/perfil`, `/checkout`, `/carrito`
  - Referenciar sitemap

---

### 3.3 Schema markup (datos estructurados)

**Estado:** No existe

**Acciones:**
- [ ] Agregar schema `Organization` en layout principal
- [ ] Agregar schema `Product` en `/producto/[id]` con:
  - nombre, descripción, imagen, precio, disponibilidad, SKU
  - `AggregateRating` con reviews
  - `Offer` con precio y moneda
- [ ] Agregar schema `BreadcrumbList` en páginas de producto y catálogo
- [ ] Agregar schema `WebSite` con SearchAction
- [ ] Validar con Google Rich Results Test

---

### 3.4 Optimización de imágenes

**Estado:** Imágenes cargadas con `<img>` nativo, sin optimización

**Problemas:**
- No se usa `next/image` (sin lazy loading automático, sin formatos modernos)
- Imágenes de Unsplash sin dimensiones fijas
- Sin placeholder blur

**Acciones:**
- [ ] Migrar todas las `<img>` a `<Image>` de `next/image`
- [ ] Configurar `images.remotePatterns` en `next.config.ts` para Unsplash y dominio propio
- [ ] Agregar `width`, `height` o `fill` a todas las imágenes
- [ ] Agregar `placeholder="blur"` donde sea posible
- [ ] Agregar `priority` a imágenes above-the-fold (hero, primer producto)
- [ ] Optimizar logos en `/public` (convertir JPEG a WebP)

---

### 3.5 Performance (Core Web Vitals)

**Acciones:**
- [ ] Ejecutar Lighthouse y documentar scores actuales
- [ ] Reducir JavaScript del bundle:
  - Verificar que Framer Motion no se importa completo
  - Code-split componentes pesados (ProductComparator, ImageLightbox)
  - Lazy load modales y drawers
- [ ] Agregar `loading="lazy"` a componentes below-the-fold
- [ ] Mover componentes que no necesitan interactividad a Server Components
- [ ] Revisar y eliminar CSS/imports no utilizados
- [ ] Configurar caché de assets estáticos (Cache-Control headers)

---

### 3.6 Accesibilidad (a11y)

**Acciones:**
- [ ] Agregar `alt` descriptivo a todas las imágenes
- [ ] Verificar contraste de colores (WCAG AA mínimo)
- [ ] Agregar `aria-label` a botones de iconos (corazón, carrito, cerrar)
- [ ] Asegurar navegación por teclado en modales (focus trap)
- [ ] Agregar `role` y `aria` attributes a componentes interactivos
- [ ] Agregar skip-to-content link
- [ ] Testear con screen reader (VoiceOver)

---

## Criterio de completitud

- Lighthouse Performance > 90, SEO > 95, Accessibility > 90
- Sitemap indexado en Google Search Console
- Schema markup validado sin errores
- Todas las imágenes usan `next/image`
- Core Web Vitals en verde (LCP < 2.5s, FID < 100ms, CLS < 0.1)
