/**
 * 測試 3：畫面所有按鈕功能正常
 * 涵蓋：頁面跳轉、意見反饋、分享連結
 */
import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth.js';
import { createTestSession, deleteTestSession } from '../helpers/session.js';

test.describe.serial('頁面導覽與按鈕功能', () => {
  let sessionId;

  test.beforeAll(async () => {
    sessionId = await createTestSession('mixed');
    console.log(`\n🏐 導覽測試場次：${sessionId}`);
  });

  test.afterAll(async () => {
    await deleteTestSession(sessionId);
    console.log(`\n🗑️  刪除導覽測試場次：${sessionId}`);
  });

  // ── 意見反饋 ──
  test('FAB 意見反饋按鈕開啟 modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 等 Vue app 掛載完成（💬 FAB 出現即代表 app 已 render）
    const fab = page.locator('button[title="意見回饋"], button:has-text("💬")').first();
    await fab.waitFor({ state: 'visible', timeout: 15000 });
    await fab.click();

    // FeedbackModal：有 textarea 和送出按鈕
    await expect(page.locator('textarea')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button[type="submit"], button:has-text("送出"), button:has-text("Submit")')).toBeVisible();
  });

  test('填寫意見並送出成功', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const fab = page.locator('button[title="意見回饋"], button:has-text("💬")').first();
    await fab.waitFor({ state: 'visible', timeout: 15000 });
    await fab.click();
    await expect(page.locator('textarea')).toBeVisible({ timeout: 5000 });

    // 填寫描述（必填）
    await page.locator('textarea').fill('Playwright 自動測試 — 這是測試意見');

    // 送出
    await page.locator('button[type="submit"], button:has-text("送出"), button:has-text("Submit")').last().click();

    // 成功訊息 / modal 關閉（任一即可）
    const closed = page.locator('textarea');
    await expect(closed).toBeHidden({ timeout: 8000 });
  });

  // ── 頁面跳轉 ──
  test('FAB 選單開啟後可跳至「我的開場」', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForLoadState('networkidle');

    // 等選單按鈕出現後開啟 speed dial
    const menuBtn = page.locator('button[title="選單"], button:has-text("≡")').first();
    await menuBtn.waitFor({ state: 'visible', timeout: 15000 });
    await menuBtn.click();

    // 點「我的開場」
    await page.locator('button:has-text("我的開場"), button:has-text("My Sessions")').click();

    await expect(page).toHaveURL(/\/my-sessions/, { timeout: 5000 });
  });

  test('FAB「我的報名」跳至 /my-signups', async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
    await page.waitForLoadState('networkidle');

    const mySignupsBtn = page.locator('button:has-text("我的報名"), button:has-text("My Signups")').first();
    await mySignupsBtn.waitFor({ state: 'visible', timeout: 15000 });
    await mySignupsBtn.click();
    await expect(page).toHaveURL(/\/my-signups/, { timeout: 5000 });
  });

  test('「我的開場」頁面回首頁按鈕可用', async ({ page }) => {
    await page.goto('/my-sessions');
    await loginAsTestUser(page);
    await page.waitForLoadState('networkidle');

    // 首頁圖示按鈕（RouterLink to="/"）
    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL(/\/$|\/\?/, { timeout: 5000 });
  });

  // ── 分享功能 ──
  test('場次卡片「分享」按鈕顯示分享 modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 等 filter bar 載入後切到「所有」確保場次可見
    const allBtn = page.locator('button:has-text("所有"), button:has-text("All")').first();
    await allBtn.waitFor({ state: 'visible', timeout: 12000 });
    await allBtn.click();
    await page.waitForTimeout(400);

    const card = page.locator(`#card-${sessionId}`);
    await expect(card).toBeVisible({ timeout: 10000 });

    await card.locator('button:has-text("分享"), button:has-text("Share")').click();

    // 分享 modal 有 URL input 和複製按鈕
    await expect(page.locator('input[readonly]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("複製"), button:has-text("Copy")')).toBeVisible();
  });

  test('分享 modal 中 URL 包含正確的 session id', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const allBtn = page.locator('button:has-text("所有"), button:has-text("All")').first();
    await allBtn.waitFor({ state: 'visible', timeout: 12000 });
    await allBtn.click();
    await page.waitForTimeout(400);

    const card = page.locator(`#card-${sessionId}`);
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.locator('button:has-text("分享"), button:has-text("Share")').click();

    const urlInput = page.locator('input[readonly]');
    await expect(urlInput).toBeVisible({ timeout: 5000 });
    const shareUrl = await urlInput.inputValue();
    expect(shareUrl).toContain(sessionId);
  });

  // ── 測試資料 creator 顯示 ──
  test('場次卡片顯示正確的舉辦人名稱', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const allBtn = page.locator('button:has-text("所有"), button:has-text("All")').first();
    await allBtn.waitFor({ state: 'visible', timeout: 12000 });
    await allBtn.click();
    await page.waitForTimeout(400);

    const card = page.locator(`#card-${sessionId}`);
    await expect(card).toBeVisible({ timeout: 10000 });

    // creator_name 應來自真實測試帳號，不會是 null 或 'test'
    await expect(card.locator('text=/舉辦人|By/')).toBeVisible();
    await expect(card).not.toContainText('By: test');
    await expect(card).not.toContainText('舉辦人: test');
  });
});
