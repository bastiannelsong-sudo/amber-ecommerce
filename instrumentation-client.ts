/**
 * Sentry client-side instrumentation. Captura errores que ocurren en
 * el browser (Client Components, hidratacion, etc).
 *
 * No-op si NEXT_PUBLIC_SENTRY_DSN no esta seteado. Es la unica variable
 * Sentry que viaja al cliente — el DSN es publico-seguro porque solo
 * permite ESCRIBIR a Sentry, no leer eventos.
 *
 * Setear separadamente de SENTRY_DSN (que es server-only). Para
 * simplificar, se puede usar el mismo valor en ambos.
 */
import * as Sentry from '@sentry/nextjs';

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    sampleRate: 1.0,
    tracesSampleRate: 0.1,
    // Replay solo del 10% de sesiones, 100% si hay error.
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    sendDefaultPii: false,
  });
}
