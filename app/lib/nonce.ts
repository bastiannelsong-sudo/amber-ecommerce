import 'server-only';
import { headers } from 'next/headers';

/**
 * Lee el nonce CSP del request actual. El nonce es generado en
 * `proxy.ts` (Next 16 middleware) por cada request y pasado a Server
 * Components via header `x-nonce`.
 *
 * Uso en RSC:
 *   import { getNonce } from '@/app/lib/nonce';
 *   const nonce = await getNonce();
 *   return <Script src="..." nonce={nonce} />;
 *
 * Si no hay nonce (ej: build-time, ISR cache), devuelve string vacio.
 * Next.js auto-tagea sus propios scripts con el nonce del response —
 * sólo necesitas el nonce explicito para `<Script>` o `<script>`
 * inyectados manualmente.
 */
export async function getNonce(): Promise<string> {
  try {
    const headersList = await headers();
    return headersList.get('x-nonce') ?? '';
  } catch {
    // headers() puede tirar si se llama fuera de un request context
    // (build static generation). En ese caso, no hay nonce — el script
    // será cacheado y no necesita el atributo.
    return '';
  }
}
