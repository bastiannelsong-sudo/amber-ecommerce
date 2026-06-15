/**
 * Client-side profile persistence service.
 *
 * Calls PUT /api/auth/profile (BFF route) to persist profile changes to the
 * backend. The BFF validates the body with zod and proxies to the backend with
 * the authenticated session cookie.
 *
 * Returns a discriminated union so the caller can surface success/error
 * without try/catch at the call site.
 */

export type ProfilePayload = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
};

export type SaveProfileResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

export const saveProfile = async (payload: ProfilePayload): Promise<SaveProfileResult> => {
  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      const errBody = body as Record<string, unknown> | null;
      const message =
        (errBody?.message as string | undefined) ||
        (errBody?.error as string | undefined) ||
        `HTTP ${res.status}`;
      return { ok: false, error: message };
    }

    return { ok: true, data: body };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return { ok: false, error: message };
  }
};
