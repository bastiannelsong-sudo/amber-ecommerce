/**
 * Tests for validateBody helper — BFF-SEC-02, BFF-SEC-03
 *
 * Covers:
 * - Valid body returns { ok: true, data } with unknown keys stripped
 * - Invalid body returns { ok: false, response } with status 400 and { error, issues }
 * - Malformed JSON returns { ok: false, response } with { error: 'invalid_request' }
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';

// Hoist mocks before imports
vi.mock('./bff-proxy', () => ({
  backendFetch: vi.fn(),
  proxyToBackend: vi.fn(),
}));

import { validateBody } from './validation';

const testSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
});

const makeRequest = (body: unknown, options?: { malformed?: boolean }) => {
  if (options?.malformed) {
    return new NextRequest('http://localhost/api/test', {
      method: 'POST',
      body: 'not-valid-json{{{',
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new NextRequest('http://localhost/api/test', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
};

describe('validateBody', () => {
  it('returns { ok: true, data } for valid body', async () => {
    const req = makeRequest({ name: 'Alice', age: 30 });
    const result = await validateBody(req, testSchema);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ name: 'Alice', age: 30 });
    }
  });

  it('strips unknown fields and returns ok: true', async () => {
    const req = makeRequest({ name: 'Alice', age: 30, __proto__: 'evil', extra: 'drop' });
    const result = await validateBody(req, testSchema);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.keys(result.data)).not.toContain('__proto__');
      expect(Object.keys(result.data)).not.toContain('extra');
    }
  });

  it('returns { ok: false, response } with status 400 on validation failure', async () => {
    const req = makeRequest({ name: '' }); // missing age, empty name
    const result = await validateBody(req, testSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
    }
  });

  it('returns 400 response with { error, issues } shape on validation failure', async () => {
    const req = makeRequest({ name: '' });
    const result = await validateBody(req, testSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = await result.response.json() as Record<string, unknown>;
      expect(typeof body.error).toBe('string');
      expect(Array.isArray(body.issues)).toBe(true);
    }
  });

  it('returns 400 response with content-type application/json on failure', async () => {
    const req = makeRequest({ name: '' });
    const result = await validateBody(req, testSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.headers.get('content-type')).toContain('application/json');
    }
  });

  it('returns { ok: false, response } with error: "invalid_request" for malformed JSON', async () => {
    const req = makeRequest(null, { malformed: true });
    const result = await validateBody(req, testSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json() as Record<string, unknown>;
      expect(body.error).toBe('invalid_request');
    }
  });

  it('does not include raw zod error objects in response (BFF-SEC-02)', async () => {
    const req = makeRequest({ age: 'not-a-number' });
    const result = await validateBody(req, testSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = await result.response.json() as Record<string, unknown>;
      expect(body).not.toHaveProperty('zodError');
      expect(body).not.toHaveProperty('stack');
    }
  });
});
