import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';
import { backendFetch } from '../../../lib/bff-proxy';

/**
 * Devuelve el perfil del usuario autenticado (lo deriva de la cookie httpOnly).
 * Útil para hidratar zustand auth.store en el cliente sin exponer tokens.
 *
 * Semántica: "¿quién soy?". "Nadie" (sin sesión) es una RESPUESTA válida,
 * no un error — por eso siempre devuelve 200; el body es `null` cuando no
 * hay sesión. Esto evita ruido en la consola del browser durante la
 * hidratación inicial de visitantes no logueados.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json(null);

  // Intentamos traer el perfil fresco del backend; si falla, devolvemos lo
  // mínimo que ya vive en la cookie.
  const { ok, data } = await backendFetch<Record<string, unknown>>(
    '/ecommerce-auth/profile',
    { authenticated: true },
  );

  if (ok && data) return NextResponse.json(data);

  return NextResponse.json({
    user_id: session.user_id,
    email: session.email,
    first_name: session.first_name,
    last_name: session.last_name,
  });
}
