'use client';

import { useEffect } from 'react';
import { authService } from '../lib/services/auth.service';
import { useAuthStore } from '../lib/stores/auth.store';

/**
 * Hidrata el `useAuthStore` con la verdad del servidor al montar la app.
 *
 * Motivo: el store persiste `user` en localStorage vía zustand/persist.
 * Tras cerrar el browser y volver más tarde, localStorage puede decir
 * "logueado" pero la cookie `amber_session` ya caducó — y cualquier request
 * a `/api/*` daría 401 silencioso. Este componente reconcilia consultando
 * `/api/auth/me` (que a su vez usa la cookie httpOnly).
 *
 * Corre una vez por montaje de la app (nivel root layout).
 */
export default function AuthHydrator() {
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await authService.me();
      if (cancelled) return;
      if (user) setUser(user);
      else clear();
    })();
    return () => {
      cancelled = true;
    };
  }, [setUser, clear]);

  return null;
}
