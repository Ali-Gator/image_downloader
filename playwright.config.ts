import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  workers: 2,
  fullyParallel: true,
  use: {
    headless: false,
  },
  projects: [
    {
      name: 'chromium-extension',
    },
  ],
});
