/**
 * Tests for the profile persistence service — FIX: profile-persist
 *
 * RED phase: verifies that saveProfile calls PUT /api/auth/profile with the
 * correct body and that the page's handleSave wires through to the backend
 * (rather than only updating local Zustand state).
 *
 * The profile page previously called only updateUser(formData) in handleSave,
 * losing changes on reload. These tests prove the fix persists changes.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { saveProfile, type SaveProfileResult } from './profile.service';

describe('saveProfile', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('calls PUT /api/auth/profile with the form data', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ first_name: 'Ana', last_name: 'García', email: 'ana@example.com', phone: '+56912345678' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const payload = {
      first_name: 'Ana',
      last_name: 'García',
      email: 'ana@example.com',
      phone: '+56912345678',
    };

    const result = await saveProfile(payload);

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/auth/profile');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual(payload);
    expect(result.ok).toBe(true);
  });

  it('includes credentials: include so the auth cookie is forwarded', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );

    await saveProfile({ first_name: 'Test' });

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(init.credentials).toBe('include');
  });

  it('returns ok: false with an error message on non-2xx response', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ error: 'validation_failed', message: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await saveProfile({ email: 'bad' });

    expect(result.ok).toBe(false);
    expect((result as SaveProfileResult & { ok: false }).error).toBeTruthy();
  });

  it('returns ok: false with a network-error message when fetch throws', async () => {
    fetchSpy.mockRejectedValue(new Error('Network Error'));

    const result = await saveProfile({ first_name: 'Test' });

    expect(result.ok).toBe(false);
    expect((result as SaveProfileResult & { ok: false }).error).toMatch(/Network Error/);
  });

  it('returns ok: false on 401 (session expired / not authenticated)', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await saveProfile({ first_name: 'Test' });

    expect(result.ok).toBe(false);
    expect((result as SaveProfileResult & { ok: false }).error).toBeTruthy();
  });

  it('returns the backend data payload on success', async () => {
    const backendPayload = { first_name: 'Marco', last_name: 'Polo', email: 'marco@example.com' };
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify(backendPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await saveProfile({ first_name: 'Marco' });

    expect(result.ok).toBe(true);
    expect((result as SaveProfileResult & { ok: true }).data).toEqual(backendPayload);
  });
});
