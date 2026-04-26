import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Rutas desactivadas en este momento - se redirigen al catalogo con
 * el flag ?mvp=1 que dispara el toast "Compra por WhatsApp".
 *
 * Histórico: cuando el MP no estaba integrado, todo el flow B2C estaba
 * acá (checkout, carrito, perfil, etc). Ahora que FEAT-001 (MercadoPago
 * E2E), FEAT-002 (emails), FEAT-005 (address book) están en producción,
 * se removieron de la lista.
 *
 * Si necesitás bloquear una ruta temporalmente (mantenimiento, feature
 * incompleta), agregala acá y el usuario será redirigido sin romper.
 */
const MVP_DISABLED_ROUTES: string[] = [
  // Vacio: todo el flow B2C habilitado.
  // Ejemplos para futuro si necesitas pausar algo:
  //   '/favoritos',     // si hay bug en wishlist
  //   '/blog',          // si content no esta listo
];

// Next 16 renombra `middleware` → `proxy`. El export function debe llamarse
// `proxy` para que el runtime lo reconozca.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirigir rutas no-MVP al catalogo
  if (MVP_DISABLED_ROUTES.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = '/catalogo';
    url.searchParams.set('mvp', '1');
    return NextResponse.redirect(url);
  }

  // Headers de seguridad
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

// El matcher se mantiene amplio para que los headers de seguridad sigan
// aplicandose a estas rutas. La logica de redirect arriba ya filtra
// segun MVP_DISABLED_ROUTES.
export const config = {
  matcher: [
    '/checkout/:path*',
    '/carrito/:path*',
    '/perfil/:path*',
    '/reset-password/:path*',
    '/favoritos/:path*',
  ],
};
