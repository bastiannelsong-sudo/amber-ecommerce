'use client';

import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuthStore } from '../lib/stores/auth.store';

const AuthModal = dynamic(() => import('../components/AuthModal'), {
  ssr: false,
});

/**
 * Pagina /login dedicada (no SSR-renderable, lo hace via Client).
 * Existe para que el `proxy.ts` pueda redirigir desde rutas protegidas
 * con `?next=` y el usuario tenga un destino unequivoco para loguearse.
 *
 * Comportamiento:
 *   - Si ya hay sesion, redirige automaticamente a `next` (o `/perfil`).
 *   - Si no, renderea el AuthModal abierto. Al cerrar el modal sin
 *     loguearse → vuelve al catalogo.
 *   - Tras login exitoso, el authStore se actualiza y el useEffect
 *     dispara la navegacion a `next`.
 */
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  // Validar `next` contra open redirect: solo paths internos (empieza con `/`
  // pero NO con `//` ni `/\`, que el browser interpreta como protocol-relative).
  const rawNext = searchParams.get('next');
  const next =
    rawNext && /^\/(?![/\\])/.test(rawNext) ? rawNext : '/perfil';
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (user) {
      router.replace(next);
    }
  }, [user, next, router]);

  return (
    <>
      <AuthModal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          // Sin login y cerro el modal → al catalogo (no quedarse en /login).
          router.replace('/catalogo');
        }}
        initialMode="login"
      />
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-platinum-700 mb-4">
            Iniciá sesión para continuar a{' '}
            <span className="text-obsidian-900 font-medium">{next}</span>
          </p>
          {!open && (
            <button
              onClick={() => setOpen(true)}
              className="px-6 py-3 bg-obsidian-900 text-white text-sm uppercase tracking-widest font-medium hover:bg-amber-gold-500 transition-colors"
            >
              Abrir login
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-pearl-50">
      <Header />
      <Suspense fallback={null}>
        <LoginContent />
      </Suspense>
      <Footer />
    </div>
  );
}
