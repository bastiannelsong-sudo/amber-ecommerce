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
 * el render desde el edge evita request perdidos al BFF y mejora UX.
 *
 * /checkout NO esta aca: el guest checkout es un caso valido.
 * /favoritos vive en localStorage (no requiere sesion).
 */
const PROTECTED_ROUTES = ['/perfil'];

const SESSION_COOKIE = 'amber_session';

// ─── CSP con nonce per-request ──────────────────────────────────────────────
// Inspirado en pattern de caja-piura/web-caja-piura-v2 (Next.js production
// reference). Resumen de decisiones:
//
//   - script-src usa nonce + 'strict-dynamic'. Esto elimina la dependencia de
//     'unsafe-eval' (que era la debilidad principal del CSP anterior).
//     'unsafe-inline' queda como fallback — los browsers modernos lo IGNORAN
//     cuando hay un nonce presente (CSP Level 3), pero lo dejamos para
//     compatibilidad con browsers viejos.
//
//   - script-src-attr 'none' bloquea inline event handlers (onclick=, etc.)
//     que son un vector de XSS clasico.
//
//   - style-src mantiene 'unsafe-inline' por Tailwind + motion/react +
//     style props inline en RSC. Sacarlo rompe muchos componentes. Aceptamos
//     el trade-off — React escapa values, asi que CSS injection via XSS
//     queda mitigado a nivel framework.
//
//   - report-uri va a /api/csp-report (proxy interno) para no exponer URL
//     del backend ni de Sentry. El handler reenvia.
//
// El nonce se genera con crypto.randomUUID() por cada request y se pasa a
// Server Components via header `x-nonce`. Helper en app/lib/nonce.ts.
// ─────────────────────────────────────────────────────────────────────────────

function buildCspHeader(nonce: string, isDev: boolean): string {
  // Fuentes externas que cargan scripts. Mantener mínimo.
  const externalScriptSrc = [
    'accounts.google.com',
    // Pendiente: cuando se active GTM/GA4 en prod, agregar:
    // 'https://www.googletagmanager.com',
    // 'https://www.google-analytics.com',
  ].join(' ');

  // Connect-src: dominios a los que el browser hace fetch/xhr/ws.
  const connectSrc = [
    "'self'",
    isDev
      ? 'http://localhost:* ws://localhost:* wss://local.ambernelson.cl https://local.ambernelson.cl'
      : '',
    'api.ambernelson.cl',
    'accounts.google.com',
    'wa.me',
    // Pendiente: cuando se active Sentry, agregar *.sentry.io *.ingest.sentry.io
    // Pendiente: cuando se active GA4, agregar *.google-analytics.com region1.google-analytics.com
  ]
    .filter(Boolean)
    .join(' ');

  const directives = [
    `default-src 'self'`,
    // 'strict-dynamic' permite que scripts cargados con nonce carguen otros
    // scripts dinamicamente sin necesidad de nonce explicito en cada uno.
    // 'unsafe-inline' es ignorado por browsers que soportan nonce (fallback).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' ${externalScriptSrc}`,
    `script-src-elem 'self' 'nonce-${nonce}' 'unsafe-inline' ${externalScriptSrc}`,
    `script-src-attr 'none'`,
    `style-src 'self' 'unsafe-inline' fonts.googleapis.com`,
    `style-src-elem 'self' 'unsafe-inline' fonts.googleapis.com`,
    `style-src-attr 'unsafe-inline'`,
    `font-src 'self' fonts.gstatic.com`,
    `img-src 'self' data: blob: images.unsplash.com http2.mlstatic.com *.mlstatic.com`,
    `connect-src ${connectSrc}`,
    `frame-src accounts.google.com`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
    `upgrade-insecure-requests`,
  ];

  return directives.join('; ');
}

// Next 16 renombra `middleware` → `proxy`. El export function debe llamarse
// `proxy` para que el runtime lo reconozca.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDev = process.env.NODE_ENV !== 'production';

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

  // Generate nonce per-request para CSP. Usamos crypto.randomUUID que
  // esta disponible en edge runtime. Server Components lo leen via
  // app/lib/nonce.ts → headers().get('x-nonce').
  const nonce = crypto.randomUUID();
  const cspHeader = buildCspHeader(nonce, isDev);

  // Pasar nonce a Server Components via request header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  // Crear response que pasa los headers modificados al downstream
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Headers de seguridad
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', cspHeader);

  // CSP Report-Only en paralelo: monitoreamos violaciones sin bloquear.
  // Si una directiva nueva rompe algo, lo detectamos sin afectar usuarios.
  // El report-uri apunta a un proxy interno (/api/csp-report) para no
  // exponer URL del backend ni Sentry. Cuando este pulido, mover a
  // enforcing-only y borrar este Report-Only.
  if (process.env.CSP_REPORT_ONLY === 'true') {
    const reportOnlyCsp = cspHeader.replace(/;\s*upgrade-insecure-requests/, '');
    response.headers.set(
      'Content-Security-Policy-Report-Only',
      `${reportOnlyCsp}; report-uri /api/csp-report`,
    );
  }

  return response;
}

// El matcher excluye assets estaticos para no aplicar CSP a archivos que
// no lo necesitan (imagenes, JS bundle, fonts), pero MANTIENE rutas de
// pagina + checkout + perfil para que CSP y auth gate apliquen.
export const config = {
  matcher: [
    /*
     * Match todos los paths excepto:
     * - _next/static (Next bundle assets)
     * - _next/image (image optimization)
     * - favicon, robots, sitemap (estaticos)
     * - api/* (las APIs tienen su propia logica)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|icon.png).*)',
  ],
};
