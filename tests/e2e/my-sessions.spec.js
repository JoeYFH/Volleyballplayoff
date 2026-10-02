import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth.js';
import { createTestSession, deleteTestSession, deleteTestTemplates } from '../helpers/session.js';

test.describe.serial('我的開場頁面', () => {
  let sessionId;
  let testTemplateName;

  test.beforeAll(async () => {
    sessionId = await createTestSession('mixed');
    testTemplateName = `[測試範本] ${Date.now()}`;
    console.log(`\n🏐 我的開場測試場次：${sessionId}`);
  });

  test.afterAll(async () => {
    await deleteTestSession(sessionId);
    await deleteTestTemplates();
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

  test('建立範本', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/my-sessions');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("我的開場"), h1:has-text("My Sessions")')).toBeVisible({ timeout: 10000 });

    // 開啟建立場次 sheet
    await page.locator('button:has-text("建立新場次"), button:has-text("New Session")').click();
    const titleInput = page.locator('input[placeholder*="第15週"], input[placeholder*="Week 15"]').first();
    await expect(titleInput).toBeVisible({ timeout: 8000 });
    await titleInput.fill('[測試] 範本用場次');

    // 攔截 prompt 對話框，填入範本名稱
    page.once('dialog', async (dialog) => {
      if (dialog.type() === 'prompt') await dialog.accept(testTemplateName);
      else await dialog.dismiss();
    });
    await page.locator('button:has-text("儲存為範本"), button:has-text("Save as Template")').click();
    await page.waitForTimeout(1500);

    // 關閉 sheet
    await page.locator('button:has-text("✕")').click();
    await page.waitForTimeout(500);

    // 切換到「我的範本」tab 確認範本出現
    await page.locator('button:has-text("我的範本"), button:has-text("Templates")').click();
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);

    await expect(page.locator(`text=${testTemplateName}`)).toBeVisible({ timeout: 10000 });
  });

  test('編輯範本名稱', async ({ page }) => {
    const editedName = testTemplateName + ' 已編輯';

    await loginAsTestUser(page);
    await page.goto('/my-sessions');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("我的開場"), h1:has-text("My Sessions")')).toBeVisible({ timeout: 10000 });

    await page.locator('button:has-text("我的範本"), button:has-text("Templates")').click();
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);

    // 點擊測試範本的 ✏️ 按鈕
    const templateCard = page.locator('div.bg-white.rounded-xl').filter({ hasText: testTemplateName });
    await templateCard.locator('button:has-text("✏️")').click();

    // 確認 sheet 以「編輯範本」模式開啟
    await expect(page.locator('h2:has-text("編輯範本"), h2:has-text("Edit Template")')).toBeVisible({ timeout: 8000 });

    // 清除範本名稱欄位並填入新名稱
    const nameInput = page.locator('input[placeholder*="週五臨打範本"], input[placeholder*="Friday Pickup"]').first();
    await nameInput.clear();
    await nameInput.fill(editedName);

    // 點擊更新範本（submit 按鈕）
    await page.locator('button:has-text("更新範本"), button:has-text("Update Template")').last().click();
    await page.waitForTimeout(1500);

    // 等待範本列表重新載入，確認新名稱出現
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page.locator(`text=${editedName}`)).toBeVisible({ timeout: 10000 });
  });

  test('刪除範本', async ({ page }) => {
    const editedName = testTemplateName + ' 已編輯';

    await loginAsTestUser(page);
    await page.goto('/my-sessions');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("我的開場"), h1:has-text("My Sessions")')).toBeVisible({ timeout: 10000 });

    await page.locator('button:has-text("我的範本"), button:has-text("Templates")').click();
    await page.locator('.animate-bounce').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);

    // 攔截 confirm 對話框，接受刪除
    const templateCard = page.locator('div.bg-white.rounded-xl').filter({ hasText: editedName });
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await templateCard.locator('button:has-text("🗑️")').click();
    await page.waitForTimeout(1500);

    // 確認範本已從列表消失
    await expect(page.locator(`text=${editedName}`)).not.toBeVisible({ timeout: 5000 });
  });
});
