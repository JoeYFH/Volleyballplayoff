import { test, expect } from '@playwright/test';
import { setLangZh, loginAsTestUser } from '../helpers/auth.js';
import { fillSignupForm } from '../helpers/signup.js';
import { createTestSession, deleteTestSession } from '../helpers/session.js';

test.describe.serial('分享頁面 /share/:id 與 /og/:id', () => {
  let sessionId;

  test.beforeAll(async () => {
    sessionId = await createTestSession('mixed');
    console.log(`\n🏐 分享頁面測試場次：${sessionId}`);
  });

  test.afterAll(async () => {
    await deleteTestSession(sessionId);
    console.log(`\n🗑️  刪除分享頁面測試場次：${sessionId}`);
  });

  async function waitForShareCard(page) {
    await page.locator('div.rounded-3xl').waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    await expect(page.locator('text=/日期|Date/')).toBeVisible({ timeout: 10000 });
  }

  // ── 基本顯示 ────────────────────────────────────────────────

  test('正確顯示場次資訊', async ({ page }) => {
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    await expect(page.locator('text=/時間|Time/')).toBeVisible();
    await expect(page.locator('text=/地點|Location/')).toBeVisible();
    await expect(page.locator('text=/開團人|Organizer/')).toBeVisible();
    await expect(page.locator('text=測試球館')).toBeVisible();
  });

  test('顯示正確的場次類型標籤', async ({ page }) => {
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    await expect(page.locator('text=/混排|Mixed/')).toBeVisible();
  });

  test('/og/:id 路由也正確顯示場次資訊', async ({ page }) => {
    await setLangZh(page);
    await page.goto(`/og/${sessionId}`);
    await waitForShareCard(page);

    await expect(page.locator('text=測試球館')).toBeVisible();
    await expect(page.locator('text=/混排|Mixed/')).toBeVisible();
  });

  // ── 報名按鈕 ─────────────────────────────────────────────────

  test('報名開放時顯示「立即報名」按鈕', async ({ page }) => {
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    await expect(page.locator('button:has-text("立即報名"), button:has-text("Sign Up Now")')).toBeVisible();
  });

  test('點擊「立即報名」會開啟報名 modal（需登入）', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    await page.locator('button:has-text("立即報名"), button:has-text("Sign Up Now")').click();
    await expect(page.locator('div.fixed.inset-0.z-40')).toBeVisible({ timeout: 8000 });
  });

  test('可以在分享頁面完成報名（需登入）', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    await page.locator('button:has-text("立即報名"), button:has-text("Sign Up Now")').click();
    await expect(page.locator('div.fixed.inset-0.z-40')).toBeVisible({ timeout: 8000 });

    await fillSignupForm(page, { gender: 'male' });

    // Modal 關閉代表報名成功
    await expect(page.locator('div.fixed.inset-0.z-40')).toBeHidden({ timeout: 10000 });
  });

  // ── 錯誤與導航 ───────────────────────────────────────────────

  test('無效的 session id 顯示錯誤狀態', async ({ page }) => {
    await setLangZh(page);
    await page.goto('/share/invalid-session-id-00000000');
    await page.locator('div.rounded-3xl').waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});

    await expect(page.locator('text=/找不到此活動|Session not found/')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a[href="/"]')).toBeVisible();
  });

  test('回首頁連結可用', async ({ page }) => {
    await setLangZh(page);
    await page.goto(`/share/${sessionId}`);
    await waitForShareCard(page);

    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL(/\/$|\/\?/, { timeout: 5000 });
  });
});
