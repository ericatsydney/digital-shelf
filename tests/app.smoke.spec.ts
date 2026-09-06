import { expect, test } from '@playwright/test';

test.describe('tactical showcase', () => {
  test('renders the local collection and deploys Haro into a fixed slot', async ({ page }) => {
    const modelResponse = page.waitForResponse(
      (response) => response.url().endsWith('/models/haro-green.glb') && response.ok(),
    );

    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Hero display' })).toBeVisible();
    await expect(page.getByText('1 units')).toBeVisible();
    await expect(page.getByRole('button', { name: /Haro Green/ })).toBeVisible();

    await page.getByRole('button', { name: /Haro Green/ }).click();
    await expect(page.getByText('Haro Green', { exact: true })).toBeVisible();
    await expect(page.locator('.hero-canvas')).toBeVisible();
    await expect(page.locator('.hero-canvas canvas')).toBeVisible();
    await modelResponse;

    const alphaSlot = page.getByRole('button', { name: 'Deployment slot Alpha' });
    await alphaSlot.click();
    await expect(alphaSlot).toHaveAttribute('aria-pressed', 'true');
  });

  test('keeps the page mounted when Haro finishes loading', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/');
    await page.getByRole('button', { name: /Haro Green/ }).click();
    await expect(page.locator('.hero-canvas')).toBeVisible();
    await expect(page.locator('.hero-canvas canvas')).toBeVisible();
    await page.waitForTimeout(2_000);
    await expect(page.locator('.hero-canvas canvas')).toBeVisible();
    await expect.poll(() => page.locator('body').innerText()).toContain('Haro Green');

    expect(pageErrors).toEqual([]);
  });

  test('changes tactical stage and exposes the capture action', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Haro Green/ }).click();

    const spaceStage = page.getByRole('button', { name: 'Space stage' });
    await spaceStage.click();

    await expect(spaceStage).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.hero-canvas')).toHaveCSS('background-color', 'rgb(2, 4, 12)');

    const captureButton = page.getByRole('button', { name: 'Capture PNG' });
    await expect(captureButton).toBeVisible();
    await expect(captureButton).toBeEnabled();
    await captureButton.click();
  });

  test('keeps the hero and command sheet usable at a narrow mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.getByRole('button', { name: /Haro Green/ }).click();

    const hero = page.locator('.hero-display');
    const commandSheet = page.getByRole('region', { name: 'Tactical command sheet' });

    await expect(hero).toBeVisible();
    await expect(page.locator('.hero-canvas canvas')).toBeVisible();
    await expect(commandSheet).toBeVisible();
    await expect(page.getByRole('button', { name: 'Deployment slot Bravo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ruined City stage' })).toBeVisible();

    const heroBox = await hero.boundingBox();
    const sheetBox = await commandSheet.boundingBox();
    expect(heroBox?.height).toBeGreaterThan(sheetBox?.height ?? 0);
  });
});
