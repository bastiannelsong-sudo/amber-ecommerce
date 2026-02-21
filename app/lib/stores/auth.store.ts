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
        // Guardar token en localStorage para el API client
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
        // Limpiar todos los datos de autenticación
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('amber-auth-storage');
          sessionStorage.clear();
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
