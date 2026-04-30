import { NextResponse, type NextRequest } from 'next/server';

/**
 * Endpoint que recibe reportes de violaciones de CSP enviados por el
 * browser cuando alguna directiva se rompe.
 *
 * Activado solo cuando `CSP_REPORT_ONLY=true` en env. La idea:
 *   1. Activar en staging/canary → observar reportes 1 semana.
 *   2. Si no hay falsos positivos importantes → desactivar Report-Only
 *      y dejar solo la CSP enforcing.
 *   3. Si aparece algo legitimo bloqueado → ajustar la directiva en
 *      proxy.ts → repetir.
 *
 * Hoy: log a stdout (Docker logs lo recoge). Cuando se active Sentry,
 * forwardear via Sentry.captureMessage para que aparezca en el dashboard.
 *
 * Formato del payload (CSP Level 2):
 *   { "csp-report": {
 *       "document-uri": "...",
 *       "violated-directive": "script-src",
 *       "blocked-uri": "...",
 *       "line-number": 42,
 *       ...
 *   } }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({}));
    const report = body['csp-report'] ?? body;

    // eslint-disable-next-line no-console
    console.warn('[CSP violation]', JSON.stringify(report));

    // TODO: cuando Sentry esté activo (PR #19), forwardear:
    //   Sentry.captureMessage('CSP violation', { extra: report });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[CSP report] handler error:', err);
  }

  // CSP spec: 204 No Content es la respuesta correcta.
  return new NextResponse(null, { status: 204 });
}
