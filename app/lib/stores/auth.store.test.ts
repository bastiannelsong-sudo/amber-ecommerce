import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth.store';
import type { User } from '../types';

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  auth_providers: ['email'],
  is_verified: true,
};

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
    });
  });

  describe('setUser', () => {
    it('sets user e isAuthenticated=true', () => {
      useAuthStore.getState().setUser(mockUser);
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('setUser(null) deja isAuthenticated=false', () => {
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setUser(null);
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('clear', () => {
    it('limpia user y isAuthenticated', () => {
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().clear();
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('updateUser', () => {
    it('hace merge parcial del user', () => {
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().updateUser({ first_name: 'Updated' });
      const state = useAuthStore.getState();
      expect(state.user?.first_name).toBe('Updated');
      expect(state.user?.last_name).toBe('User');
    });

    it('no hace nada si user es null', () => {
      useAuthStore.getState().updateUser({ first_name: 'Updated' });
      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});
