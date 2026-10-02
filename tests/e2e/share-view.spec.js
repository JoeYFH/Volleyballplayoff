import { test, expect } from '@playwright/test';
import { setLangZh } from '../helpers/auth.js';
import { createTestSession, deleteTestSession } from '../helpers/session.js';

test.describe.serial('分享頁面 /share/:id', () => {
  let sessionId;

  test.beforeAll(async () => {
    sessionId = await createTestSession('mixed');
    console.log(`\n🏐 分享頁面測試場次：${sessionId}`);
  });

  test.afterAll(async () => {
    await deleteTestSession(sessionId);
    console.log(`\n🗑️  刪除分享頁面測試場次：${sessionId}`);
  });

  test('正確顯示場次資訊', async ({ page }) => {
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    await expect(page.locator('text=/日期|Date/')).toBeVisible({ timeout: 10000 });

    // 基本欄位
    await expect(page.locator('text=/時間|Time/')).toBeVisible();
    await expect(page.locator('text=/地點|Location/')).toBeVisible();
    await expect(page.locator('text=/開團人|Organizer/')).toBeVisible();

    // 測試場次的地點是「測試球館」
    await expect(page.locator('text=測試球館')).toBeVisible();
  });

  test('顯示正確的場次類型標籤', async ({ page }) => {
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await expect(page.locator('text=/日期|Date/')).toBeVisible({ timeout: 10000 });

    // mixed session 應顯示「混排」
    await expect(page.locator('text=/混排|Mixed/')).toBeVisible();
  });

  test('「前往報名」按鈕連結包含 session id', async ({ page }) => {
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await expect(page.locator('text=/日期|Date/')).toBeVisible({ timeout: 10000 });

    const cta = page.locator('a:has-text("前往報名"), a:has-text("Sign Up Now")');
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toContain(sessionId);
  });

  test('「前往報名」導向首頁並帶 session 參數', async ({ page }) => {
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await expect(page.locator('text=/日期|Date/')).toBeVisible({ timeout: 10000 });

    await page.locator('a:has-text("前往報名"), a:has-text("Sign Up Now")').click();
    await expect(page).toHaveURL(new RegExp(`session=${sessionId}`), { timeout: 8000 });
  });

  test('無效的 session id 顯示錯誤狀態', async ({ page }) => {
    await setLangZh(page);
    await page.goto('/share/invalid-session-id-00000000');
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    await expect(page.locator('text=/找不到此活動|Session not found/')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a[href="/"]')).toBeVisible();
  });

  test('回首頁連結可用', async ({ page }) => {
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await expect(page.locator('text=/日期|Date/')).toBeVisible({ timeout: 10000 });

    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL(/\/$|\/\?/, { timeout: 5000 });
  });
});
