import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth.js';

test.describe('場次列表', () => {
  test('訪客可以看到場次列表', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#loadingSpinner', { state: 'hidden', timeout: 10000 });
    const hasSessions = await page.locator('#sessionsList > div').count();
    const hasEmpty = await page.locator('#noSessionsMsg').isVisible();
    expect(hasSessions > 0 || hasEmpty).toBeTruthy();
  });

  test('預設 tab 為「報名中」', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#sf-open')).toHaveClass(/bg-indigo-600/);
  });
});

test.describe('取消報名', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForSelector('#loadingSpinner', { state: 'hidden', timeout: 10000 });
  });

  test('已報名者可以取消自己的報名', async ({ page }) => {
    const signedBadge = page.locator('[id^="signed-badge-"]:visible').first();
    if (!(await signedBadge.count())) { test.skip(true, '沒有已報名場次'); return; }

    page.on('dialog', dialog => dialog.accept());
    await page.locator('button[onclick*="cancelSignup"]').first().click();

    await expect(signedBadge).toBeHidden({ timeout: 5000 });
  });
});
