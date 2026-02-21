import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

// TODO: Implementar encriptación de tokens antes de almacenarlos en localStorage.
// Los tokens se almacenan actualmente en texto plano, lo cual es vulnerable a XSS.
// Considerar: 1) Usar httpOnly cookies desde el backend, o
//             2) Encriptar con Web Crypto API antes de persistir.

interface AuthStore {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user, accessToken, refreshToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);
        }

        set({
          user,
          token: accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('amber-auth-storage');
          sessionStorage.clear();
        }

        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },

      setTokens: (accessToken, refreshToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);
        }
        set({ token: accessToken, refreshToken });
      },
    }),
    {
      name: 'amber-auth-storage',
    }
  )
);
