// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  testRunner: 'vitest',

  vitest: {
    configFile: 'vitest.config.mts',
  },

  // Solo mutar stores, utils, y lógica de negocio
  mutate: [
    'app/lib/**/*.ts',
    'app/lib/**/*.tsx',
    '!app/lib/**/*.test.ts',
    '!app/lib/**/*.test.tsx',
    '!app/lib/types/**/*.ts',
  ],

  reporters: ['html', 'clear-text', 'progress'],

  htmlReporter: {
    fileName: 'reports/mutation/mutation-report.html',
  },

  timeoutMS: 30000,
  timeoutFactor: 2.0,

  thresholds: {
    high: 80,
    low: 60,
    break: null,
  },

  concurrency: 2,
};

export default config;
