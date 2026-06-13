/**
 * BFF request body validation helper — BFF-SEC-02, BFF-SEC-03, ADR-002
 *
 * Returns a discriminated union:
 *   { ok: true; data: T }         — valid body, unknown keys stripped
 *   { ok: false; response: NextResponse } — 400 with structured error shape
 *
 * Reads the body ONCE (NextRequest body is a one-shot stream).
 * No server-only import — must remain importable in test environments.
 */

import { NextResponse, type NextRequest } from 'next/server';
import type { ZodSchema, ZodError } from 'zod';

type ValidationSuccess<T> = { ok: true; data: T };
type ValidationFailure = { ok: false; response: NextResponse };
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

const buildIssues = (zodError: ZodError): Array<{ field: string; message: string }> =>
  zodError.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: 'Invalid value',
  }));

export const validateBody = async <T>(
  request: NextRequest,
  schema: ZodSchema<T>,
): Promise<ValidationResult<T>> => {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'invalid_request', message: 'Malformed JSON body' },
        { status: 400 },
      ),
    };
  }

  const result = schema.safeParse(raw);

  if (!result.success) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'validation_failed',
          message: 'Invalid request body',
          issues: buildIssues(result.error),
        },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: result.data };
};
