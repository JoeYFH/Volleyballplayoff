import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth.js';

test.describe('首頁場次列表', () => {
  test('訪客可以看到場次列表（或空狀態）', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for filter bar — confirms Vue app has mounted and data load attempted
    await page.locator('button:has-text("報名中"), button:has-text("Open")').first()
      .waitFor({ state: 'visible', timeout: 12000 });

    // Allow a bit more time for Supabase async fetch to complete
    await page.waitForTimeout(1000);

    const hasSessions = await page.locator('[id^="card-"]').count();
    const hasEmpty = await page.locator('text=/沒有即將舉行|No upcoming/').isVisible();
    expect(hasSessions > 0 || hasEmpty).toBeTruthy();
  });

  test('預設 tab 為「報名中/Open」（active state）', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 「報名中」按鈕應有 active class (bg-indigo-600)
    const openBtn = page.locator('button:has-text("報名中"), button:has-text("Open")').first();
    await openBtn.waitFor({ state: 'visible', timeout: 12000 });
    await expect(openBtn).toHaveClass(/bg-indigo-600/, { timeout: 5000 });
  });

  test('切換「所有」tab 顯示更多或相同場次數', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const openBtn = page.locator('button:has-text("報名中"), button:has-text("Open")').first();
    await openBtn.waitFor({ state: 'visible', timeout: 12000 });
    const openCount = await page.locator('[id^="card-"]').count();

    await page.locator('button:has-text("所有"), button:has-text("All")').first().click();
    await page.waitForTimeout(400);
    const allCount = await page.locator('[id^="card-"]').count();

    expect(allCount).toBeGreaterThanOrEqual(openCount);
  });

  test('性別 filter「⚥ 混排」只顯示混排場次', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const openBtn = page.locator('button:has-text("報名中"), button:has-text("Open")').first();
    await openBtn.waitFor({ state: 'visible', timeout: 12000 });

    await page.locator('button:has-text("所有"), button:has-text("All")').first().click();
    await page.locator('button:has-text("⚥ 混排"), button:has-text("⚥ Mixed")').first().click();
    await page.waitForTimeout(400);

    // 所有卡片應包含「混排 / Mixed」標籤
    const cards = page.locator('[id^="card-"]');
    const cnt = await cards.count();
    if (cnt === 0) return; // 沒場次時略過

    for (let i = 0; i < Math.min(cnt, 5); i++) {
      await expect(cards.nth(i)).toContainText(/混排|Mixed/);
    }
  });
});

test.describe('登入後操作', () => {
  test('登入後 FAB 出現「我的報名」按鈕', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('button:has-text("我的報名"), button:has-text("My Signups")')).toBeVisible({ timeout: 15000 });
  });

  test('登入後 FAB 選單有「我的開場」選項', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForLoadState('networkidle');

    const menuBtn = page.locator('button[title="選單"], button:has-text("≡")').first();
    await menuBtn.waitFor({ state: 'visible', timeout: 15000 });
    await menuBtn.click();
    await expect(page.locator('button:has-text("我的開場"), button:has-text("My Sessions")')).toBeVisible({ timeout: 5000 });
  });
});
