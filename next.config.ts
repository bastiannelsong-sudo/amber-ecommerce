import type { NextConfig } from "next";

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
            // Defensa contra XSS / clickjacking / form hijacking. Cada
            // directiva tiene su justificación documentada en
            // arquitectura/amber_arquitectura_v1.drawio.xml (página CSP details).
            //
            // Debilidades conocidas: 'unsafe-inline' y 'unsafe-eval' en
            // script-src/style-src son requeridas por Next 16 + Tailwind +
            // hidratación RSC. Migrar a nonce-based CSP es la mejora
            // estructural a futuro (no trivial).
            //
            // Cuando se active Sentry: agregar *.sentry.io a connect-src
            // y configurar `report-uri https://sentry.io/api/<project>/security/`
            // para recibir violaciones de CSP en el dashboard.
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' accounts.google.com",
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
              "font-src 'self' fonts.gstatic.com",
              "img-src 'self' data: blob: images.unsplash.com http2.mlstatic.com *.mlstatic.com",
              `connect-src 'self' ${isDev ? 'http://localhost:* ws://localhost:* wss://local.ambernelson.cl https://local.ambernelson.cl' : ''} api.ambernelson.cl accounts.google.com wa.me`,
              "frame-src accounts.google.com",
              // Hardening agregado 2026-04-29 (CSP page del drawio):
              "object-src 'none'",            // bloquea <object>/<embed>/<applet>
              "base-uri 'self'",              // previene base-tag injection (XSS amplification)
              "form-action 'self'",           // forms sólo POSTean al mismo origen (anti-credential-theft)
              "frame-ancestors 'none'",       // duplica X-Frame-Options DENY (versión moderna)
              'upgrade-insecure-requests',    // sube cualquier recurso HTTP a HTTPS automático
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
