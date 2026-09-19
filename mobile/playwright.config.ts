import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1,
  use: { baseURL: 'http://localhost:8081', channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true },
});
