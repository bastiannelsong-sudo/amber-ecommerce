import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Next 16: permitir requests dev (HMR, server actions) desde el tunel CF
  // local.ambernelson.cl. Solo aplica en dev — en prod no es necesario.
  ...(isDev && { allowedDevOrigins: ['local.ambernelson.cl'] }),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'http2.mlstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'http2.mlstatic.com',
      },
    ],
  },
  async redirects() {
    return [
      // Consolidación SEO: /amuletos/regalo ya no existe como landing.
      // Todo tráfico va al hub curado /regalos (evita canibalización de keywords).
      {
        source: '/amuletos/regalo',
        destination: '/regalos',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' accounts.google.com",
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
              "font-src 'self' fonts.gstatic.com",
              "img-src 'self' data: blob: images.unsplash.com http2.mlstatic.com *.mlstatic.com",
              `connect-src 'self' ${isDev ? 'http://localhost:* ws://localhost:* wss://local.ambernelson.cl https://local.ambernelson.cl' : ''} api.ambernelson.cl accounts.google.com wa.me`,
              "frame-src accounts.google.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

/**
 * Wrap con Sentry para inyectar source maps al deploy y reescribir
 * stack traces minified -> originales. No-op si SENTRY_DSN no esta
 * seteado en build time (no envia source maps a ningun lado).
 *
 * silent:true porque sino los logs de Sentry contaminan el output del
 * build. Cambiar a false si hay que debuggear el upload de source maps.
 */
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  // Source maps solo si hay token. Si no, se hace build sin uploadearlos.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  // Tunnel los eventos de Sentry via /monitoring para evitar adblockers.
  tunnelRoute: '/monitoring',
});
