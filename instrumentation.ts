/**
 * Next.js instrumentation hook — corre una vez al inicializar el server.
 * Sentry SDK se carga aca para reportar errores de RSC, Route Handlers y
 * middleware.
 *
 * No-op si SENTRY_DSN no esta seteado. Para activar en prod:
 *   1. Crear proyecto en sentry.io.
 *   2. Setear SENTRY_DSN=https://... en .env.local / ECS task env.
 *   3. Reiniciar el server.
 *
 * Ref: backlog/ops/OPS-001-observabilidad.md
 */
import * as Sentry from '@sentry/nextjs';

export async function register() {
  const DSN = process.env.SENTRY_DSN;
  if (!DSN) return;

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: DSN,
      environment: process.env.NODE_ENV ?? 'development',
      release: process.env.SENTRY_RELEASE,
      sampleRate: 1.0,
      tracesSampleRate: parseFloat(
        process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1',
      ),
      // No spamear con healthchecks ni assets estaticos.
      ignoreTransactions: ['GET /api/health', 'GET /favicon.ico'],
      // PII off por default (cubre cookies, body, headers sensibles).
      sendDefaultPii: false,
      beforeSend(event) {
        if (process.env.NODE_ENV === 'test') return null;
        return event;
      },
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: DSN,
      environment: process.env.NODE_ENV ?? 'development',
      release: process.env.SENTRY_RELEASE,
      tracesSampleRate: parseFloat(
        process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1',
      ),
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
