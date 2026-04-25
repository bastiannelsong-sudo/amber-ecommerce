# Amber E-commerce - Joyería de Lujo

E-commerce de joyería de lujo construido con Next.js 14, inspirado en el diseño de marcas premium como Swarovski.

## 🎨 Características de Diseño

### Paleta de Colores Premium
- **Obsidian** (negros profundos) - Elegancia y sofisticación
- **Pearl** (blancos/grises suaves) - Limpieza y refinamiento
- **Amber Gold** (dorados) - Acentos luxury
- **Platinum** (plateados) - Detalles metálicos

### Tipografía Elegante
- **Cormorant Garamond** - Serif elegante para títulos
- **Montserrat** - Sans-serif refinada para cuerpo de texto

## 🚀 Tecnologías Implementadas

- **Next.js 14** with App Router
- **TailwindCSS v4** - Estilos utility-first
- **TypeScript** - Type safety
- **Zustand** - State management (carrito, wishlist, auth)
- **Framer Motion** - Animaciones
- **React Hot Toast** - Notificaciones
- **React Zoom Pan Pinch** - Zoom de imágenes
- **Axios** - API client

## ✅ Funcionalidades Implementadas

✅ Catálogo de productos con filtros avanzados
✅ Página de detalle con zoom de imágenes
✅ Sistema de carrito con persistencia
✅ Lista de favoritos
✅ Reviews y ratings
✅ Carrito deslizante (drawer)
✅ Diseño responsive completo
✅ Integración con amber-back
✅ Animaciones y efectos premium

## 🔧 Instalación

```bash
npm install
npm run dev
```

Servidor: http://localhost:3001

## 📦 Variables de Entorno

Configura `.env.local` (ver `.env.example`):
```
# Backend NestJS (server-only, SIN prefijo NEXT_PUBLIC_)
INTERNAL_API_URL=http://localhost:3000

# URL pública del ecommerce (OG, canonical, sitemap)
NEXT_PUBLIC_SITE_URL=http://localhost:3001

# Session cookie firmada (mínimo 32 caracteres)
SESSION_SECRET=dev-only-secret-change-in-production-32chars
```

**Arquitectura**: el backend NestJS nunca es accesible desde el browser.
Todo pasa por Route Handlers `app/api/*` que viven en el server de Next.
Ver `CLAUDE.md` en la raíz del monorepo para las reglas completas.
