// Configuración de Playwright con ReportPortal reporter
// Uso: npm run test:e2e:rp
import { config } from 'dotenv';
config({ path: '.env.local' });

import { defineConfig, devices } from '@playwright/test';

const rpConfig = {
  apiKey: process.env.RP_API_KEY || '',
  endpoint: process.env.RP_ENDPOINT || 'http://localhost:8080/api/v2',
  project: process.env.RP_PROJECT || 'amber',
  launch: process.env.RP_LAUNCH || 'amber-ecommerce-e2e-tests',
  attributes: [
    { key: 'project', value: 'amber-ecommerce' },
    { key: 'type', value: 'e2e' },
    { key: 'framework', value: 'playwright' },
  ],
  description: 'Tests E2E de amber-ecommerce (Playwright)',
  includeTestSteps: true,
  uploadVideo: true,
  uploadTrace: true,
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // Reporter dual: HTML local + ReportPortal
  reporter: [
    ['html'],
    ['@reportportal/agent-js-playwright', rpConfig],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    video: 'on',
    screenshot: 'on',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
