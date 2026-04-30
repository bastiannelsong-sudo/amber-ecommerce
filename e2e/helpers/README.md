# E2E Helpers

## Cómo correr la suite de checkout

Requisitos previos:

1. **Backend NestJS corriendo** en `:3000`:
   ```bash
   cd amber-back && pnpm start:dev
   ```
2. **Frontend Next corriendo** en `:3001`:
   ```bash
   cd amber-ecommerce && pnpm dev
   ```
3. **DB local** con migrations 033, 034, 035 aplicadas.
4. **Catálogo con stock**: al menos 1 producto visible y comprable.

Configurar credenciales DB en `.env.local` del ecommerce (o exportar):

```bash
TEST_PG_HOST=localhost
TEST_PG_PORT=5432
TEST_PG_USER=postgres
TEST_PG_PASSWORD=tu-password
TEST_PG_DATABASE=amber
```

Correr:

```bash
pnpm test:e2e e2e/checkout-flow.spec.ts          # headless
pnpm test:e2e:ui e2e/checkout-flow.spec.ts       # con UI interactiva
```

## Diseño

`simulateMpWebhook(orderNumber, payment)` modifica `ecommerce_orders`
directamente con `UPDATE`. Esto **no** ejecuta el state machine ni
emite eventos — solo cambia los flags que el polling del frontend lee
(`status`, `mp_payment_method`, `mp_card_last_four`, `paid_at`).

**Tradeoff:** acoplamos los tests a la estructura de la tabla. La
ventaja es que los tests son rápidos (\~30s/spec) y determinísticos.
Para validar el state machine + webhooks usar los unit tests del
backend.

## Limpieza

`afterAll` llama `cleanupRecentTestOrders()` que borra órdenes con
email `e2e-test-*@*` creadas en los últimos 5 minutos. Si una corrida
queda colgada, podés limpiar manualmente:

```sql
DELETE FROM ecommerce_orders WHERE customer_email LIKE 'e2e-test-%@%';
```
