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
      // next/image no funciona en jsdom (requiere el runtime de Next.js).
      // Pasamos un stub <img> que reenvía todos los props DOM y descarta
      // los exclusivos de Next (fill, priority, etc.) — ADR-2.
      'next/image': path.resolve(__dirname, '__mocks__/next-image.tsx'),
      // motion/react usa ResizeObserver y CSS transitions que jsdom no implementa.
      // El mock entrega AnimatePresence→children y motion.X→elemento plano — ADR-3.
      'motion/react': path.resolve(__dirname, '__mocks__/motion-react.tsx'),
    },
  },
});
