import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { clearSession, getSession, setSession } from './session';

const INTERNAL_API_URL = process.env.INTERNAL_API_URL;

if (!INTERNAL_API_URL && process.env.NODE_ENV === 'production') {
  throw new Error('INTERNAL_API_URL es obligatoria en producción (backend privado VPC)');
}

const BASE = INTERNAL_API_URL ?? 'http://localhost:3000';

interface ProxyOptions {
  /** Si true, inyecta Bearer token desde la cookie de sesión */
  authenticated?: boolean;
  /** Headers extra a reenviar */
  extraHeaders?: Record<string, string>;
  /** Parsear body del request para reenviar */
  forwardBody?: boolean;
}

interface RefreshResult {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}

/**
 * Intenta refrescar el access_token usando el refresh_token de la cookie.
 * Devuelve el nuevo access_token si tuvo éxito, o null si hay que re-login.
 *
 * Crítico: usa el endpoint del backend directo (no recursión a través de
 * este módulo) para evitar loops. Si el refresh falla, limpia la sesión.
 */
const tryRefreshAccessToken = async (): Promise<string | null> => {
  const session = await getSession();
  if (!session?.refresh_token) return null;

  try {
    const res = await fetch(`${BASE}/ecommerce-auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
      cache: 'no-store',
    });
    if (!res.ok) {
      await clearSession();
      return null;
    }
    const data = (await res.json()) as RefreshResult;
    await setSession({
      ...session,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
    });
    return data.access_token;
  } catch {
    await clearSession();
    return null;
  }
};

/**
 * Hace el fetch al backend con un access_token dado. Retorna el Response
 * crudo para que el caller decida cómo manejar status/body.
 */
const doFetch = async (
  url: string,
  method: string,
  headers: Record<string, string>,
  body: string | undefined,
): Promise<Response> => {
  return fetch(url, {
    method,
    headers,
    body,
    cache: 'no-store',
  });
};

/**
 * Helper central para Route Handlers BFF. Reenvía una request del browser
 * al backend NestJS privado, inyectando credenciales desde la cookie httpOnly.
 *
 * Maneja expiración de access_token: ante un 401 intenta un refresh usando
 * el refresh_token de la cookie; si funciona, reintenta la request original.
 * Si el refresh falla, limpia la cookie y devuelve 401 al cliente.
 */
export const proxyToBackend = async (
  req: NextRequest,
  backendPath: string,
  options: ProxyOptions = {},
): Promise<NextResponse> => {
  const { authenticated = false, extraHeaders = {}, forwardBody = true } = options;

  const url = new URL(backendPath, BASE);
  if (!backendPath.includes('?')) {
    req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));
  }

  const method = req.method.toUpperCase();
  const hasBody = forwardBody && !['GET', 'HEAD'].includes(method);

  let body: string | undefined;
  if (hasBody) {
    try {
      const parsed = await req.json();
      body = JSON.stringify(parsed);
    } catch {
      body = undefined;
    }
  }

  const buildHeaders = (token: string | null): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extraHeaders,
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  let token: string | null = null;
  if (authenticated) {
    const session = await getSession();
    token = session?.access_token ?? null;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
  }

  let backendRes = await doFetch(url.toString(), method, buildHeaders(token), body);

  // Auto-refresh: si el backend devuelve 401 y estamos autenticados,
  // intentar refresh y reintentar una sola vez.
  if (authenticated && backendRes.status === 401) {
    const newToken = await tryRefreshAccessToken();
    if (newToken) {
      backendRes = await doFetch(url.toString(), method, buildHeaders(newToken), body);
    } else {
      return NextResponse.json({ error: 'Sesión expirada' }, { status: 401 });
    }
  }

  const contentType = backendRes.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  }
  const text = await backendRes.text();
  return new NextResponse(text, { status: backendRes.status });
};

/**
 * Fetch directo al backend privado desde Route Handlers / Server Actions
 * cuando se necesita manipular la respuesta (ej: setear cookie de sesión
 * después de un login). También implementa auto-refresh en 401.
 */
export const backendFetch = async <T = unknown>(
  path: string,
  init: RequestInit & { authenticated?: boolean } = {},
): Promise<{ ok: boolean; status: number; data: T | null }> => {
  const { authenticated, headers = {}, ...rest } = init;

  const buildHeaders = (token: string | null): Record<string, string> => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  };

  let token: string | null = null;
  if (authenticated) {
    const session = await getSession();
    token = session?.access_token ?? null;
  }

  let res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: buildHeaders(token),
    cache: 'no-store',
  });

  if (authenticated && res.status === 401) {
    const newToken = await tryRefreshAccessToken();
    if (newToken) {
      res = await fetch(`${BASE}${path}`, {
        ...rest,
        headers: buildHeaders(newToken),
        cache: 'no-store',
      });
    }
  }

  const contentType = res.headers.get('content-type') ?? '';
  const data: T | null = contentType.includes('application/json')
    ? ((await res.json().catch(() => null)) as T | null)
    : null;
  return { ok: res.ok, status: res.status, data };
};
