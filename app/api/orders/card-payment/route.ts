import { NextResponse, type NextRequest } from 'next/server';
import { backendFetch } from '../../../lib/bff-proxy';
import { getSession } from '../../../lib/session';
import { setOrderAccessCookie } from '../../../lib/order-access';

interface CardPaymentResponse {
  order_number?: string;
  [key: string]: unknown;
}

/**
 * POST /api/orders/card-payment — proxy al backend del flow Bricks Auth/Capture.
 *
 * El frontend (componente CardPaymentBrick) tokeniza la tarjeta vía MP Bricks
 * SDK en el browser y manda acá el token + datos de orden. Backend crea
 * orden + ejecuta Payment.create con capture: false → status authorized.
 *
 * Por qué BFF y no llamada directa al backend:
 *   1. Cumple ARCH-001 (browser nunca habla al backend NestJS directo)
 *   2. Inyecta el x-internal-api-key + JWT del cookie httpOnly si hay sesión
 *   3. Permite logging/rate-limiting en una sola capa Next.js
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
  const session = await getSession();
  const userToken = session?.access_token ?? null;

  const body = await req.json().catch(() => ({}));

  // Construir headers: Bearer opcional (guest sin sesión no envía token)
  // + x-internal-api-key para autenticar la request ante el backend privado.
  const extraHeaders: Record<string, string> = {};
  if (userToken) extraHeaders['Authorization'] = `Bearer ${userToken}`;
  const internalKey = process.env.INTERNAL_API_KEY;
  if (internalKey) extraHeaders['x-internal-api-key'] = internalKey;

  const { ok, status, data } = await backendFetch<CardPaymentResponse>(
    '/ecommerce/orders/card-payment',
    {
      method: 'POST',
      body: JSON.stringify(body),
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
