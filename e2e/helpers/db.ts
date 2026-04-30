import { Client } from 'pg';

/**
 * Helper para simular el webhook de MercadoPago modificando la BD
 * directamente. Esto desacopla los E2E de la UI de la dependencia
 * externa real (MP sandbox), que es lenta y flaky.
 *
 * Tradeoff: NO testeamos el handler del webhook ni el state machine
 * (eso queda para los unit tests del backend). Solo verificamos que
 * la UI reacciona correctamente cuando el status del pedido cambia
 * via polling.
 *
 * Configura via env: TEST_PG_HOST, TEST_PG_USER, TEST_PG_PASSWORD,
 * TEST_PG_DATABASE (defaults apuntan a la BD local de dev).
 */
function getClient(): Client {
  return new Client({
    host: process.env.TEST_PG_HOST ?? 'localhost',
    port: Number(process.env.TEST_PG_PORT ?? 5432),
    user: process.env.TEST_PG_USER ?? 'postgres',
    password: process.env.TEST_PG_PASSWORD ?? '',
    database: process.env.TEST_PG_DATABASE ?? 'amber',
  });
}

/**
 * Inserta una orden de test directamente en la BD, sin pasar por el
 * backend. Util cuando el goal del spec es validar la UI del flow
 * post-checkout (resultado, comprobante) y no la creacion via API.
 *
 * order_number empieza con 'AMBE2E' para distinguir de ordenes reales
 * y permitir cleanup selectivo.
 */
export async function createTestOrderInDb(opts?: {
  status?: string;
  mp_payment_method?: string | null;
  mp_card_last_four?: string | null;
}): Promise<string> {
  // Tests corren en paralelo → necesitamos unicidad fuerte.
  // Date.now() solo no alcanza (colisiones intra-ms). Sumamos random.
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const orderNumber = `AMBE2E${Date.now().toString(36).toUpperCase()}${rand}`;
  const status = opts?.status ?? 'pending';
  const paidAt = status === 'paid' ? new Date() : null;
  const client = getClient();
  await client.connect();
  try {
    await client.query(
      `INSERT INTO ecommerce_orders (
         order_number, customer_email, customer_name, customer_phone,
         shipping_address, shipping_city, shipping_region, shipping_postal_code,
         items, subtotal, shipping_cost, discount_amount, total,
         status, mp_payment_status, mp_payment_method, mp_card_last_four, paid_at,
         shipping_provider
       ) VALUES (
         $1, $2, $3, $4,
         $5, $6, $7, $8,
         $9::jsonb, $10, $11, $12, $13,
         $14, $15, $16, $17, $18,
         $19
       )`,
      [
        orderNumber,
        'e2e-test-bot@ambernelson.cl',
        'Bot Tester',
        '+56912345678',
        'Av Apoquindo 4500',
        'Las Condes',
        'Metropolitana',
        '7550000',
        JSON.stringify([
          {
            product_id: 1,
            name: 'Aros Plata 925 Test E2E',
            internal_sku: 'TEST-E2E-001',
            quantity: 1,
            unit_price: 15389,
          },
        ]),
        15389,
        5000,
        0,
        20389,
        status,
        opts?.mp_payment_method ? 'approved' : null,
        opts?.mp_payment_method ?? null,
        opts?.mp_card_last_four ?? null,
        paidAt,
        'manual',
      ],
    );
  } finally {
    await client.end();
  }
  return orderNumber;
}

export interface SimulatedPayment {
  status: 'approved' | 'rejected' | 'pending' | 'in_process';
  payment_method?: string;
  card_last_four?: string;
}

/**
 * Simula la transicion que haria el webhook real:
 * - approved: status='paid', popula mp_card_last_four/method/id, paid_at=now
 * - rejected: status='cancelled' (mapeo del state machine)
 * - pending/in_process: status='pending' (sigue como estaba)
 */
export async function simulateMpWebhook(
  orderNumber: string,
  payment: SimulatedPayment,
): Promise<void> {
  const client = getClient();
  await client.connect();
  try {
    let dbStatus: string;
    switch (payment.status) {
      case 'approved':
        dbStatus = 'paid';
        break;
      case 'rejected':
        dbStatus = 'cancelled';
        break;
      default:
        dbStatus = 'pending';
    }

    const fakePaymentId = `TEST-${Date.now()}`;
    const cardLast4 = payment.card_last_four ?? null;
    const method = payment.payment_method ?? 'visa';
    const paidAt = dbStatus === 'paid' ? new Date() : null;

    await client.query(
      `UPDATE ecommerce_orders
         SET status = $1,
             mp_payment_status = $2,
             mp_payment_id = $3,
             mp_payment_method = $4,
             mp_card_last_four = $5,
             paid_at = COALESCE(paid_at, $6),
             updated_at = NOW()
       WHERE order_number = $7`,
      [
        dbStatus,
        payment.status,
        fakePaymentId,
        method,
        cardLast4,
        paidAt,
        orderNumber,
      ],
    );
  } finally {
    await client.end();
  }
}

/**
 * Limpia ordenes de test creadas durante la corrida.
 * Borra ordenes con order_number que empiecen con 'AMB' creadas
 * en las ultimas 5 minutos.
 *
 * Solo usar en entorno de test/dev — nunca en prod.
 */
export async function cleanupRecentTestOrders(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('cleanupRecentTestOrders no debe correr en production');
  }
  const client = getClient();
  await client.connect();
  try {
    // Borramos primero el audit log si la FK lo requiere.
    await client.query(
      `DELETE FROM order_status_history
        WHERE order_id IN (
          SELECT order_id FROM ecommerce_orders
           WHERE order_number LIKE 'AMBE2E%'
              OR customer_email LIKE 'e2e-test-%@%'
        )`,
    );
    await client.query(
      `DELETE FROM ecommerce_orders
        WHERE order_number LIKE 'AMBE2E%'
           OR (created_at > NOW() - INTERVAL '5 minutes'
               AND customer_email LIKE 'e2e-test-%@%')`,
    );
  } finally {
    await client.end();
  }
}
