import { expect, test } from '@playwright/test';

test.describe('tactical showcase', () => {
  test.describe.configure({ mode: 'serial' });

  test('loads the first unit on arrival without any click', async ({ page }) => {
    test.setTimeout(120_000);
    const modelResponse = page.waitForResponse(
      (response) => response.url().endsWith('/models/hyaku-shiki.glb') && response.ok(),
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Hyaku-Shiki' })).toBeVisible();
    await expect(page.getByText('Select a unit from the roster to view it.')).toHaveCount(0);
    await expect(page.getByText('2 units')).toBeVisible();
    await expect(page.getByRole('button', { name: /Light Guncannon/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Deployment slot/i })).toHaveCount(0);
    await expect(page.getByText('DEPLOYMENT', { exact: true })).toHaveCount(0);
    await expect(page.locator('.hero-canvas canvas')).toBeVisible();
    await modelResponse;

    const hint = page.getByRole('note');
    await expect(hint).toBeVisible({ timeout: 30_000 });
    await expect(hint).toContainText('Drag to rotate');
    await page.getByRole('button', { name: 'Dismiss controls hint' }).click({ timeout: 60_000 });
    await expect(hint).toHaveCount(0);

    await page.getByRole('button', { name: /Light Guncannon/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Light Guncannon' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('shows the real download percentage while the first model loads', async ({ page }) => {
    test.setTimeout(120_000);
    const client = await page.context().newCDPSession(page);
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: 2 * 1024 * 1024,
      uploadThroughput: -1,
    });

    await page.goto('/');
    const status = page.getByRole('status').filter({ hasText: 'Loading unit' });
    await expect(status).toHaveText(/Loading unit… \d+%/, { timeout: 60_000 });
    await expect(page.getByRole('note')).toBeVisible({ timeout: 90_000 });
    await expect(status).toHaveCount(0);
  });

  test('keeps the page mounted when Light Guncannon finishes loading', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/');
    await page.getByRole('button', { name: /Light Guncannon/ }).click();
    await expect(page.locator('.hero-canvas')).toBeVisible();
    await expect(page.locator('.hero-canvas canvas')).toBeVisible();
    await page.waitForTimeout(2_000);
    await expect(page.locator('.hero-canvas canvas')).toBeVisible();
    await expect.poll(() => page.locator('body').innerText()).toContain('Light Guncannon');

    expect(pageErrors).toEqual([]);
  });

  test('changes tactical stage and exposes the capture action', async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('/');
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /^data:image\/svg\+xml/);
    await page.getByRole('button', { name: /Light Guncannon/ }).click();

    const forestStage = page.getByRole('button', { name: 'Forest stage' });
    await forestStage.click();

    await expect(forestStage).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.hero-canvas')).toHaveCSS('background-color', 'rgb(120, 188, 216)');

    const captureButton = page.getByRole('button', { name: 'Capture PNG' });
    await expect(captureButton).toBeVisible();
    await expect(captureButton).toBeEnabled();
    await page.evaluate(() => {
      const original = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function (...args) {
        const result = original.apply(this, args);
        (window as Window & { capturedPng?: string }).capturedPng = result;
        return result;
      };
    });
    const download = page.waitForEvent('download');
    await captureButton.click();
    const captured = await download;
    expect(captured.suggestedFilename()).toMatch(/^digital-shelf-light-guncannon-.*\.png$/);
    await expect(page.getByRole('status').filter({ hasText: 'Saved digital-shelf-light-guncannon-' })).toBeVisible();
    const pixels = await page.evaluate(async () => {
      const image = new Image();
      image.src = (window as Window & { capturedPng?: string }).capturedPng!;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0, 64, 64);
      const data = context.getImageData(0, 0, 64, 64).data;
      const colors = new Set<string>();
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
      }
      return colors.size;
    });
    expect(pixels).toBeGreaterThan(20);
    expect(errors).toEqual([]);
  });

  test('switches through every hologram stage while preserving the model and capture action', async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto('/');
    await page.getByRole('button', { name: /Light Guncannon/ }).click();

    const heroCanvas = page.locator('.hero-canvas');
    const canvas = heroCanvas.locator('canvas');
    const modelLabel = page.getByRole('region', { name: 'Hero display' }).getByText('Light Guncannon', { exact: true });
    const captureButton = page.getByRole('button', { name: 'Capture PNG' });

    await expect(heroCanvas).toHaveAttribute('data-backdrop-variant', 'hangar');
    await expect(canvas).toBeVisible();
    await expect(modelLabel).toBeVisible();
    await expect(captureButton).toBeEnabled();

    const atmosphericLayer = await heroCanvas.evaluate((element) => {
      const pseudo = getComputedStyle(element, '::before');
      const canvasStyle = getComputedStyle(element.querySelector('canvas') as HTMLCanvasElement);
      return {
        pseudoZIndex: pseudo.zIndex,
        pseudoPointerEvents: pseudo.pointerEvents,
        pseudoOpacity: pseudo.opacity,
        canvasZIndex: canvasStyle.zIndex,
      };
    });
    expect(atmosphericLayer).toEqual({
      pseudoZIndex: '2',
      pseudoPointerEvents: 'none',
      pseudoOpacity: '0.65',
      canvasZIndex: '1',
    });

    for (const stage of [
      { name: 'Forest stage', variant: 'forest' },
      { name: 'Ruined City stage', variant: 'ruined-city' },
      { name: 'Hangar stage', variant: 'hangar' },
    ]) {
      const stageButton = page.getByRole('button', { name: stage.name });
      await stageButton.click();
      await expect(stageButton).toHaveAttribute('aria-pressed', 'true');
      await expect(heroCanvas).toHaveAttribute('data-backdrop-variant', stage.variant);
      await expect(canvas).toBeVisible();
      await expect(modelLabel).toBeVisible();
      await expect(captureButton).toBeEnabled();
    }
  });

  test('changes stage without freezing the active 3D scene', async ({ page }) => {
    const modelResponse = page.waitForResponse(
      (response) => response.url().endsWith('/models/light-guncannon.glb') && response.ok(),
    );

    await page.goto('/');
    await page.getByRole('button', { name: /Light Guncannon/ }).click();
    await modelResponse;
    await page.waitForTimeout(1_000);

    const forestStage = page.getByRole('button', { name: 'Forest stage' });
    await expect(forestStage).toBeVisible();
    await forestStage.click({ timeout: 30_000 });
    await expect(forestStage).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.hero-canvas canvas')).toBeVisible();
  });

  test('keeps the hero and command sheet usable at a narrow mobile viewport', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Deployment slot/i })).toHaveCount(0);
    await expect(page.getByText('DEPLOYMENT', { exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: 'Select unit' }).click();
    await page.getByRole('option', { name: 'Light Guncannon' }).click();

    const hero = page.locator('.hero-display');
    const commandSheet = page.getByRole('region', { name: 'Tactical command sheet' });

    await expect(hero).toBeVisible();
    await expect(page.locator('.hero-canvas canvas')).toBeVisible();
    await expect(commandSheet).toBeVisible();
    await expect(page.getByRole('button', { name: /Deployment slot/i })).toHaveCount(0);
    await expect(page.getByText('DEPLOYMENT', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Ruined City stage' })).toBeVisible();

    for (const variant of ['forest', 'hangar']) {
      await page.getByRole('button', { name: `${variant === 'forest' ? 'Forest' : 'Hangar'} stage` }).click();
      await expect(page.locator('.hero-canvas')).toHaveAttribute('data-backdrop-variant', variant);
      await expect(page.locator('.hero-canvas canvas')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Capture PNG' })).toBeEnabled();
    }

    const heroBox = await hero.boundingBox();
    const sheetBox = await commandSheet.boundingBox();
    expect(heroBox?.height).toBeGreaterThan(sheetBox?.height ?? 0);
  });
  test('fits a phone viewport with no horizontal overflow and every control on screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('.hero-canvas canvas')).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    for (const locator of [
      page.getByRole('button', { name: 'Forest stage' }),
      page.getByRole('button', { name: 'Select unit' }),
      page.getByRole('button', { name: 'Capture PNG' }),
    ]) {
      const box = await locator.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(390);
      expect(box!.y + box!.height).toBeLessThanOrEqual(844);
    }
  });

  test('opens the mobile unit dropdown upward so every option stays inside the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.getByRole('button', { name: 'Select unit' }).click();
    const options = page.getByRole('option');
    await expect(options.first()).toBeVisible();

    const count = await options.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const box = await options.nth(index).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(844);
    }

    await page.getByRole('option', { name: 'Light Guncannon' }).click();
    await expect(options.first()).toBeHidden();
    await expect(page.getByRole('region', { name: 'Hero display' }).getByText('Light Guncannon', { exact: true })).toBeVisible();
  });
});
