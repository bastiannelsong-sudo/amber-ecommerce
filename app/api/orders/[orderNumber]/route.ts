import { NextResponse, type NextRequest } from 'next/server';
import { backendFetch } from '../../../lib/bff-proxy';
import { getSession } from '../../../lib/session';

/**
 * GET /api/orders/:orderNumber — usado por el polling de
 * /checkout/resultado para detectar cuando el webhook MP confirma
 * el pago. La página /orden/[N] (comprobante) NO usa esta ruta:
 * fetchea directo via lib/server-api/orders.ts en el server side.
 *
 * SEGURIDAD: ownership verificado antes de devolver PII.
 *
 * Reglas de acceso (misma lógica que /orden/[N]/page.tsx):
 *   - Debe existir una sesión httpOnly válida cuyo user_id coincida
 *     con el customer_id de la orden → 200 con datos.
 *   - Sin sesión válida o sin match → 403 sin filtrar PII.
 *   - Orden inexistente → propaga el 404 del backend.
 *
 * Por qué 403 (no 404) sin sesión: no queremos confirmar ni negar
 * la existencia del order_number a un usuario no autenticado.
 * Si la persona tiene sesión pero la orden no es suya → 403 explícito.
 * Si la orden no existe → el backend devuelve 404 y lo propagamos.
 *
 * Nota sobre guest checkout: esta ruta es de polling post-checkout
 * (el browser la llama inmediatamente después de la confirmación de
 * pago, mientras el usuario está autenticado en esa misma sesión).
 * El comprobante permanente para guests va via /orden/[N]?email=.
 * Aquí solo aceptamos sesiones logueadas para simplificar el guard.
 */
interface OrderData {
  customer_id?: number | null;
  [key: string]: unknown;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await params;

  // 1. Verificar que hay sesión activa.
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 403 });
  }

  // 2. Obtener la orden del backend (inyecta Bearer token de la sesión).
  const { ok, status, data } = await backendFetch<OrderData>(
    `/ecommerce/orders/${orderNumber}`,
    { authenticated: true },
  );

  // 3. Si el backend dice que no existe, propagar el 404 sin PII.
  if (!ok) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status });
  }

  // 4. Verificar ownership: el customer_id de la orden debe coincidir
  //    con el user_id de la sesión activa.
  if (data?.customer_id == null || data.customer_id !== session.user_id) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  // 5. Ownership validado → devolver datos completos de la orden.
  return NextResponse.json(data, { status: 200 });
}
