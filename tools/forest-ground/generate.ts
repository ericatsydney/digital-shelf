import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const output = resolve('public/textures/forest-ground.png');

/** Bakes the forest ground image once: paints it in a headless browser through the app's own painter and saves the PNG. */
const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
await server.listen();
const address = server.httpServer?.address();
const port = typeof address === 'object' && address ? address.port : 0;

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/`);
  const dataUrl = await page.evaluate(async () => {
    const modulePath = '/src/scene/forestGroundTexture.ts';
    const { paintForestGround } = await import(/* @vite-ignore */ modulePath) as { paintForestGround: (canvas: HTMLCanvasElement) => boolean };
    const canvas = document.createElement('canvas');
    if (!paintForestGround(canvas)) throw new Error('No 2D canvas context');
    return canvas.toDataURL('image/png');
  });
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(`Wrote ${output}`);
} finally {
  await browser.close();
  await server.close();
}
