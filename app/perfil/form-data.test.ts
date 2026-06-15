/**
 * Tests for buildFormData — pure helper that maps an auth-store user object
 * to the profile form's initial / resynced values.
 *
 * Fix L-4: formData must stay in sync with the auth-store user when not editing.
 * The useEffect in page.tsx calls buildFormData(user) and sets state only when
 * isEditing is false — this test verifies the shape produced by the helper.
 */

import { describe, it, expect } from 'vitest';
import { buildFormData } from './form-data';

describe('buildFormData', () => {
  it('maps a fully-populated user to all four form fields', () => {
    const user = {
      first_name: 'Alice',
      last_name: 'Smith',
      email: 'alice@example.com',
      phone: '+56 9 8765 4321',
    };

    const result = buildFormData(user);

    expect(result.first_name).toBe('Alice');
    expect(result.last_name).toBe('Smith');
    expect(result.email).toBe('alice@example.com');
    expect(result.phone).toBe('+56 9 8765 4321');
  });

  it('falls back to placeholder values for missing user fields', () => {
    // User object may lack phone or other optional fields
    const user = {
      first_name: 'Bob',
      last_name: 'Jones',
      email: 'bob@example.com',
      phone: undefined,
    };

    const result = buildFormData(user);

    expect(result.first_name).toBe('Bob');
    expect(result.last_name).toBe('Jones');
    expect(result.email).toBe('bob@example.com');
    expect(result.phone).toBe('+56 9 1234 5678');
  });

  it('falls back to placeholder values when user is null (guest / loading state)', () => {
    const result = buildFormData(null);

    expect(result.first_name).toBe('Usuario');
    expect(result.last_name).toBe('Demo');
    expect(result.email).toBe('usuario@example.com');
    expect(result.phone).toBe('+56 9 1234 5678');
  });
});
