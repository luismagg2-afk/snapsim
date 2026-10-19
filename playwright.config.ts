import { defineConfig, devices } from '@playwright/test';

// Runs against the production build (vite preview) so the service worker is exercised too.
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    timeout: 180_000,
    reuseExistingServer: true,
  },
  projects: [
    {
      // Safari engine with iPhone viewport/UA – no camera available, so it exercises the fallback.
      name: 'iphone-webkit',
      use: { ...devices['iPhone 15 Pro'] },
    },
    {
      // Chromium with a fake camera so the live capture path is exercised.
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 393, height: 852 },
        permissions: ['camera'],
        launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
      },
    },
  ],
});
