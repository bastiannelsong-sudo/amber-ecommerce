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
    await client.query(
      `DELETE FROM ecommerce_orders
        WHERE created_at > NOW() - INTERVAL '5 minutes'
          AND customer_email LIKE 'e2e-test-%@%'`,
    );
  } finally {
    await client.end();
  }
}
