import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        // Save token to localStorage for API client
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
        }

        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        // Clear token from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }

        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
    }),
    {
      name: 'amber-auth-storage',
    }
  )
);
