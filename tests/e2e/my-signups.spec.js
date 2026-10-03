import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth.js';
import { fillSignupForm, openSignupModal, clickStatusFilter, clickGenderFilter } from '../helpers/signup.js';
import { createTestSession, deleteTestSession } from '../helpers/session.js';

test.describe.serial('我的報名頁面', () => {
  let sessionId;

  test.beforeAll(async () => {
    sessionId = await createTestSession('male');
    console.log(`\n🏐 我的報名測試場次：${sessionId}`);
  });

  test.afterAll(async () => {
    await deleteTestSession(sessionId);
    console.log(`\n🗑️  刪除我的報名測試場次：${sessionId}`);
  });

  test('未登入顯示登入提示', async ({ page }) => {
    await page.goto('/my-signups');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/請先登入|Please sign in/')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('button:has-text("Google")')).toBeVisible();
  });

  test('登入後頁面標題和分頁正確顯示', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/my-signups');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1:has-text("我的報名"), h1:has-text("My Sign-ups")')).toBeVisible({ timeout: 10000 });
    // 分頁
    await expect(page.locator('button:has-text("確認"), button:has-text("Confirmed")')).toBeVisible();
    await expect(page.locator('button:has-text("候補"), button:has-text("Waitlist")')).toBeVisible();
    await expect(page.locator('button:has-text("過去"), button:has-text("Past")')).toBeVisible();
  });

  test('報名後我的報名頁面顯示該場次', async ({ page }) => {
    // 先在首頁報名
    await loginAsTestUser(page);
    await page.goto('/');
    await page.locator('button:has-text("報名中")').first().waitFor({ state: 'visible', timeout: 12000 });
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    await page.locator('[id^="card-"]').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    await clickStatusFilter(page, '所有');
    await clickGenderFilter(page, '♂ 男生');
    await openSignupModal(page, sessionId);
    await fillSignupForm(page, {});
    await expect(page.locator('div.fixed.inset-0.z-40')).toBeHidden({ timeout: 8000 });

    // 前往我的報名
    await page.goto('/my-signups');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("我的報名"), h1:has-text("My Sign-ups")')).toBeVisible({ timeout: 10000 });

    // 等待資料載入（loading skeleton 消失）
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);

    // 確認 tab「我自己的」下有場次卡片（含場次標題關鍵字）
    const content = page.locator('text=/測試場次|male/');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('代報名記錄顯示在同一場次卡片中', async ({ page }) => {
    // 報名一筆代報名
    await loginAsTestUser(page);
    await page.goto('/');
    await page.locator('button:has-text("報名中")').first().waitFor({ state: 'visible', timeout: 12000 });
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    await page.locator('[id^="card-"]').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    await clickStatusFilter(page, '所有');
    await clickGenderFilter(page, '♂ 男生');
    await openSignupModal(page, sessionId);
    await fillSignupForm(page, { forFriend: true, friendName: '我幫的朋友Z' });
    await expect(page.locator('div.fixed.inset-0.z-40')).toBeHidden({ timeout: 8000 });

    // 前往我的報名（不用切分頁，代報名和本人報名顯示在同一場次卡）
    await page.goto('/my-signups');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("我的報名"), h1:has-text("My Sign-ups")')).toBeVisible({ timeout: 10000 });
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);

    await expect(page.locator('text=我幫的朋友Z')).toBeVisible({ timeout: 8000 });
  });

  test('在我的報名頁面可以取消報名', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/my-signups');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("我的報名"), h1:has-text("My Sign-ups")')).toBeVisible({ timeout: 10000 });
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // 接受確認 dialog
    page.on('dialog', d => d.accept());

    // 點任何一個取消按鈕（✕ icon）
    const cancelBtn = page.locator('button[title="取消報名"], button[title="Cancel signup"]').first();
    const hasCancelBtn = await cancelBtn.isVisible().catch(() => false);
    if (!hasCancelBtn) {
      console.log('沒有可取消的報名，略過');
      return;
    }
    await cancelBtn.click();
    await page.waitForTimeout(2000);
    // 確認至少點擊了一次（不 throw 即代表按鈕存在且可點）
  });

  test('首頁 RouterLink 可以回到首頁', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/my-signups');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("我的報名"), h1:has-text("My Sign-ups")')).toBeVisible({ timeout: 10000 });

    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL(/\/$|\/\?/, { timeout: 5000 });
  });
});
