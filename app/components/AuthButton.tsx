'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuthStore } from '../lib/stores/auth.store';
import { authService } from '../lib/services/auth.service';
import toast from 'react-hot-toast';

/**
 * AuthModal cargado dinámicamente — solo entra al bundle cuando el usuario
 * abre el modal por primera vez. Ahorra ~30KB iniciales (motion + formularios).
 * `ssr: false` porque depende de `window.google` (Google Identity Services).
 */
const AuthModal = dynamic(() => import('./AuthModal'), { ssr: false });

/**
 * Botón de autenticación en el header.
 *
 * - Visitante anónimo: ícono de persona → abre modal de login.
 * - Usuario autenticado: avatar con inicial + dropdown (Perfil / Pedidos / Cerrar sesión).
 *
 * Hidratación segura: el usuario vive en `useAuthStore` (zustand/persist con
 * localStorage). Server SSR siempre renderiza estado anónimo; tras `hasMounted`
 * el cliente revela el estado real. Esto evita el hydration mismatch clásico
 * descrito en la regla del README de Next.js.
 *
 * Lazy load del modal: el bundle del header se mantiene pequeño; el modal
 * pesa solo cuando alguien hace click en login. Patrón `bundle-dynamic-imports`
 * de Vercel React best practices.
 */
export default function AuthButton() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearAuth = useAuthStore((s) => s.clear);

  const [hasMounted, setHasMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Cerrar dropdown al click fuera o ESC.
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isMenuOpen]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    setIsMenuOpen(false);
    try {
      await authService.logout();
      clearAuth();
      toast.success('Sesión cerrada');
    } catch {
      // Aunque falle el endpoint, limpiamos el cliente — la cookie httpOnly
      // se invalidará en el próximo request porque el server no la encontrará
      // referenciada. Mejor degradar silenciosamente que dejar UI inconsistente.
      clearAuth();
    } finally {
      setIsLoggingOut(false);
    }
  }, [clearAuth]);

  // ─── Render anónimo (también es el SSR fallback inicial) ──────────────
  // Antes de hidratar SIEMPRE mostramos el botón anónimo para que el HTML
  // del server matchee el primer render del cliente.
  if (!hasMounted || !isAuthenticated || !user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          aria-label="Iniciar sesión"
          className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-obsidian-700 hover:text-amber-gold-500 transition-colors duration-300 cursor-pointer"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </button>
        {isModalOpen && (
          <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        )}
      </>
    );
  }

  // ─── Render autenticado: avatar con inicial + dropdown ────────────────
  const initial = (user.first_name?.[0] ?? user.email?.[0] ?? '?').toUpperCase();
  const displayName = user.first_name ?? user.email ?? 'Mi cuenta';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsMenuOpen((v) => !v)}
        aria-label={`Cuenta de ${displayName}`}
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-obsidian-700 hover:text-amber-gold-500 transition-colors duration-300 cursor-pointer"
      >
        <span
          aria-hidden
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-amber-gold-500 to-amber-gold-600 text-white text-xs font-semibold flex items-center justify-center shadow-sm"
        >
          {initial}
        </span>
      </button>

      {isMenuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 bg-white border border-pearl-200 shadow-lg rounded-md overflow-hidden z-50 animate-fade-in"
        >
          <div className="px-4 py-3 border-b border-pearl-200">
            <p className="text-xs uppercase tracking-wider text-platinum-500">
              Hola, {displayName}
            </p>
            {user.email && (
              <p className="text-xs text-obsidian-700 truncate mt-1">{user.email}</p>
            )}
          </div>
          <Link
            href="/perfil"
            role="menuitem"
            onClick={() => setIsMenuOpen(false)}
            className="block px-4 py-2.5 text-sm text-obsidian-700 hover:bg-pearl-50 hover:text-amber-gold-600 transition-colors"
          >
            Mi perfil
          </Link>
          <Link
            href="/perfil?tab=orders"
            role="menuitem"
            onClick={() => setIsMenuOpen(false)}
            className="block px-4 py-2.5 text-sm text-obsidian-700 hover:bg-pearl-50 hover:text-amber-gold-600 transition-colors"
          >
            Mis pedidos
          </Link>
          <Link
            href="/favoritos"
            role="menuitem"
            onClick={() => setIsMenuOpen(false)}
            className="block px-4 py-2.5 text-sm text-obsidian-700 hover:bg-pearl-50 hover:text-amber-gold-600 transition-colors"
          >
            Favoritos
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 border-t border-pearl-200 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoggingOut ? 'Cerrando…' : 'Cerrar sesión'}
          </button>
        </div>
      )}
    </div>
  );
}
