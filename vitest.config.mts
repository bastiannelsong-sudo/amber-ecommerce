import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.mts'],
    include: ['**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // server-only no existe en el entorno de test (jsdom/node de Vitest).
      // Lo mapeamos a un módulo vacío para que los archivos que lo importan
      // puedan ser testeados directamente sin lanzar un error de resolución.
      'server-only': path.resolve(__dirname, '__mocks__/server-only.ts'),
    },
  },
});
