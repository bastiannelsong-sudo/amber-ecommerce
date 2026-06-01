import 'server-only';
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Capability token de acceso por orden.
 *
 * Permite que un guest (sin sesión) haga polling de su orden inmediatamente
 * después del checkout, sin exponer PII a nadie que adivine el order_number.
 *
 * Diseño:
 *   token = base64url(JSON { order_number, exp }) + "." + HMAC-SHA256(payload)
 *
 * Propiedades de seguridad:
 *   - El payload NO contiene PII (solo order_number + exp).
 *   - El HMAC usa el mismo SESSION_SECRET del servidor → imposible forjar sin el secreto.
 *   - La comparación es en tiempo constante (timingSafeEqual) → no hay timing oracle.
 *   - El exp se valida server-side → el browser no controla el TTL.
 *   - Una cookie de la orden A no autoriza la orden B (el order_number es parte del HMAC).
 */

const ORDER_ACCESS_COOKIE_PREFIX = 'amber_oa_'; // + orderNumber como sufijo
const TOKEN_TTL_SECONDS = 60 * 60; // 1 hora

interface OrderAccessPayload {
  order_number: string;
  exp: number; // Unix timestamp
}

const getSecret = (): string => {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'SESSION_SECRET debe existir y tener al menos 32 caracteres',
    );
  }
  return secret;
};

const signPayload = (payload: string): string => {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
};

const safeEqual = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
};

/**
 * Firma un token de acceso para una orden concreta.
 * Devuelve un string "payload.signature" donde:
 *   payload = base64url(JSON { order_number, exp })
 */
export const signOrderAccessToken = (orderNumber: string): string => {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const data: OrderAccessPayload = { order_number: orderNumber, exp };
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
};

/**
 * Verifica un token de acceso. Retorna el order_number si el token es:
 *   - Bien formado (exactamente 2 partes separadas por ".")
 *   - Firma HMAC válida (tiempo constante)
 *   - No expirado (exp > now, validado server-side)
 *
 * Devuelve null en cualquier otro caso. No lanza excepciones.
 */
export const verifyOrderAccessToken = (token: string): string | null => {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  if (!payload || !signature) return null;

  // Verificar firma en tiempo constante.
  let expectedSig: string;
  try {
    expectedSig = signPayload(payload);
  } catch {
    return null;
  }

  if (!safeEqual(signature, expectedSig)) return null;

  // Decodificar payload.
  let data: OrderAccessPayload;
  try {
    const json = Buffer.from(payload, 'base64url').toString('utf-8');
    data = JSON.parse(json) as OrderAccessPayload;
  } catch {
    return null;
  }

  // Validar TTL server-side.
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!data.exp || data.exp <= nowSeconds) return null;

  if (!data.order_number) return null;

  return data.order_number;
};

/**
 * Nombre de la cookie para una orden concreta.
 * Usamos el order_number como sufijo para que cada orden tenga su propia
 * cookie, evitando colisiones cuando hay múltiples compras en la misma sesión.
 *
 * El nombre se sanitiza: solo alfanuméricos y guiones (RFC 6265 §4.1.1).
 */
const cookieName = (orderNumber: string): string => {
  const safe = orderNumber.replace(/[^a-zA-Z0-9-]/g, '-');
  return `${ORDER_ACCESS_COOKIE_PREFIX}${safe}`;
};

/**
 * Setea la cookie de acceso firmada para una orden.
 * Llamar desde Route Handlers POST /api/orders y /api/orders/card-payment
 * después de crear la orden con éxito.
 *
 * Flags:
 *   httpOnly  → JavaScript del browser no puede leerla (protección XSS)
 *   Secure    → solo HTTPS en producción
 *   SameSite=Lax → protección CSRF razonable (permite GET cross-site para
 *                  links directos, pero no POST cross-site)
 *   maxAge    → vida corta (1h) alineada con el TTL del token
 */
export const setOrderAccessCookie = async (orderNumber: string): Promise<void> => {
  const token = signOrderAccessToken(orderNumber);
  const store = await cookies();
  store.set(cookieName(orderNumber), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS,
  });
};

/**
 * Lee y verifica la cookie de acceso para una orden concreta desde el request.
 * Devuelve el order_number si la cookie existe y es válida, o null si no.
 *
 * La verificación incluye:
 *   - Existencia de la cookie (nombre = prefix + orderNumber sanitizado)
 *   - Firma HMAC válida (timingSafeEqual)
 *   - No expirada (exp server-side)
 *   - order_number del token == orderNumber del parámetro (binding por orden)
 */
export const verifyOrderAccessCookie = async (orderNumber: string): Promise<string | null> => {
  const store = await cookies();
  const raw = store.get(cookieName(orderNumber))?.value;
  if (!raw) return null;

  const tokenOrderNumber = verifyOrderAccessToken(raw);
  if (!tokenOrderNumber) return null;

  // Verificación crítica: el order_number del token debe coincidir exactamente
  // con el de la ruta. Esto previene que una cookie de la orden B autorice la orden A.
  if (tokenOrderNumber !== orderNumber) return null;

  return tokenOrderNumber;
};
