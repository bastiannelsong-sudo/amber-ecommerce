import type { NextRequest } from 'next/server';

/**
 * Extracts the client IP from the x-forwarded-for header.
 * Uses the first entry (leftmost = original client in ALB topology).
 * Falls back to '127.0.0.1' if the header is absent or empty.
 *
 * Uses || (not ??) so an empty string first entry also triggers fallback.
 * BFF-RL-03, ADR-4
 */
export const getClientIp = (req: NextRequest): string =>
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
