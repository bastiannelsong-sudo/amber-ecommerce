import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas desactivadas en MVP - se redirigen al catalogo
const MVP_DISABLED_ROUTES = [
  '/checkout',
  '/carrito',
  '/perfil',
  '/reset-password',
  '/favoritos',
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

export const config = {
  matcher: [
    '/checkout/:path*',
    '/carrito/:path*',
    '/perfil/:path*',
    '/reset-password/:path*',
    '/favoritos/:path*',
  ],
};
