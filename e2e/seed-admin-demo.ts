/**
 * Script de seed para poblar el admin /ecommerce-orders con ordenes de
 * test variadas — util para inspeccionar visualmente la pagina, probar
 * filtros por status, y tener algo que mostrar en demos sin esperar a
 * que un cliente real compre.
 *
 * Uso (desde amber-ecommerce/):
 *   TEST_PG_PASSWORD='tu-pwd' pnpm tsx e2e/seed-admin-demo.ts
 *
 * Crea 8 ordenes con distintos status. Limpiar despues con:
 *   CLEANUP_E2E=1 pnpm test:e2e e2e/checkout-flow.spec.ts
 *   o ejecutar este script con --cleanup
 */
import { createTestOrderInDb, cleanupRecentTestOrders } from './helpers/db';

async function main() {
  if (process.argv.includes('--cleanup')) {
    await cleanupRecentTestOrders();
    console.log('✓ Cleanup hecho — ordenes AMBE2E* / e2e-test-* borradas');
    return;
  }

  const fixtures: Array<{
    label: string;
    status: string;
    method: string | null;
    last4: string | null;
  }> = [
    { label: 'Pago aprobado con Visa', status: 'paid', method: 'visa', last4: '0604' },
    { label: 'Pago aprobado con Mastercard', status: 'paid', method: 'master', last4: '5678' },
    { label: 'Pago con Amex', status: 'paid', method: 'amex', last4: '1011' },
    { label: 'Pago con cuenta MP (sin tarjeta)', status: 'paid', method: 'account_money', last4: null },
    { label: 'En preparacion', status: 'processing', method: 'visa', last4: '4321' },
    { label: 'En transito', status: 'shipped', method: 'master', last4: '8765' },
    { label: 'Pendiente de pago', status: 'pending', method: null, last4: null },
    { label: 'Cancelada', status: 'cancelled', method: null, last4: null },
  ];

  for (const f of fixtures) {
    const orderNumber = await createTestOrderInDb({
      status: f.status,
      mp_payment_method: f.method,
      mp_card_last_four: f.last4,
    });
    console.log(`✓ ${orderNumber}  ${f.status.padEnd(11)}  ${f.label}`);
  }

  console.log('\nListo. Andá al admin: http://localhost:5173/ecommerce-orders');
  console.log('Para limpiar despues: pnpm tsx e2e/seed-admin-demo.ts --cleanup');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
