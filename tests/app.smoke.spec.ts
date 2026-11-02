import { expect, test } from '@playwright/test';

// Kept deliberately small: the 3D scene is software-rendered on slow machines.
test.describe('tactical showcase smoke', () => {
  test('loads, shows the 3D canvas, and switches unit and stage', async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Hyaku-Shiki' })).toBeVisible();
    await expect(page.locator('.hero-canvas canvas')).toBeVisible();

    await page.getByRole('button', { name: /Light Guncannon/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Light Guncannon' })).toBeVisible();
    await expect(page.locator('.hero-canvas canvas')).toBeVisible();

    const forestStage = page.getByRole('button', { name: 'Forest stage' });
    await forestStage.click();
    await expect(forestStage).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.hero-canvas')).toHaveAttribute('data-backdrop-variant', 'forest');
    await expect(page.getByRole('button', { name: 'Capture PNG' })).toBeEnabled();

    expect(errors).toEqual([]);
  });

  test('fits a phone viewport with no horizontal overflow', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('.hero-canvas canvas')).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
