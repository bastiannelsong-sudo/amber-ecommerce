import { NextResponse, type NextRequest } from 'next/server';
import { backendFetch } from '../../lib/bff-proxy';
import { getSession } from '../../lib/session';
import { setOrderAccessCookie } from '../../lib/order-access';
import { validateBody } from '../../lib/validation';
import { createOrderSchema } from '../../lib/ecommerce/schemas';

interface CreateOrderResponse {
  order_number?: string;
  [key: string]: unknown;
}

/**
 * POST /api/orders → crear orden (checkout — Checkout Pro con redirect MP).
 *
 * optionalAuth: si el usuario está logueado se inyecta JWT y la orden
 * queda asociada al customer; si es guest la orden se crea sin owner.
 *
 * Después de crear la orden con éxito, emite una cookie de acceso firmada
 * (HMAC) para ese order_number concreto. Esto permite que /checkout/resultado
 * haga polling GET /api/orders/:orderNumber incluso cuando el usuario no tiene
 * sesión activa (guest checkout flow).
 *
 * La cookie es httpOnly + Secure + SameSite=Lax con TTL de 1h, y el token
 * firmado contiene solo el order_number + exp (CERO PII).
 */
export async function POST(req: NextRequest) {
  // Validate body first — sole body reader (ADR S2-001, BFF-NAV-02)
  const v = await validateBody(req, createOrderSchema);
  if (!v.ok) return v.response;

  const session = await getSession();
  const userToken = session?.access_token ?? null;

  // Construir headers: Bearer opcional (guest sin sesión no envía token)
  // + x-internal-api-key para autenticar la request ante el backend privado.
  const extraHeaders: Record<string, string> = {};
  if (userToken) extraHeaders['Authorization'] = `Bearer ${userToken}`;
  const internalKey = process.env.INTERNAL_API_KEY;
  if (internalKey) extraHeaders['x-internal-api-key'] = internalKey;

  const { ok, status, data } = await backendFetch<CreateOrderResponse>(
    '/ecommerce/orders',
    {
      method: 'POST',
      body: JSON.stringify(v.data),
      headers: extraHeaders,
    },
  );

  const response = NextResponse.json(data ?? {}, { status });

  // Si la creación fue exitosa y tenemos order_number, emitir cookie de acceso
  // firmada para ese order_number. Permite el polling guest post-checkout.
  if (ok && data?.order_number) {
    await setOrderAccessCookie(data.order_number);
  }

  return response;
}
