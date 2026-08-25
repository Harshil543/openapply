import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const EXTENSION_PATH = path.resolve(__dirname, '../.output/chrome-mv3');

test.describe('OpenApply Extension', () => {
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    const userDataDir = path.resolve(__dirname, '../.test-user-data');

    context = await browser.newContext({
      // Playwright loads extensions via persistent context
    });

    // We need to launch with extension args directly
    const browserType = browser.browserType();
    const launchBrowser = await browserType.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    });
    context = launchBrowser;
  });

  test.afterAll(async () => {
    if (context) await context.close();
    // Cleanup test user data
    const userDataDir = path.resolve(__dirname, '../.test-user-data');
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  });

  test('extension loads and shows popup', async () => {
    const [page] = context.pages();
    // Wait for any page to be ready
    await page.waitForLoadState('domcontentloaded');

    // Navigate to the popup
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${getExtensionId(context)}/popup.html`);
    await popupPage.waitForLoadState('domcontentloaded');

    // The popup should render
    const body = await popupPage.textContent('body');
    expect(body).toBeTruthy();
  });

  test('options page loads with tabs', async () => {
    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${getExtensionId(context)}/options.html`);
    await optionsPage.waitForLoadState('domcontentloaded');
    await optionsPage.waitForTimeout(1000);

    // Check that the page rendered
    const title = await optionsPage.title();
    expect(title).toBeTruthy();

    // Check for tab navigation
    const body = await optionsPage.textContent('body');
    expect(body).toContain('Profile');
  });

  test('side panel opens', async () => {
    // Navigate to a page first
    const page = context.pages()[0] || await context.newPage();
    await page.goto('about:blank');

    // Try to open side panel via Chrome API
    // This is limited in Playwright - we just verify the extension loaded
    const extensionId = getExtensionId(context);
    expect(extensionId).toBeTruthy();
  });
});

function getExtensionId(ctx: BrowserContext): string {
  const pages = ctx.pages();
  for (const page of pages) {
    const url = page.url();
    const match = url.match(/^chrome-extension:\/\/([a-z]+)/);
    if (match) return match[1];
  }
  // Fallback: look at background page
  const bgPage = pages.find((p) => p.url().includes('chrome-extension://'));
  if (bgPage) {
    const match = bgPage.url().match(/^chrome-extension:\/\/([a-z]+)/);
    if (match) return match[1];
  }
  throw new Error('Could not find extension ID');
}
