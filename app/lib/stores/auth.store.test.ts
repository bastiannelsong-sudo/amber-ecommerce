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
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  describe('login', () => {
    it('should set user and tokens on login', () => {
      useAuthStore.getState().login(mockUser, 'access-token', 'refresh-token');
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear user and tokens on logout', () => {
      useAuthStore.getState().login(mockUser, 'access-token', 'refresh-token');
      useAuthStore.getState().logout();
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setTokens', () => {
    it('should update tokens', () => {
      useAuthStore.getState().login(mockUser, 'old-access', 'old-refresh');
      useAuthStore.getState().setTokens('new-access', 'new-refresh');
      const state = useAuthStore.getState();
      expect(state.token).toBe('new-access');
      expect(state.refreshToken).toBe('new-refresh');
    });
  });

  describe('updateUser', () => {
    it('should partially update user data', () => {
      useAuthStore.getState().login(mockUser, 'token', 'refresh');
      useAuthStore.getState().updateUser({ first_name: 'Updated' });
      const state = useAuthStore.getState();
      expect(state.user?.first_name).toBe('Updated');
      expect(state.user?.last_name).toBe('User');
    });

    it('should not update if user is null', () => {
      useAuthStore.getState().updateUser({ first_name: 'Updated' });
      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});
