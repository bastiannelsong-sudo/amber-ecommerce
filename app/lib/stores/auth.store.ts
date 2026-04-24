import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

/**
 * Store de auth del cliente — SOLO maneja la representación del usuario.
 *
 * Los tokens JWT (access_token / refresh_token) viven en una cookie httpOnly
 * firmada (`amber_session`) seteada por los Route Handlers de /api/auth/*.
 * El JS del browser NO puede leerlos (mitiga XSS).
 *
 * Para saber si la sesión sigue válida, el cliente consulta GET /api/auth/me;
 * si devuelve 401, el store se limpia.
 */

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  updateUser: (user: Partial<User>) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },

      clear: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'amber-auth-storage',
      // Solo persistir el perfil — nada sensible cruza localStorage.
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
