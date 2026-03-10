import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { createServer, type Server } from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FIXTURE_PORT = 9753;
export const FIXTURE_BASE = `http://localhost:${FIXTURE_PORT}`;

function startFixtureServer(fixturesDir: string, port: number): Server {
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.css': 'text/css',
    '.js': 'application/javascript',
  };

  return createServer((req, res) => {
    const url = req.url === '/' ? '/test-page.html' : req.url || '/';
    const filePath = path.join(fixturesDir, url);
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  }).listen(port);
}

// Module-level server — shared across all tests in the worker.
// unref() ensures it doesn't prevent process exit.
let fixtureServer: Server | null = null;

function ensureServer(): void {
  if (!fixtureServer) {
    const fixturesDir = path.resolve(__dirname, 'fixtures');
    fixtureServer = startFixtureServer(fixturesDir, FIXTURE_PORT);
    fixtureServer.unref();
  }
}

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
  fixtureUrl: string;
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    ensureServer();

    const extensionPath = path.resolve(__dirname, '../build');
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-first-run',
        '--disable-gpu',
      ],
    });

    // Close the welcome/onboarding tab that opens on fresh install
    // (chrome.runtime.onInstalled opens blockdev.app/image-downloader/installed)
    await new Promise((r) => setTimeout(r, 1500));
    for (const page of context.pages()) {
      const url = page.url();
      if (url.includes('blockdev.app') || url.includes('image-downloader/installed')) {
        await page.close();
      }
    }

    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    let serviceWorker = context.serviceWorkers()[0];
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    const extensionId = serviceWorker.url().split('/')[2];
    await use(extensionId);
  },

  // eslint-disable-next-line no-empty-pattern
  fixtureUrl: async ({}, use) => {
    await use(`${FIXTURE_BASE}/test-page.html`);
  },
});

export { expect } from '@playwright/test';
