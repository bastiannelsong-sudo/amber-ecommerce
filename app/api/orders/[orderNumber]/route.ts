import { NextResponse, type NextRequest } from 'next/server';
import { backendFetch } from '../../../lib/bff-proxy';
import { getSession } from '../../../lib/session';
import { verifyOrderAccessCookie } from '../../../lib/order-access';

/**
 * GET /api/orders/:orderNumber — usado por el polling de
 * /checkout/resultado para detectar cuando el webhook MP confirma
 * el pago. La página /orden/[N] (comprobante) NO usa esta ruta:
 * fetchea directo via lib/server-api/orders.ts en el server side.
 *
 * SEGURIDAD: ownership verificado antes de devolver datos.
 *
 * Reglas de acceso (verificar UNA de las dos condiciones):
 *   a) Sesión httpOnly válida cuyo user_id coincide con el customer_id de
 *      la orden → 200 con proyección mínima.
 *   b) Cookie de acceso firmada (HMAC) para ESE order_number concreto,
 *      no expirada → 200 con proyección mínima. Permite guest polling.
 *   - Ninguna de las dos → 403 sin filtrar PII.
 *   - Orden inexistente → propaga el 404 del backend.
 *
 * Proyección mínima (condición 4 — defensa en profundidad):
 *   Solo se devuelve lo necesario para el result page:
 *     order_number, status, total, customer_email, items
 *   La dirección completa y datos personales sensibles (shipping_address,
 *   shipping_city, customer_name, customer_phone, etc.) quedan para el
 *   comprobante permanente /orden/[N] que tiene su propio control de acceso.
 *
 * Por qué 403 (no 404) sin autorización: no queremos confirmar ni negar
 * la existencia del order_number a un usuario no autorizado.
 */

interface OrderData {
  order_number?: string;
  status?: string;
  total?: number | string;
  customer_email?: string;
  customer_id?: number | null;
  items?: unknown[];
  [key: string]: unknown;
}

/**
 * Proyección mínima para el polling de resultado.
 * Devuelve solo lo necesario — NO la dirección ni datos personales completos.
 */
const toPollingProjection = (data: OrderData): Partial<OrderData> => ({
  order_number: data.order_number,
  status: data.status,
  total: data.total,
  customer_email: data.customer_email,
  items: data.items,
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await params;

  // 1. Verificar autorización: sesión dueña OR cookie de acceso válida por orden.
  const session = await getSession();
  const accessCookieOrderNumber = await verifyOrderAccessCookie(orderNumber);

  const hasSessionAccess = !!session; // se verificará ownership contra el backend
  const hasCapabilityAccess = accessCookieOrderNumber === orderNumber;

  // Si ninguno de los dos mecanismos presenta credenciales → 403 inmediato.
  if (!hasSessionAccess && !hasCapabilityAccess) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 403 });
  }

  // 2. Obtener la orden del backend.
  //    Si hay sesión, la inyectamos (authenticated: true) para que el backend
  //    pueda enriquecer datos. Si es solo por cookie de acceso, no hay JWT
  //    de sesión → usamos backendFetch sin autenticación bearer (el endpoint
  //    del backend ya valida la x-internal-api-key que bff-proxy inyecta).
  const { ok, status, data } = await backendFetch<OrderData>(
    `/ecommerce/orders/${orderNumber}`,
    { authenticated: hasSessionAccess },
  );

  // 3. Si el backend dice que no existe, propagar el 404 sin PII.
  if (!ok) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status });
  }

  // 4. Verificar ownership si accede por sesión.
  //    La cookie de acceso ya fue verificada criptográficamente en paso 1
  //    (binding por order_number + HMAC + TTL).
  if (hasSessionAccess && !hasCapabilityAccess) {
    if (data?.customer_id == null || data.customer_id !== session!.user_id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
  }

  // 5. Acceso autorizado → devolver proyección mínima (condición 4).
  const projection = toPollingProjection(data ?? {});
  return NextResponse.json(projection, { status: 200 });
}
