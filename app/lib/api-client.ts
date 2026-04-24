/**
 * Cliente HTTP del browser — apunta SIEMPRE al propio Next.js (/api/*).
 *
 * Implementado con `fetch` nativo (sin axios) para reducir el bundle del
 * cliente ~30KB. La forma pública replica la de axios (`{data}`, errores
 * con `.response?.data?.message`) para no forzar refactor en los callers.
 *
 * Razones:
 *   1. El backend NestJS vive en subnet privada AWS (ver CLAUDE.md y
 *      backlog/arquitectura/ARCH-001-aws-private-network.md). El browser NO
 *      puede llegar a él; solo el server de Next.js puede.
 *   2. La autenticación va por cookie httpOnly firmada, no por Bearer del
 *      cliente. El browser no lee ni setea tokens directamente.
 *
 * Cada Route Handler (`app/api/*`) actúa como BFF: recibe esta request,
 * inyecta el access_token desde la cookie y reenvía al backend interno.
 */

const BASE = '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  // Shape compatible con axios: error.response.data.message
  get response() {
    return { status: this.status, data: this.data };
  }
}

interface RequestConfig {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

interface ApiResponse<T> {
  data: T;
  status: number;
}

const buildUrl = (path: string, params?: RequestConfig['params']): string => {
  const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
  if (!params) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `${url}?${s}` : url;
};

const request = async <T>(
  method: string,
  path: string,
  body?: unknown,
  config?: RequestConfig,
): Promise<ApiResponse<T>> => {
  const hasBody = body !== undefined && !['GET', 'HEAD'].includes(method);
  const res = await fetch(buildUrl(path, config?.params), {
    method,
    credentials: 'include',
    signal: config?.signal,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(config?.headers ?? {}),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type') ?? '';
  const data: unknown = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data
        ? String((data as { message: unknown }).message)
        : null) ?? `HTTP ${res.status}`;
    throw new ApiError(message, res.status, data);
  }

  return { data: data as T, status: res.status };
};

export const apiClient = {
  get: <T = unknown>(path: string, config?: RequestConfig) =>
    request<T>('GET', path, undefined, config),
  post: <T = unknown>(path: string, body?: unknown, config?: RequestConfig) =>
    request<T>('POST', path, body, config),
  put: <T = unknown>(path: string, body?: unknown, config?: RequestConfig) =>
    request<T>('PUT', path, body, config),
  patch: <T = unknown>(path: string, body?: unknown, config?: RequestConfig) =>
    request<T>('PATCH', path, body, config),
  delete: <T = unknown>(path: string, config?: RequestConfig) =>
    request<T>('DELETE', path, undefined, config),
};
