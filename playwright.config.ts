import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 1,
  use: {
    headless: false,
  },
  projects: [
    {
      name: 'extension',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: [
            `--disable-extensions-except=.output/chrome-mv3`,
            `--load-extension=.output/chrome-mv3`,
          ],
        },
      },
    },
  ],
});
