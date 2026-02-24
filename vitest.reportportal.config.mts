// Configuración de Vitest con ReportPortal reporter
// Se usa solo cuando se quiere enviar resultados a RP
// Uso: RP_API_KEY=xxx npm run test:rp
import { defineConfig } from 'vitest/config';
import RPReporter from '@reportportal/agent-js-vitest';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rpConfig = {
  apiKey: process.env.RP_API_KEY || '',
  endpoint: process.env.RP_ENDPOINT || 'http://localhost:8080/api/v2',
  project: process.env.RP_PROJECT || 'amber',
  launch: process.env.RP_LAUNCH || 'amber-ecommerce-unit-tests',
  attributes: [
    { key: 'project', value: 'amber-ecommerce' },
    { key: 'type', value: 'unit' },
    { key: 'framework', value: 'vitest' },
  ],
  description: 'Tests unitarios de amber-ecommerce (Vitest)',
};

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.mts'],
    include: ['**/*.test.{ts,tsx}'],
    reporters: ['default', new RPReporter(rpConfig)],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
