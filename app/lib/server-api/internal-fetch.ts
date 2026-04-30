import 'server-only';

const BASE = process.env.INTERNAL_API_URL ?? 'http://localhost:3000';

/**
 * Wrapper de `fetch` para Server Components que llaman al backend
 * directamente (no via BFF route handler). Inyecta el header
 * `x-internal-api-key` para pasar el guard de Capa 1 del backend.
 *
 * Por que existe: bff-proxy.ts ya inyecta el header para todos los
 * /api/* del Next, pero los Server Components fetchean directo a
 * INTERNAL_API_URL para evitar el round-trip extra (el browser nunca
 * ve esos requests). Esos fetches NO pasan por bff-proxy y necesitan
 * esta funcion.
 *
 * Pasa todas las opciones de fetch tal cual + agrega:
 *   - URL prefixada con INTERNAL_API_URL
 *   - header x-internal-api-key (si esta seteada)
 */
export const internalFetch = async (
  path: string,
  init?: RequestInit,
): Promise<Response> => {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const internalKey = process.env.INTERNAL_API_KEY;

  const headers = new Headers(init?.headers);
  if (internalKey) {
    headers.set('x-internal-api-key', internalKey);
  }

  return fetch(url, {
    ...init,
    headers,
  });
};
