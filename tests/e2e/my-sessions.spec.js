import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth.js';
import { createTestSession, deleteTestSession } from '../helpers/session.js';

test.describe.serial('我的開場頁面', () => {
  let sessionId;

  test.beforeAll(async () => {
    sessionId = await createTestSession('mixed');
    console.log(`\n🏐 我的開場測試場次：${sessionId}`);
  });

  test.afterAll(async () => {
    await deleteTestSession(sessionId);
    console.log(`\n🗑️  刪除我的開場測試場次：${sessionId}`);
  });

  test('未登入顯示登入提示', async ({ page }) => {
    await page.goto('/my-sessions');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/請先登入|Please sign in/')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('button:has-text("Google")')).toBeVisible();
  });

  test('登入後頁面正確顯示標題和按鈕', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/my-sessions');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1:has-text("我的開場"), h1:has-text("My Sessions")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("建立新場次"), button:has-text("New Session")')).toBeVisible();
  });

  test('分頁列出正確 tab', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/my-sessions');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("我的開場"), h1:has-text("My Sessions")')).toBeVisible({ timeout: 10000 });

    await expect(page.locator('button:has-text("我的開場"), button:has-text("My")')).toBeVisible();
    await expect(page.locator('button:has-text("我的範本"), button:has-text("Templates")')).toBeVisible();
  });

  test('建立新場次按鈕開啟 CreateSessionSheet', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/my-sessions');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("我的開場"), h1:has-text("My Sessions")')).toBeVisible({ timeout: 10000 });

    await page.locator('button:has-text("建立新場次"), button:has-text("New Session")').click();

    // CreateSessionSheet 出現（底部滑出 sheet，含標題欄位）
    await expect(page.locator('input[placeholder], input[type="text"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('我的開場列表顯示測試場次', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/my-sessions');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("我的開場"), h1:has-text("My Sessions")')).toBeVisible({ timeout: 10000 });

    // 等資料載入
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);

    // 測試場次應出現在列表中
    const sessionCard = page.locator(`text=/\\[測試場次\\]/`).first();
    await expect(sessionCard).toBeVisible({ timeout: 10000 });
  });

  test('切換到「我的範本」tab', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/my-sessions');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("我的開場"), h1:has-text("My Sessions")')).toBeVisible({ timeout: 10000 });

    await page.locator('button:has-text("我的範本"), button:has-text("Templates")').click();
    // 等範本 loading 動畫消失（Supabase 查詢完成）
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);

    // 可能有範本或顯示空狀態
    const hasTemplate = await page.locator('text=/還沒有儲存任何範本|No templates/').isVisible();
    const itemCount = await page.locator('button:has-text("使用"), button:has-text("Use")').count();
    expect(hasTemplate || itemCount > 0).toBeTruthy();
  });

  test('首頁圖示可以回到首頁', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/my-sessions');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("我的開場"), h1:has-text("My Sessions")')).toBeVisible({ timeout: 10000 });

    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL(/\/$|\/\?/, { timeout: 5000 });
  });
});
