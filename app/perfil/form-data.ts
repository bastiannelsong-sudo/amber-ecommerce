import type { User } from '../lib/types';

export interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

/**
 * Builds the profile form's initial / resynced values from a User object.
 * Returns placeholder strings when user is null (guest / hydration delay).
 *
 * Pure function — no side effects, easy to test.
 */
export function buildFormData(user: Pick<User, 'first_name' | 'last_name' | 'email' | 'phone'> | null): ProfileFormData {
  return {
    first_name: user?.first_name || 'Usuario',
    last_name: user?.last_name || 'Demo',
    email: user?.email || 'usuario@example.com',
    phone: user?.phone || '+56 9 1234 5678',
  };
}
