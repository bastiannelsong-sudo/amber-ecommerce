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
 */
const MVP_DISABLED_ROUTES: string[] = [
  // Vacio: todo el flow B2C habilitado.
];

/**
 * Rutas que requieren sesion. Sin cookie de sesion → redirect a /login
 * con `?next=` para que despues del login vuelva a donde estaba.
 *
 * /perfil tiene PII (ordenes, direcciones, datos personales) — bloquear
 * el render desde el edge evita request perdidos al BFF y mejora UX
 * (no se ve un flash de pagina vacia + redirect tardio).
 *
 * /checkout NO esta aca: el guest checkout es un caso valido. Si el
 * cliente esta logueado, se hidrata su address book; si no, llena form
 * inline. La pagina maneja ambos.
 *
 * /favoritos vive en localStorage por ahora (no requiere sesion).
 */
const PROTECTED_ROUTES = ['/perfil'];

const SESSION_COOKIE = 'amber_session';

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

  // Auth gate: rutas protegidas requieren cookie de sesion presente.
  // No verificamos firma aca (eso lo hace el server-side al llamar
  // getSession()) — solo presencia. Una cookie forjada igual va a
  // fallar en el primer fetch al BFF que requiera token. El gate
  // del edge es UX (no flash vacio) + reduce carga al backend.
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE);
    if (!sessionCookie?.value) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }

  // Headers de seguridad
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

// El matcher se mantiene amplio para que los headers de seguridad sigan
// aplicandose a estas rutas. La logica de redirect arriba ya filtra
// segun MVP_DISABLED_ROUTES y PROTECTED_ROUTES.
export const config = {
  matcher: [
    '/checkout/:path*',
    '/carrito/:path*',
    '/perfil/:path*',
    '/reset-password/:path*',
    '/favoritos/:path*',
  ],
};
