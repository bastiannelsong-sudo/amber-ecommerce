import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../lib/bff-proxy';

/**
 * GET /api/orders/:orderNumber — usado por el polling de
 * /checkout/resultado para detectar cuando el webhook MP confirma
 * el pago. La pagina /orden/[N] (comprobante) NO usa esta ruta:
 * fetchea directo via lib/server-api/orders.ts en el server side.
 *
 * ⚠️ TODO seguridad: hoy esta ruta devuelve la orden completa
 * (incluye PII: email, direccion, items) a cualquiera que conozca
 * el order_number. El order_number es opaco (timestamp en base36)
 * pero predecible y enumerable.
 *
 * El comprobante /orden/[N] ya tiene access control propio (sesion
 * o ?email= match). Esta ruta queda como TODO de la Capa 1 del
 * plan de hardening: agregar el mismo guard aca o devolver solo
 * fields publicos (order_number + status + total) sin PII.
 *
 * Mitigacion temporal: el order_number aunque predecible no es
 * facil de explotar a escala porque cada request hace round-trip
 * al backend. Rate limit del nginx en prod (10 r/s) lo amortigua.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await params;
  return proxyToBackend(req, `/ecommerce/orders/${orderNumber}`);
}
